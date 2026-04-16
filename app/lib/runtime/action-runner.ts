import { WebContainer } from '@webcontainer/api';
import { map, type MapStore } from 'nanostores';
import * as nodePath from 'node:path';
import type { CoderxAction } from '~/types/actions';
import { createScopedLogger } from '~/utils/logger';
import { unreachable } from '~/utils/unreachable';
import type { ActionCallbackData } from './message-parser';

const logger = createScopedLogger('ActionRunner');

const PACKAGE_REPLACEMENTS: Record<string, string[]> = {
  '@material-ui/lab': ['@mui/lab', '@mui/material', '@emotion/react', '@emotion/styled'],
  '@material-ui/core': ['@mui/material', '@emotion/react', '@emotion/styled'],
  '@material-ui/icons': ['@mui/icons-material'],
  'react-tailwind': ['tailwindcss'],
};

const IMPORT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/from\s+['"]@material-ui\/lab['"]/g, "from '@mui/lab'"],
  [/from\s+['"]@material-ui\/core['"]/g, "from '@mui/material'"],
  [/from\s+['"]@material-ui\/icons['"]/g, "from '@mui/icons-material'"],
];

function tokenizeCommand(content: string) {
  return content.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
}

function getPackageName(token: string) {
  if (!token || token.startsWith('-')) {
    return null;
  }

  if (token.startsWith('@')) {
    const slashIndex = token.indexOf('/');

    if (slashIndex === -1) {
      return token;
    }

    const versionIndex = token.indexOf('@', slashIndex + 1);
    return versionIndex === -1 ? token : token.slice(0, versionIndex);
  }

  const versionIndex = token.indexOf('@');
  return versionIndex === -1 ? token : token.slice(0, versionIndex);
}

function normalizeInstallCommand(content: string) {
  const tokens = tokenizeCommand(content);

  if (tokens.length < 2) {
    return content;
  }

  const tool = tokens[0];
  const subcommand = tokens[1];
  const isInstallCommand =
    (tool === 'npm' && (subcommand === 'install' || subcommand === 'i')) ||
    (tool === 'pnpm' && (subcommand === 'add' || subcommand === 'install' || subcommand === 'i')) ||
    (tool === 'yarn' && (subcommand === 'add' || subcommand === 'install'));

  if (!isInstallCommand) {
    return content;
  }

  const rest = tokens.slice(2);

  // npm/pnpm/yarn install without explicit package names should stay untouched.
  if (rest.length === 0) {
    return content;
  }

  const flags: string[] = [];
  const packages: string[] = [];
  let changed = false;

  for (const token of rest) {
    if (token.startsWith('-')) {
      flags.push(token);
      continue;
    }

    const pkgName = getPackageName(token);

    if (!pkgName) {
      packages.push(token);
      continue;
    }

    const replacement = PACKAGE_REPLACEMENTS[pkgName];

    if (replacement) {
      packages.push(...replacement);
      changed = true;
      logger.debug(`Rewrote deprecated package ${pkgName} -> ${replacement.join(', ')}`);
      continue;
    }

    packages.push(token);
  }

  if (!changed) {
    return content;
  }

  const seen = new Set<string>();
  const dedupedPackages = packages.filter((pkg) => {
    if (seen.has(pkg)) {
      return false;
    }

    seen.add(pkg);
    return true;
  });

  return [tool, subcommand, ...flags, ...dedupedPackages].join(' ');
}

function normalizeFileContent(filePath: string, content: string) {
  if (!/\.(c|m)?(t|j)sx?$/.test(filePath)) {
    return content;
  }

  let normalized = content;

  for (const [pattern, replacement] of IMPORT_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized;
}

export type ActionStatus = 'pending' | 'running' | 'complete' | 'aborted' | 'failed';

export type BaseActionState = CoderxAction & {
  status: Exclude<ActionStatus, 'failed'>;
  abort: () => void;
  executed: boolean;
  abortSignal: AbortSignal;
};

export type FailedActionState = CoderxAction &
  Omit<BaseActionState, 'status'> & {
    status: Extract<ActionStatus, 'failed'>;
    error: string;
  };

export type ActionState = BaseActionState | FailedActionState;

type BaseActionUpdate = Partial<Pick<BaseActionState, 'status' | 'abort' | 'executed'>>;

export type ActionStateUpdate =
  | BaseActionUpdate
  | (Omit<BaseActionUpdate, 'status'> & { status: 'failed'; error: string });

type ActionsMap = MapStore<Record<string, ActionState>>;

export class ActionRunner {
  #webcontainer: Promise<WebContainer>;
  #currentExecutionPromise: Promise<void> = Promise.resolve();

  actions: ActionsMap = map({});

  constructor(webcontainerPromise: Promise<WebContainer>) {
    this.#webcontainer = webcontainerPromise;
  }

  addAction(data: ActionCallbackData) {
    const { actionId } = data;

    const actions = this.actions.get();
    const action = actions[actionId];

    if (action) {
      // action already added
      return;
    }

    const abortController = new AbortController();

    this.actions.setKey(actionId, {
      ...data.action,
      status: 'pending',
      executed: false,
      abort: () => {
        abortController.abort();
        this.#updateAction(actionId, { status: 'aborted' });
      },
      abortSignal: abortController.signal,
    });

    this.#currentExecutionPromise.then(() => {
      const currentAction = this.actions.get()[actionId];

      if (!currentAction || currentAction.abortSignal.aborted || currentAction.status === 'aborted') {
        return;
      }

      this.#updateAction(actionId, { status: 'running' });
    });
  }

  async runAction(data: ActionCallbackData) {
    const { actionId } = data;
    const action = this.actions.get()[actionId];

    if (!action) {
      unreachable(`Action ${actionId} not found`);
    }

    if (action.executed) {
      return;
    }

    if (action.abortSignal.aborted) {
      this.#updateAction(actionId, { status: 'aborted', executed: true });
      return;
    }

    this.#updateAction(actionId, { ...action, ...data.action, executed: true });

    this.#currentExecutionPromise = this.#currentExecutionPromise
      .then(() => {
        return this.#executeAction(actionId);
      })
      .catch((error) => {
        console.error('Action failed:', error);
      });
  }

  abortAllActions() {
    const actions = this.actions.get();

    for (const [actionId, action] of Object.entries(actions)) {
      if (action.status === 'complete' || action.status === 'failed' || action.status === 'aborted') {
        continue;
      }

      action.abort();
      this.#updateAction(actionId, { executed: true });
    }
  }

  async #executeAction(actionId: string) {
    const action = this.actions.get()[actionId];

    if (action.abortSignal.aborted) {
      this.#updateAction(actionId, { status: 'aborted' });
      return;
    }

    this.#updateAction(actionId, { status: 'running' });

    try {
      switch (action.type) {
        case 'shell': {
          await this.#runShellAction(action);
          break;
        }
        case 'file': {
          await this.#runFileAction(action);
          break;
        }
      }

      this.#updateAction(actionId, { status: action.abortSignal.aborted ? 'aborted' : 'complete' });
    } catch (error) {
      this.#updateAction(actionId, { status: 'failed', error: 'Action failed' });

      // re-throw the error to be caught in the promise chain
      throw error;
    }
  }

  async #runShellAction(action: ActionState) {
    if (action.type !== 'shell') {
      unreachable('Expected shell action');
    }

    if (action.abortSignal.aborted) {
      return;
    }

    const webcontainer = await this.#webcontainer;

    const normalizedCommand = normalizeInstallCommand(action.content);

    if (normalizedCommand !== action.content) {
      logger.debug(`Normalized shell command: ${normalizedCommand}`);
    }

    const process = await webcontainer.spawn('jsh', ['-c', normalizedCommand], {
      env: { npm_config_yes: true },
    });

    action.abortSignal.addEventListener('abort', () => {
      process.kill();
    }, { once: true });

    void process.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
        },
      }),
    ).catch(() => undefined);

    const exitCode = await process.exit;

    logger.debug(`Process terminated with code ${exitCode}`);
  }

  async #runFileAction(action: ActionState) {
    if (action.type !== 'file') {
      unreachable('Expected file action');
    }

    const webcontainer = await this.#webcontainer;

    let folder = nodePath.dirname(action.filePath);

    // remove trailing slashes
    folder = folder.replace(/\/+$/g, '');

    if (folder !== '.') {
      try {
        await webcontainer.fs.mkdir(folder, { recursive: true });
        logger.debug('Created folder', folder);
      } catch (error) {
        logger.error('Failed to create folder\n\n', error);
      }
    }

    try {
      const normalizedContent = normalizeFileContent(action.filePath, action.content);
      await webcontainer.fs.writeFile(action.filePath, normalizedContent);
      logger.debug(`File written ${action.filePath}`);
    } catch (error) {
      logger.error('Failed to write file\n\n', error);
    }
  }

  #updateAction(id: string, newState: ActionStateUpdate) {
    const actions = this.actions.get();

    this.actions.setKey(id, { ...actions[id], ...newState });
  }
}
