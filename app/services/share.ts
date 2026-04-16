import { getProjectById, listProjects, type StoredProject } from '@/services/projects-api';

export interface ShareProjectPayload {
  name: string;
  description: string;
  files: Record<string, string>;
}

export interface GalleryProjectSummary {
  id: string;
  name: string;
  description: string;
  shareId?: string;
  updatedAt: number;
}

const SHARES_KEY = 'coderx_shared_projects';

interface StoredShare {
  shareId: string;
  project: ShareProjectPayload;
  updatedAt: number;
}

function hasStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function readShares(): StoredShare[] {
  if (!hasStorage()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(SHARES_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed) ? (parsed as StoredShare[]) : [];
  } catch {
    return [];
  }
}

function writeShares(shares: StoredShare[]) {
  if (!hasStorage()) {
    return;
  }

  localStorage.setItem(SHARES_KEY, JSON.stringify(shares));
}

function toSummary(project: StoredProject): GalleryProjectSummary {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    shareId: project.id,
    updatedAt: project.updatedAt,
  };
}

export async function fetchGallery(limit = 36, offset = 0): Promise<{ projects: GalleryProjectSummary[] }> {
  return {
    projects: listProjects(limit, offset).map(toSummary),
  };
}

export async function fetchSharedProject(shareId: string): Promise<{ project: ShareProjectPayload }> {
  const shares = readShares();
  const fromShare = shares.find((entry) => entry.shareId === shareId);

  if (fromShare) {
    return { project: fromShare.project };
  }

  const fromProject = getProjectById(shareId);

  if (fromProject) {
    return {
      project: {
        name: fromProject.name,
        description: fromProject.description,
        files: fromProject.files,
      },
    };
  }

  throw new Error('Shared project not found.');
}

export async function shareProject(shareId: string, project: ShareProjectPayload) {
  const shares = readShares();
  const index = shares.findIndex((entry) => entry.shareId === shareId);
  const next: StoredShare = {
    shareId,
    project,
    updatedAt: Date.now(),
  };

  if (index >= 0) {
    shares[index] = next;
  } else {
    shares.unshift(next);
  }

  writeShares(shares);

  return {
    shareId,
  };
}
