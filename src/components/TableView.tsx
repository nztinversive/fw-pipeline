'use client';

import { Project, STAGES } from '@/lib/types';
import { formatCurrency } from '@/lib/stats';

interface Props {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export default function TableView({ projects, onSelect }: Props) {
  return (
    <div className="overflow-x-auto px-4 py-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            <th className="pb-3 font-medium">Project</th>
            <th className="pb-3 font-medium">Location</th>
            <th className="pb-3 font-medium">Stage</th>
            <th className="pb-3 font-medium text-right">Units</th>
            <th className="pb-3 font-medium text-right">Value</th>
            <th className="pb-3 font-medium">Priority</th>
            <th className="pb-3 font-medium">Health</th>
            <th className="pb-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => {
            const stage = STAGES.find(s => s.id === p.stage);
            return (
              <tr
                key={p.id}
                className="border-b cursor-pointer transition-colors"
                style={{ borderColor: 'var(--border-subtle)' }}
                onClick={() => onSelect(p)}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                <td className="py-3" style={{ color: 'var(--text-secondary)' }}>{p.location.city}, {p.location.state}</td>
                <td className="py-3">
                  <span
                    className="text-xs px-2 py-1"
                    style={{
                      background: `color-mix(in srgb, ${stage?.color || 'gray'} 13%, transparent)`,
                      color: stage?.color,
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    {stage?.label}
                  </span>
                </td>
                <td className="py-3 text-right" style={{ color: 'var(--text-primary)' }}>{p.unitCount}</td>
                <td className="py-3 text-right font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(p.estimatedValue)}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    p.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{p.priority}</span>
                </td>
                <td className="py-3">
                  {p.healthStatus === 'on-track' ? '🟢' : p.healthStatus === 'at-risk' ? '🟡' : '🔴'}
                </td>
                <td className="py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(p.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
