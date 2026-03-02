// Simple in-memory store with JSON persistence via API
import { Project, ShareLink, ViewMode, AudienceType, AUDIENCE_VIEW_MAP } from './types';
import { sampleProjects } from './sample-data';

let projects: Project[] = [...sampleProjects];
const shareLinks: ShareLink[] = [];

export function getProjects(): Project[] {
  return projects;
}

export function getProject(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function addProject(data: Partial<Project>): Project {
  const project: Project = {
    id: Date.now().toString(36),
    name: data.name || 'Untitled Project',
    location: data.location || { city: '', state: '' },
    stage: data.stage || 'lead',
    unitCount: data.unitCount || 0,
    estimatedValue: data.estimatedValue || 0,
    contacts: data.contacts || [],
    notes: data.notes || '',
    photos: [],
    tags: data.tags || [],
    priority: data.priority || 'medium',
    healthStatus: data.healthStatus || 'on-track',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
  };
  projects.push(project);
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  const len = projects.length;
  projects = projects.filter(p => p.id !== id);
  return projects.length < len;
}

export function moveProject(id: string, stage: Project['stage']): Project | null {
  return updateProject(id, { stage });
}

export function createShareLink(audience: AudienceType, viewMode?: ViewMode, password?: string, expiresInDays?: number): ShareLink {
  const link: ShareLink = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    audience,
    viewMode: viewMode || AUDIENCE_VIEW_MAP[audience],
    password: password || undefined,
    expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };
  shareLinks.push(link);
  return link;
}

export function getShareLink(id: string): ShareLink | undefined {
  const link = shareLinks.find(l => l.id === id);
  if (link?.expiresAt && new Date(link.expiresAt) < new Date()) return undefined;
  return link;
}

export function getShareLinks(): ShareLink[] {
  return shareLinks;
}
