import { spawn, spawnSync } from 'node:child_process';

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_MODEL = 'qwen3-coder:480b-cloud';
const isWindows = process.platform === 'win32';

function log(message) {
  console.log(`[local:start] ${message}`);
}

function commandExists(command, args = ['--version']) {
  const result = spawnSync(command, args, {
    stdio: 'ignore',
    shell: false,
    windowsHide: true,
  });

  return result.status === 0;
}

function resolveOllamaCommand() {
  const candidates = [];

  if (process.env.OLLAMA_PATH) {
    candidates.push(process.env.OLLAMA_PATH);
  }

  if (isWindows && process.env.LOCALAPPDATA) {
    candidates.push(`${process.env.LOCALAPPDATA}\\Programs\\Ollama\\ollama.exe`);
  }

  candidates.push(isWindows ? 'ollama.exe' : 'ollama');

  for (const candidate of candidates) {
    if (commandExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function isOllamaServing(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(baseUrl, timeoutMs = 15000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (await isOllamaServing(baseUrl)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

function startDetachedOllamaServer(ollamaCommand) {
  const child = spawn(ollamaCommand, ['serve'], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    shell: false,
  });

  child.unref();
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
      ...options,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
    });

    child.on('error', (error) => reject(error));
  });
}

async function ensureModel(ollamaCommand, model) {
  const listResult = spawnSync(ollamaCommand, ['list'], {
    encoding: 'utf8',
    windowsHide: true,
  });

  const output = `${listResult.stdout || ''}\n${listResult.stderr || ''}`;

  if (output.toLowerCase().includes(model.toLowerCase())) {
    log(`Model already available: ${model}`);
    return;
  }

  log(`Model not found. Pulling ${model}...`);
  await runCommand(ollamaCommand, ['pull', model]);
}

function resolveNpxCommand() {
  return isWindows ? 'npx.cmd' : 'npx';
}

async function main() {
  const baseUrl = process.env.OLLAMA_BASE_URL || DEFAULT_BASE_URL;
  const model = process.env.OLLAMA_MODEL || DEFAULT_MODEL;
  const ollamaCommand = resolveOllamaCommand();

  if (!ollamaCommand) {
    console.error('[local:start] Ollama was not found in PATH. Install Ollama or set OLLAMA_PATH.');
    process.exit(1);
  }

  const serving = await isOllamaServing(baseUrl);

  if (!serving) {
    log('Starting Ollama server in background...');
    startDetachedOllamaServer(ollamaCommand);

    const ready = await waitForServer(baseUrl);

    if (!ready) {
      console.error(`[local:start] Ollama did not become ready at ${baseUrl} in time.`);
      process.exit(1);
    }
  } else {
    log(`Ollama server already running at ${baseUrl}`);
  }

  await ensureModel(ollamaCommand, model);

  log('Starting app preview...');

  const npxCommand = resolveNpxCommand();
  await runCommand(npxCommand, ['pnpm', 'preview']);
}

main().catch((error) => {
  console.error(`[local:start] ${error.message}`);
  process.exit(1);
});
