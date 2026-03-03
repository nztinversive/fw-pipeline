export type Stage = 'lead' | 'qualified' | 'design' | 'permitting' | 'production' | 'delivered';

export const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: 'lead', label: 'Lead', color: 'var(--stage-lead)' },
  { id: 'qualified', label: 'Qualified', color: 'var(--stage-qualified)' },
  { id: 'design', label: 'Design', color: 'var(--stage-design)' },
  { id: 'permitting', label: 'Permitting', color: 'var(--stage-permitting)' },
  { id: 'production', label: 'In Production', color: 'var(--stage-production)' },
  { id: 'delivered', label: 'Delivered', color: 'var(--stage-delivered)' },
];

export interface Contact {
  name: string;
  role: string;
  email: string;
  phone?: string;
}

export interface HistoryEntry {
  field: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
}

export interface Project {
  id: string;
  name: string;
  location: {
    city: string;
    state: string;
    lat?: number;
    lng?: number;
  };
  stage: Stage;
  unitCount: number;
  estimatedValue: number;
  actualValue?: number;
  startDate?: string;
  estimatedCompletion?: string;
  actualCompletion?: string;
  contacts: Contact[];
  notes: string;
  photos: string[];
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  healthStatus: 'on-track' | 'at-risk' | 'blocked';
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
}

export type ViewMode = 'kanban' | 'funnel' | 'executive' | 'timeline' | 'table' | 'cards';

export type AudienceType = 'team' | 'sales' | 'investors' | 'partners' | 'custom';

export const AUDIENCE_VIEW_MAP: Record<AudienceType, ViewMode> = {
  team: 'kanban',
  sales: 'funnel',
  investors: 'executive',
  partners: 'timeline',
  custom: 'kanban',
};

export interface ShareLink {
  id: string;
  audience: AudienceType;
  viewMode: ViewMode;
  filter?: string;
  password?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface PipelineStats {
  totalProjects: number;
  totalValue: number;
  avgCycleTime: number;
  conversionRate: number;
  stageDistribution: Record<Stage, { count: number; value: number }>;
  atRisk: number;
  blocked: number;
}
