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
        <h2 className="text-3xl font-bold text-[#B8860B]" style={{ fontFamily: 'Oswald' }}>
          Fading West Pipeline
        </h2>
        <p className="text-gray-400 mt-1">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
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
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Oswald' }}>
              {kpi.value}
            </div>
            <div className="text-sm text-gray-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Stage Distribution */}
      <div className="glass p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Oswald' }}>
          Stage Distribution
        </h3>
        <div className="space-y-3">
          {STAGES.map(stage => {
            const { count, value } = stats.stageDistribution[stage.id];
            const pct = stats.totalProjects > 0 ? (count / stats.totalProjects) * 100 : 0;
            return (
              <div key={stage.id} className="flex items-center gap-3">
                <div className="w-24 text-sm" style={{ color: stage.color }}>{stage.label}</div>
                <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center px-3 transition-all duration-700"
                    style={{ width: `${Math.max(pct, 5)}%`, background: `${stage.color}80` }}
                  >
                    <span className="text-xs font-medium text-white">{count}</span>
                  </div>
                </div>
                <div className="w-24 text-right text-sm text-[#B8860B]">{formatCurrency(value)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Summary + Top Projects */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Risk */}
        <div className="glass p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Oswald' }}>
            Risk Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">🟢 On Track</span>
              <span className="font-bold">{projects.filter(p => p.healthStatus === 'on-track').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">🟡 At Risk</span>
              <span className="font-bold text-yellow-400">{stats.atRisk}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">🔴 Blocked</span>
              <span className="font-bold text-red-400">{stats.blocked}</span>
            </div>
          </div>
        </div>

        {/* Top Projects */}
        <div className="glass p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Oswald' }}>
            Top Projects by Value
          </h3>
          <div className="space-y-3">
            {[...projects]
              .sort((a, b) => b.estimatedValue - a.estimatedValue)
              .slice(0, 5)
              .map((p, i) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="text-gray-500 mr-2">{i + 1}.</span>
                    {p.name}
                  </span>
                  <span className="text-[#B8860B] font-semibold">{formatCurrency(p.estimatedValue)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 text-xs text-gray-600">
        Powered by Fading West • Updated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
