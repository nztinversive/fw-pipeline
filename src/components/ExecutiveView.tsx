'use client';

import { Project, STAGES } from '@/lib/types';
import { computeStats, formatCurrency } from '@/lib/stats';

interface Props {
  projects: Project[];
}

export default function ExecutiveView({ projects }: Props) {
  const stats = computeStats(projects);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-heading)' }}>
          Fading West Pipeline
        </h2>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Pipeline', value: formatCurrency(stats.totalValue), icon: '💰' },
          { label: 'Active Projects', value: stats.totalProjects.toString(), icon: '📋' },
          { label: 'In Production', value: stats.stageDistribution.production.count.toString(), icon: '🏗️' },
          { label: 'Conversion Rate', value: `${stats.conversionRate.toFixed(0)}%`, icon: '📈' },
        ].map(kpi => (
          <div key={kpi.label} className="glass p-5 text-center">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <div className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-primary)' }}>
              {kpi.value}
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Stage Distribution */}
      <div className="glass p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-primary)' }}>
          Stage Distribution
        </h3>
        <div className="space-y-3">
          {STAGES.map(stage => {
            const { count, value } = stats.stageDistribution[stage.id];
            const pct = stats.totalProjects > 0 ? (count / stats.totalProjects) * 100 : 0;
            return (
              <div key={stage.id} className="flex items-center gap-3">
                <div className="w-24 text-sm" style={{ color: stage.color }}>{stage.label}</div>
                <div className="flex-1 h-6 overflow-hidden" style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-lg)' }}>
                  <div
                    className="h-full flex items-center px-3 transition-all duration-700"
                    style={{
                      width: `${Math.max(pct, 5)}%`,
                      background: `color-mix(in srgb, ${stage.color} 50%, transparent)`,
                      borderRadius: 'var(--radius-lg)',
                    }}
                  >
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                </div>
                <div className="w-24 text-right text-sm" style={{ color: 'var(--accent)' }}>{formatCurrency(value)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Summary + Top Projects */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Risk */}
        <div className="glass p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-primary)' }}>
            Risk Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">🟢 On Track</span>
              <span className="font-bold">{projects.filter(p => p.healthStatus === 'on-track').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">🟡 At Risk</span>
              <span className="font-bold" style={{ color: 'var(--yellow)' }}>{stats.atRisk}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">🔴 Blocked</span>
              <span className="font-bold" style={{ color: 'var(--red)' }}>{stats.blocked}</span>
            </div>
          </div>
        </div>

        {/* Top Projects */}
        <div className="glass p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-primary)' }}>
            Top Projects by Value
          </h3>
          <div className="space-y-3">
            {[...projects]
              .sort((a, b) => b.estimatedValue - a.estimatedValue)
              .slice(0, 5)
              .map((p, i) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="mr-2" style={{ color: 'var(--text-muted)' }}>{i + 1}.</span>
                    <span style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                  </span>
                  <span className="font-semibold" style={{ color: 'var(--accent)' }}>{formatCurrency(p.estimatedValue)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-xs" style={{ color: 'var(--text-muted)' }}>
        Powered by Fading West &bull; Updated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
