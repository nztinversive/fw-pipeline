import 'server-only';

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import { Project, ShareLink, ViewMode, AudienceType, AUDIENCE_VIEW_MAP, STAGES } from './types';
import { sampleProjects } from './sample-data';

interface StoredShareLink extends Omit<ShareLink, 'passwordProtected'> {
  passwordHash?: string;
}

interface StoreData {
  projects: Project[];
  shareLinks: StoredShareLink[];
}

type ShareAccessResult =
  | { ok: true; link: ShareLink; projects: Project[] }
  | { ok: false; reason: 'not_found' | 'password_required' | 'invalid_password' };

const DATA_DIR = join(process.cwd(), 'data');
const STORE_FILE = join(DATA_DIR, 'store.json');
const VALID_STAGE_IDS = new Set(STAGES.map(stage => stage.id));

function seedStore(): StoreData {
  return {
    projects: [...sampleProjects],
    shareLinks: [],
  };
}

function ensureStoreFile() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(STORE_FILE)) {
    writeFileSync(STORE_FILE, JSON.stringify(seedStore(), null, 2), 'utf8');
  }
}

function normalizeProject(project: Partial<Project>): Project {
  const location = project.location || { city: '', state: '' };
  const stage = project.stage && VALID_STAGE_IDS.has(project.stage) ? project.stage : 'lead';

  return {
    id: project.id || randomUUID(),
    name: project.name || 'Untitled Project',
    location: {
      city: location.city || '',
      state: location.state || '',
      lat: location.lat,
      lng: location.lng,
    },
    stage,
    unitCount: project.unitCount || 0,
    estimatedValue: project.estimatedValue || 0,
    actualValue: project.actualValue,
    startDate: project.startDate,
    estimatedCompletion: project.estimatedCompletion,
    actualCompletion: project.actualCompletion,
    contacts: project.contacts || [],
    notes: project.notes || '',
    photos: project.photos || [],
    tags: project.tags || [],
    priority: project.priority || 'medium',
    healthStatus: project.healthStatus || 'on-track',
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString(),
    history: project.history || [],
  };
}

function readStore(): StoreData {
  ensureStoreFile();

  try {
    const raw = readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const projects = (parsed.projects ?? [...sampleProjects]).map(normalizeProject);
    const store = {
      projects,
      shareLinks: parsed.shareLinks ?? [],
    };

    if ((parsed.projects ?? []).some(project => !project.stage || !VALID_STAGE_IDS.has(project.stage))) {
      writeStore(store);
    }

    return store;
  } catch {
    const initial = seedStore();
    writeStore(initial);
    return initial;
  }
}

function writeStore(store: StoreData) {
  ensureStoreFile();
  writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function toPublicShareLink(link: StoredShareLink): ShareLink {
  return {
    id: link.id,
    audience: link.audience,
    viewMode: link.viewMode,
    filter: link.filter,
    expiresAt: link.expiresAt,
    createdAt: link.createdAt,
    passwordProtected: Boolean(link.passwordHash),
  };
}

function isExpired(link: StoredShareLink): boolean {
  return Boolean(link.expiresAt && new Date(link.expiresAt) < new Date());
}

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, passwordHash: string): boolean {
  const supplied = Buffer.from(hashPassword(password), 'utf8');
  const expected = Buffer.from(passwordHash, 'utf8');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function getProjects(): Project[] {
  return readStore().projects;
}

export function getProject(id: string): Project | undefined {
  return readStore().projects.find(project => project.id === id);
}

export function addProject(data: Partial<Project>): Project {
  const store = readStore();
  const now = new Date().toISOString();
  const project = normalizeProject({
    ...data,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  });

  store.projects.push(project);
  writeStore(store);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const store = readStore();
  const idx = store.projects.findIndex(project => project.id === id);

  if (idx === -1) {
    return null;
  }

  store.projects[idx] = normalizeProject({
    ...store.projects[idx],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  writeStore(store);
  return store.projects[idx];
}

export function deleteProject(id: string): boolean {
  const store = readStore();
  const nextProjects = store.projects.filter(project => project.id !== id);

  if (nextProjects.length === store.projects.length) {
    return false;
  }

  store.projects = nextProjects;
  writeStore(store);
  return true;
}

export function moveProject(id: string, stage: Project['stage']): Project | null {
  return updateProject(id, { stage });
}

export function createShareLink(audience: AudienceType, viewMode?: ViewMode, password?: string, expiresInDays?: number): ShareLink {
  const store = readStore();
  const link: StoredShareLink = {
    id: randomUUID(),
    audience,
    viewMode: viewMode || AUDIENCE_VIEW_MAP[audience],
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : undefined,
    createdAt: new Date().toISOString(),
    passwordHash: password ? hashPassword(password) : undefined,
  };

  store.shareLinks.push(link);
  writeStore(store);
  return toPublicShareLink(link);
}

export function getShareLink(id: string): ShareLink | undefined {
  const link = readStore().shareLinks.find(candidate => candidate.id === id);
  if (!link || isExpired(link)) {
    return undefined;
  }
  return toPublicShareLink(link);
}

export function getShareLinks(): ShareLink[] {
  return readStore().shareLinks
    .filter(link => !isExpired(link))
    .map(toPublicShareLink);
}

export function getSharePayload(id: string, password?: string): ShareAccessResult {
  const store = readStore();
  const link = store.shareLinks.find(candidate => candidate.id === id);

  if (!link || isExpired(link)) {
    return { ok: false, reason: 'not_found' };
  }

  if (link.passwordHash) {
    if (!password) {
      return { ok: false, reason: 'password_required' };
    }

    if (!verifyPassword(password, link.passwordHash)) {
      return { ok: false, reason: 'invalid_password' };
    }
  }

  return {
    ok: true,
    link: toPublicShareLink(link),
    projects: store.projects,
  };
}
