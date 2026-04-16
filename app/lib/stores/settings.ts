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
  developmentSkills: string[];
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

function normalizeDevelopmentSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) {
    return [];
  }

  const normalized = skills
    .map((skill) => (typeof skill === 'string' ? skill.trim() : ''))
    .filter((skill) => skill.length > 0)
    .slice(0, 30);

  return [...new Set(normalized)];
}

function getStoredDevelopmentSkills(): string[] {
  if (import.meta.env.SSR) {
    return [];
  }

  const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!rawSettings) {
    return [];
  }

  try {
    const parsedSettings = JSON.parse(rawSettings) as { developmentSkills?: unknown };
    return normalizeDevelopmentSkills(parsedSettings.developmentSkills);
  } catch {
    return [];
  }
}

function persistSettings(settings: Settings) {
  if (import.meta.env.SSR) {
    return;
  }

  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({
      llm: settings.llm,
      developmentSkills: settings.developmentSkills,
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
export const developmentSkillsStore = map<string[]>(getStoredDevelopmentSkills());

export const settingsStore = map<Settings>({
  shortcuts: shortcutsStore.get(),
  llm: llmSettingsStore.get(),
  developmentSkills: developmentSkillsStore.get(),
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

developmentSkillsStore.subscribe((skills) => {
  const normalizedSkills = normalizeDevelopmentSkills(skills);

  if (normalizedSkills.length !== skills.length || normalizedSkills.some((skill, index) => skill !== skills[index])) {
    developmentSkillsStore.set(normalizedSkills);
    return;
  }

  const next = {
    ...settingsStore.get(),
    developmentSkills: normalizedSkills,
  };

  settingsStore.set(next);
  persistSettings(next);
});
