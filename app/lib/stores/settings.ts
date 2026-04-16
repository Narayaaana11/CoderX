import { map } from 'nanostores';
import {
  type LLMProviderSettings,
  getDefaultLLMProviderSettings,
  normalizeBaseUrl,
  parseLLMProviderSettings,
} from '~/types/llm';
import { workbenchStore } from './workbench';

export interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  ctrlOrMetaKey?: boolean;
  action: () => void;
}

export interface Shortcuts {
  toggleTerminal: Shortcut;
}

export interface Settings {
  shortcuts: Shortcuts;
  llm: LLMProviderSettings;
}

const SETTINGS_STORAGE_KEY = 'bolt_settings';

function normalizeLLMSettings(settings: LLMProviderSettings): LLMProviderSettings {
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  const model = settings.model.trim();

  if (settings.provider === 'ollama-local') {
    return {
      provider: 'ollama-local',
      baseUrl,
      model,
    };
  }

  return {
    provider: settings.provider,
    baseUrl,
    model,
    apiKey: settings.apiKey.trim(),
  };
}

function areSameLLMSettings(a: LLMProviderSettings, b: LLMProviderSettings): boolean {
  if (a.provider !== b.provider || a.baseUrl !== b.baseUrl || a.model !== b.model) {
    return false;
  }

  if (a.provider === 'ollama-local' && b.provider === 'ollama-local') {
    return true;
  }

  if (a.provider !== 'ollama-local' && b.provider !== 'ollama-local') {
    return a.apiKey === b.apiKey;
  }

  return false;
}

function getStoredLLMSettings(): LLMProviderSettings {
  if (import.meta.env.SSR) {
    return getDefaultLLMProviderSettings();
  }

  const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!rawSettings) {
    return getDefaultLLMProviderSettings();
  }

  try {
    const parsedSettings = JSON.parse(rawSettings) as { llm?: unknown };

    if (!parsedSettings.llm) {
      return getDefaultLLMProviderSettings();
    }

    const parsedLLMSettings = parseLLMProviderSettings(parsedSettings.llm);

    if (parsedLLMSettings.success) {
      return normalizeLLMSettings(parsedLLMSettings.value);
    }
  } catch {
    return getDefaultLLMProviderSettings();
  }

  return getDefaultLLMProviderSettings();
}

function persistSettings(settings: Settings) {
  if (import.meta.env.SSR) {
    return;
  }

  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({
      llm: settings.llm,
    }),
  );
}

export const shortcutsStore = map<Shortcuts>({
  toggleTerminal: {
    key: 'j',
    ctrlOrMetaKey: true,
    action: () => workbenchStore.toggleTerminal(),
  },
});

export const llmSettingsStore = map<LLMProviderSettings>(getStoredLLMSettings());

export const settingsStore = map<Settings>({
  shortcuts: shortcutsStore.get(),
  llm: llmSettingsStore.get(),
});

shortcutsStore.subscribe((shortcuts) => {
  const next = {
    ...settingsStore.get(),
    shortcuts,
  };

  settingsStore.set(next);
  persistSettings(next);
});

llmSettingsStore.subscribe((llm) => {
  const normalizedLLM = normalizeLLMSettings(llm);

  if (!areSameLLMSettings(llm, normalizedLLM)) {
    llmSettingsStore.set(normalizedLLM);
    return;
  }

  const next = {
    ...settingsStore.get(),
    llm: normalizedLLM,
  };

  settingsStore.set(next);
  persistSettings(next);
});
