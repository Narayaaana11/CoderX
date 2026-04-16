export interface StoredProject {
  id: string;
  name: string;
  description: string;
  files: Record<string, string>;
  updatedAt: number;
}

const PROJECTS_KEY = 'coderx_projects';

function hasStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function readProjects(): StoredProject[] {
  if (!hasStorage()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(PROJECTS_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed) ? (parsed as StoredProject[]) : [];
  } catch {
    return [];
  }
}

function writeProjects(projects: StoredProject[]) {
  if (!hasStorage()) {
    return;
  }

  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function createProject(name: string, description = ''): StoredProject {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    name,
    description,
    files: {},
    updatedAt: Date.now(),
  };
}

export function saveProject(project: StoredProject): StoredProject {
  const projects = readProjects();
  const index = projects.findIndex((entry) => entry.id === project.id);
  const next: StoredProject = {
    ...project,
    updatedAt: Date.now(),
  };

  if (index >= 0) {
    projects[index] = next;
  } else {
    projects.unshift(next);
  }

  writeProjects(projects);
  return next;
}

export function listProjects(limit = 50, offset = 0): StoredProject[] {
  return readProjects().slice(offset, offset + limit);
}

export function getProjectById(id: string): StoredProject | null {
  return readProjects().find((entry) => entry.id === id) ?? null;
}
