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

const priorityBadge: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-gray-500/20 text-gray-400',
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
          <span className="font-medium text-sm truncate">{project.name}</span>
          <span className="text-xs">{healthIcons[project.healthStatus]}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{project.unitCount} units</span>
          <span className="text-[#B8860B] font-semibold">{formatCurrency(project.estimatedValue)}</span>
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
        <h3 className="font-semibold text-white truncate pr-2">{project.name}</h3>
        <span className="text-sm">{healthIcons[project.healthStatus]}</span>
      </div>
      <div className="text-sm text-gray-400 mb-2">
        {project.location.city}{project.location.state ? `, ${project.location.state}` : ''}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge[project.priority]}`}>
          {project.priority}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: `${stage?.color}20`, color: stage?.color }}
        >
          {stage?.label}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{project.unitCount} units</span>
        <span className="text-[#B8860B] font-bold">{formatCurrency(project.estimatedValue)}</span>
      </div>
      {project.contacts.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          📞 {project.contacts[0].name}
        </div>
      )}
      {project.notes && (
        <p className="mt-2 text-xs text-gray-500 line-clamp-2">{project.notes}</p>
      )}
    </div>
  );
}
