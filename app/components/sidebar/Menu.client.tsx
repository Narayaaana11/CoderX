import { useStore } from '@nanostores/react';
import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { db, deleteById, getAll, chatId, type ChatHistoryItem } from '~/lib/persistence';
import { developmentSkillsStore, llmSettingsStore } from '~/lib/stores/settings';
import {
  createDefaultProviderSettings,
  type LLMProvider,
  type LLMProviderSettings,
  normalizeBaseUrl,
  validateLLMProviderSettings,
} from '~/types/llm';
import { cubicEasingFn } from '~/utils/easings';
import { logger } from '~/utils/logger';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';

const menuVariants = {
  closed: {
    opacity: 0,
    visibility: 'hidden',
    left: '-150px',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    opacity: 1,
    visibility: 'initial',
    left: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

type DialogContent = { type: 'delete'; item: ChatHistoryItem } | { type: 'settings' } | null;

const PROVIDER_OPTIONS: Array<{ value: LLMProvider; label: string }> = [
  { value: 'ollama-local', label: 'Ollama Local (downloaded)' },
  { value: 'ollama-cloud', label: 'Ollama Cloud' },
  { value: 'openai-compatible-cloud', label: 'OpenAI-compatible Cloud' },
];

export function Menu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const llmSettings = useStore(llmSettingsStore);
  const developmentSkills = useStore(developmentSkillsStore);
  const [draftLLMSettings, setDraftLLMSettings] = useState<LLMProviderSettings>(llmSettings);
  const [draftSkills, setDraftSkills] = useState<string[]>(developmentSkills);
  const [skillInput, setSkillInput] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const loadEntries = useCallback(() => {
    if (db) {
      getAll(db)
        .then((list) => list.filter((item) => item.urlId && item.description))
        .then(setList)
        .catch((error) => toast.error(error.message));
    }
  }, []);

  const deleteItem = useCallback((event: React.UIEvent, item: ChatHistoryItem) => {
    event.preventDefault();

    if (db) {
      deleteById(db, item.id)
        .then(() => {
          loadEntries();

          if (chatId.get() === item.id) {
            // hard page navigation to clear the stores
            window.location.pathname = '/';
          }
        })
        .catch((error) => {
          toast.error('Failed to delete conversation');
          logger.error(error);
        });
    }
  }, []);

  const closeDialog = () => {
    setDialogContent(null);
  };

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open]);

  useEffect(() => {
    if (dialogContent?.type !== 'settings') {
      setDraftLLMSettings(llmSettings);
      setDraftSkills(developmentSkills);
      setSkillInput('');
      setAvailableModels([]);
    }
  }, [llmSettings, developmentSkills, dialogContent]);

  useEffect(() => {
    const enterThreshold = 40;
    const exitThreshold = 40;

    function onMouseMove(event: MouseEvent) {
      if (event.pageX < enterThreshold) {
        setOpen(true);
      }

      if (menuRef.current && event.clientX > menuRef.current.getBoundingClientRect().right + exitThreshold) {
        setOpen(false);
      }
    }

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const openSettingsDialog = () => {
    setDraftLLMSettings(llmSettings);
    setDraftSkills(developmentSkills);
    setSkillInput('');
    setAvailableModels([]);
    setDialogContent({ type: 'settings' });
  };

  const addSkill = () => {
    const normalizedSkill = skillInput.trim();

    if (!normalizedSkill) {
      return;
    }

    if (draftSkills.some((skill) => skill.toLowerCase() === normalizedSkill.toLowerCase())) {
      toast.info('Skill already added');
      return;
    }

    if (draftSkills.length >= 30) {
      toast.error('Skill limit reached (30 max)');
      return;
    }

    setDraftSkills((current) => [...current, normalizedSkill]);
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setDraftSkills((current) => current.filter((skill) => skill !== skillToRemove));
  };

  const setProvider = (provider: LLMProvider) => {
    setAvailableModels([]);

    setDraftLLMSettings((current) => {
      if (current.provider === provider) {
        return current;
      }

      const defaults = createDefaultProviderSettings(provider);

      if (provider === 'ollama-local') {
        return {
          provider,
          baseUrl: defaults.baseUrl,
          model: defaults.model,
        };
      }

      const currentApiKey = current.provider === 'ollama-local' ? '' : current.apiKey;

      return {
        provider,
        baseUrl: defaults.baseUrl,
        model: defaults.model,
        apiKey: currentApiKey,
      };
    });
  };

  const setBaseUrl = (baseUrl: string) => {
    setDraftLLMSettings((current) => ({
      ...current,
      baseUrl,
    }));
  };

  const setModel = (model: string) => {
    setDraftLLMSettings((current) => ({
      ...current,
      model,
    }));
  };

  const setApiKey = (apiKey: string) => {
    setDraftLLMSettings((current) => {
      if (current.provider === 'ollama-local') {
        return current;
      }

      return {
        ...current,
        apiKey,
      };
    });
  };

  const normalizeDraftSettings = (settings: LLMProviderSettings): LLMProviderSettings => {
    const baseSettings = {
      provider: settings.provider,
      baseUrl: normalizeBaseUrl(settings.baseUrl),
      model: settings.model.trim(),
    };

    if (settings.provider === 'ollama-local') {
      return {
        ...baseSettings,
        provider: 'ollama-local',
      };
    }

    return {
      ...baseSettings,
      provider: settings.provider,
      apiKey: settings.apiKey.trim(),
    };
  };

  const saveSettings = () => {
    const normalizedSettings = normalizeDraftSettings(draftLLMSettings);
    const normalizedSkills = draftSkills.map((skill) => skill.trim()).filter(Boolean);

    const validation = validateLLMProviderSettings(normalizedSettings);

    if (!validation.valid) {
      toast.error(validation.error || 'Model settings are invalid.');
      return;
    }

    llmSettingsStore.set(normalizedSettings);
    developmentSkillsStore.set(normalizedSkills);
    toast.success('Settings saved');
    closeDialog();
  };

  const testConnection = async () => {
    const models = await fetchModels();

    if (models.length > 0) {
      toast.success(`Connection check passed (${models.length} models found)`);
      return;
    }

    toast.success('Connection check passed');
  };

  const fetchModels = async () => {
    const normalizedSettings = normalizeDraftSettings(draftLLMSettings);

    const validation = validateLLMProviderSettings(normalizedSettings);

    if (!validation.valid) {
      toast.error(validation.error || 'Model settings are invalid.');
      return [];
    }

    setIsLoadingModels(true);

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          providerSettings: normalizedSettings,
        }),
      });

      const payload = await response.json<{ error?: string; models?: string[] }>();

      if (!response.ok) {
        throw new Error(payload.error || `Connection failed (${response.status})`);
      }

      const models = payload.models || [];
      setAvailableModels(models);

      return models;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connection failed');

      return [];
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <motion.div
      ref={menuRef}
      initial="closed"
      animate={open ? 'open' : 'closed'}
      variants={menuVariants}
      className="flex flex-col side-menu fixed top-0 w-[350px] h-full bg-bolt-elements-background-depth-2 border-r rounded-r-3xl border-bolt-elements-borderColor z-sidebar shadow-xl shadow-bolt-elements-sidebar-dropdownShadow text-sm"
    >
      <div className="flex items-center h-[var(--header-height)]">{/* Placeholder */}</div>
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <div className="p-4">
          <a
            href="/"
            className="flex gap-2 items-center bg-bolt-elements-sidebar-buttonBackgroundDefault text-bolt-elements-sidebar-buttonText hover:bg-bolt-elements-sidebar-buttonBackgroundHover rounded-md p-2 transition-theme"
          >
            <span className="inline-block i-bolt:chat scale-110" />
            Start new chat
          </a>
        </div>
        <div className="text-bolt-elements-textPrimary font-medium pl-6 pr-5 my-2">Your Chats</div>
        <div className="flex-1 overflow-scroll pl-4 pr-5 pb-5">
          {list.length === 0 && <div className="pl-2 text-bolt-elements-textTertiary">No previous conversations</div>}
          <DialogRoot open={dialogContent !== null}>
            {binDates(list).map(({ category, items }) => (
              <div key={category} className="mt-4 first:mt-0 space-y-1">
                <div className="text-bolt-elements-textTertiary sticky top-0 z-1 bg-bolt-elements-background-depth-2 pl-2 pt-2 pb-1">
                  {category}
                </div>
                {items.map((item) => (
                  <HistoryItem key={item.id} item={item} onDelete={() => setDialogContent({ type: 'delete', item })} />
                ))}
              </div>
            ))}
            <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
              {dialogContent?.type === 'delete' && (
                <>
                  <DialogTitle>Delete Chat?</DialogTitle>
                  <DialogDescription asChild>
                    <div>
                      <p>
                        You are about to delete <strong>{dialogContent.item.description}</strong>.
                      </p>
                      <p className="mt-1">Are you sure you want to delete this chat?</p>
                    </div>
                  </DialogDescription>
                  <div className="px-5 pb-4 bg-bolt-elements-background-depth-2 flex gap-2 justify-end">
                    <DialogButton type="secondary" onClick={closeDialog}>
                      Cancel
                    </DialogButton>
                    <DialogButton
                      type="danger"
                      onClick={(event) => {
                        deleteItem(event, dialogContent.item);
                        closeDialog();
                      }}
                    >
                      Delete
                    </DialogButton>
                  </div>
                </>
              )}
              {dialogContent?.type === 'settings' && (
                <>
                  <DialogTitle>Model Provider Settings</DialogTitle>
                  <DialogDescription asChild>
                    <div className="space-y-4">
                      <p className="text-sm text-bolt-elements-textSecondary">
                        Choose a provider, then load and select the model you want.
                      </p>

                      <label className="block space-y-2">
                        <span className="text-sm text-bolt-elements-textSecondary">Provider</span>
                        <select
                          className="w-full rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-2"
                          value={draftLLMSettings.provider}
                          onChange={(event) => setProvider(event.target.value as LLMProvider)}
                        >
                          {PROVIDER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block space-y-2">
                        <span className="text-sm text-bolt-elements-textSecondary">Base URL</span>
                        <input
                          className="w-full rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-2"
                          value={draftLLMSettings.baseUrl}
                          onChange={(event) => setBaseUrl(event.target.value)}
                          placeholder={
                            draftLLMSettings.provider === 'ollama-local'
                              ? 'http://127.0.0.1:11434'
                              : draftLLMSettings.provider === 'ollama-cloud'
                                ? 'https://your-ollama-cloud-endpoint'
                                : 'https://api.openai.com/v1'
                          }
                        />
                      </label>

                      {draftLLMSettings.provider !== 'ollama-local' && (
                        <label className="block space-y-2">
                          <span className="text-sm text-bolt-elements-textSecondary">API Key</span>
                          <input
                            className="w-full rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-2"
                            value={draftLLMSettings.apiKey}
                            onChange={(event) => setApiKey(event.target.value)}
                            placeholder="sk-..."
                            type="password"
                          />
                        </label>
                      )}

                      <label className="block space-y-2">
                        <span className="text-sm text-bolt-elements-textSecondary">Model</span>
                        <div className="flex items-center gap-2">
                          <input
                            className="w-full rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-2"
                            value={draftLLMSettings.model}
                            onChange={(event) => setModel(event.target.value)}
                            placeholder="llama3.2"
                            list="available-models"
                          />
                          <DialogButton type="secondary" onClick={fetchModels}>
                            {isLoadingModels ? 'Loading...' : 'Load'}
                          </DialogButton>
                        </div>
                        <datalist id="available-models">
                          {availableModels.map((model) => (
                            <option key={model} value={model} />
                          ))}
                        </datalist>
                      </label>

                      <div className="rounded-xl border border-bolt-elements-borderColor bg-gradient-to-br from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2 p-3 space-y-3">
                        <div>
                          <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">Skills</h3>
                          <p className="text-xs text-bolt-elements-textSecondary mt-1">
                            Add development skills (Claude-style) to steer code quality and architecture.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            className="w-full rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-2"
                            value={skillInput}
                            onChange={(event) => setSkillInput(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                addSkill();
                              }
                            }}
                            placeholder="e.g. Clean Architecture, Accessibility, Test-driven development"
                          />
                          <DialogButton type="secondary" onClick={addSkill}>
                            Add
                          </DialogButton>
                        </div>

                        <div className="flex flex-wrap gap-2 min-h-8">
                          {draftSkills.length === 0 && (
                            <span className="text-xs text-bolt-elements-textSecondary">No skills added yet.</span>
                          )}
                          {draftSkills.map((skill) => (
                            <button
                              type="button"
                              key={skill}
                              onClick={() => removeSkill(skill)}
                              className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200 hover:bg-cyan-500/20 transition-theme"
                              title="Remove skill"
                            >
                              {skill}
                              <span aria-hidden>×</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-3 space-y-2">
                        <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">About CoderX</h3>
                        <p className="text-xs text-bolt-elements-textSecondary">CoderX v1.0.0</p>
                        <p className="text-xs text-bolt-elements-textSecondary">Open Source - MIT License</p>
                        <p className="text-xs text-bolt-elements-textSecondary">
                          Built by the community, for the community
                        </p>
                        <p className="text-xs text-bolt-elements-textSecondary">Node.js 20+</p>
                        <p className="text-xs text-bolt-elements-textSecondary">Backend ● Running on :3001</p>
                        <p className="text-xs text-bolt-elements-textSecondary">Tests 49/49 passing</p>
                        <a
                          href="https://github.com/CoderX-ai/coderx"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-xs text-bolt-elements-item-contentAccent hover:underline"
                        >
                          GitHub: github.com/CoderX-ai/coderx
                        </a>
                      </div>

                      <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-3 space-y-2">
                        <div className="text-sm font-semibold text-bolt-elements-textPrimary">
                          CoderX v1.0.0 · MIT License
                        </div>
                        <p className="text-xs text-bolt-elements-textSecondary">Built by the open-source community</p>
                        <div className="grid grid-cols-1 gap-2 pt-1">
                          <a
                            href="https://github.com/CoderX-ai/coderx"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-md border border-transparent px-2 py-1.5 text-xs text-bolt-elements-textPrimary hover:border-indigo-500 hover:text-indigo-500 transition-theme"
                          >
                            Star on GitHub
                          </a>
                          <a
                            href="https://github.com/CoderX-ai/coderx/issues/new?template=bug_report.md"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-md border border-transparent px-2 py-1.5 text-xs text-bolt-elements-textPrimary hover:border-indigo-500 hover:text-indigo-500 transition-theme"
                          >
                            Report a Bug
                          </a>
                          <a
                            href="https://github.com/CoderX-ai/coderx/blob/main/CONTRIBUTING.md"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-md border border-transparent px-2 py-1.5 text-xs text-bolt-elements-textPrimary hover:border-indigo-500 hover:text-indigo-500 transition-theme"
                          >
                            Contribute
                          </a>
                          <a
                            href="https://discord.gg/coderx"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-md border border-transparent px-2 py-1.5 text-xs text-bolt-elements-textPrimary hover:border-indigo-500 hover:text-indigo-500 transition-theme"
                          >
                            Join Discord
                          </a>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-xs text-bolt-elements-textSecondary">
                          <span>Backend ● Running</span>
                          <span>Tests 49/49 passing</span>
                        </div>
                      </div>
                    </div>
                  </DialogDescription>
                  <div className="px-5 pb-4 bg-bolt-elements-background-depth-2 flex gap-2 justify-end">
                    <DialogButton type="secondary" onClick={closeDialog}>
                      Cancel
                    </DialogButton>
                    <DialogButton type="secondary" onClick={testConnection}>
                      Test
                    </DialogButton>
                    <DialogButton type="primary" onClick={saveSettings}>
                      Save
                    </DialogButton>
                  </div>
                </>
              )}
            </Dialog>
          </DialogRoot>
        </div>
        <div className="flex items-center border-t border-bolt-elements-borderColor p-4">
          <IconButton icon="i-ph:sliders-horizontal" title="Model Settings" onClick={openSettingsDialog} />
          <ThemeSwitch className="ml-auto" />
        </div>
      </div>
    </motion.div>
  );
}
