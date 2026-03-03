'use client';

import { Project, STAGES } from '@/lib/types';
import { formatCurrency } from '@/lib/stats';

interface Props {
  project: Project;
  onClick?: () => void;
  compact?: boolean;
}

const healthIcons: Record<string, string> = {
  'on-track': '🟢',
  'at-risk': '🟡',
  'blocked': '🔴',
};

const priorityColors: Record<string, { bg: string; text: string }> = {
  high: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  medium: { bg: 'rgba(234,179,8,0.15)', text: '#eab308' },
  low: { bg: 'var(--bg-badge)', text: 'var(--text-muted)' },
};

export default function ProjectCard({ project, onClick, compact }: Props) {
  const stage = STAGES.find(s => s.id === project.stage);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`glass glass-hover p-3 cursor-pointer stage-${project.stage} transition-all duration-200`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</span>
          <span className="text-xs">{healthIcons[project.healthStatus]}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>{project.unitCount} units</span>
          <span className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(project.estimatedValue)}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`glass glass-hover p-4 cursor-pointer stage-${project.stage} transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold truncate pr-2" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
        <span className="text-sm">{healthIcons[project.healthStatus]}</span>
      </div>
      <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
        {project.location.city}{project.location.state ? `, ${project.location.state}` : ''}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs px-2 py-0.5"
          style={{
            background: priorityColors[project.priority].bg,
            color: priorityColors[project.priority].text,
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {project.priority}
        </span>
        <span
          className="text-xs px-2 py-0.5"
          style={{
            background: `color-mix(in srgb, ${stage?.color || 'gray'} 13%, transparent)`,
            color: stage?.color,
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {stage?.label}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>{project.unitCount} units</span>
        <span className="font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(project.estimatedValue)}</span>
      </div>
      {project.contacts.length > 0 && (
        <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          📞 {project.contacts[0].name}
        </div>
      )}
      {project.notes && (
        <p className="mt-2 text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{project.notes}</p>
      )}
    </div>
  );
}
