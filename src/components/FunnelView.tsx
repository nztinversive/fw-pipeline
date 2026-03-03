'use client';

import { Project, STAGES } from '@/lib/types';
import { formatCurrency } from '@/lib/stats';

interface Props {
  projects: Project[];
}

export default function FunnelView({ projects }: Props) {
  const maxCount = Math.max(...STAGES.map(s => projects.filter(p => p.stage === s.id).length), 1);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-heading)' }}>
        Pipeline Funnel
      </h2>
      <div className="space-y-3">
        {STAGES.map((stage, i) => {
          const stageProjects = projects.filter(p => p.stage === stage.id);
          const count = stageProjects.length;
          const value = stageProjects.reduce((s, p) => s + p.estimatedValue, 0);
          const widthPct = Math.max((count / maxCount) * 100, 15);
          const prevCount = i > 0 ? projects.filter(p => p.stage === STAGES[i - 1].id).length : 0;
          const dropoff = i > 0 && prevCount > 0 ? ((prevCount - count) / prevCount * 100).toFixed(0) : null;

          return (
            <div key={stage.id} className="flex items-center gap-4">
              <div className="w-28 text-right text-sm font-medium" style={{ color: stage.color }}>
                {stage.label}
              </div>
              <div className="flex-1 relative">
                <div
                  className="h-14 flex items-center justify-between px-4 transition-all duration-500"
                  style={{
                    width: `${widthPct}%`,
                    background: `color-mix(in srgb, ${stage.color} 19%, transparent)`,
                    borderLeft: `4px solid ${stage.color}`,
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{count}</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(value)}</span>
                </div>
              </div>
              <div className="w-20 text-xs" style={{ color: 'var(--text-muted)' }}>
                {dropoff && <span style={{ color: 'var(--red)' }}>↓ {dropoff}%</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion summary */}
      <div className="mt-8 glass p-6 text-center">
        <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Overall Conversion</div>
        <div className="text-3xl font-bold" style={{ fontFamily: 'var(--heading-font)', color: 'var(--accent)' }}>
          {projects.length > 0
            ? ((projects.filter(p => p.stage === 'delivered').length / projects.length) * 100).toFixed(0)
            : 0}%
        </div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Lead → Delivered</div>
      </div>
    </div>
  );
}
