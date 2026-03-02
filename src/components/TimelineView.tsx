'use client';

import { Project, STAGES } from '@/lib/types';
import { formatCurrency } from '@/lib/stats';

interface Props {
  projects: Project[];
}

export default function TimelineView({ projects }: Props) {
  const sorted = [...projects]
    .filter(p => p.startDate || p.estimatedCompletion)
    .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

  const now = new Date();
  const minDate = sorted.length > 0 ? new Date(sorted[0].startDate || now.toISOString()) : now;
  const maxDate = new Date(Math.max(
    ...sorted.map(p => new Date(p.estimatedCompletion || p.actualCompletion || now.toISOString()).getTime()),
    now.getTime() + 180 * 86400000
  ));
  const totalDays = Math.max((maxDate.getTime() - minDate.getTime()) / 86400000, 1);

  function dateToPercent(d: string): number {
    return ((new Date(d).getTime() - minDate.getTime()) / 86400000 / totalDays) * 100;
  }

  // Generate month markers
  const months: { label: string; pct: number }[] = [];
  const cursor = new Date(minDate);
  cursor.setDate(1);
  while (cursor <= maxDate) {
    const pct = dateToPercent(cursor.toISOString());
    if (pct >= 0 && pct <= 100) {
      months.push({ label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), pct });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Oswald' }}>Project Timeline</h2>

      {/* Month markers */}
      <div className="relative h-8 mb-2">
        {months.map((m, i) => (
          <div
            key={i}
            className="absolute text-xs text-gray-500 -translate-x-1/2"
            style={{ left: `${m.pct}%` }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Today line + bars */}
      <div className="relative">
        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 z-10"
          style={{ left: `${dateToPercent(now.toISOString())}%` }}
        >
          <div className="absolute -top-5 -translate-x-1/2 text-xs text-red-400">Today</div>
        </div>

        {/* Project bars */}
        <div className="space-y-2">
          {sorted.map(project => {
            const stage = STAGES.find(s => s.id === project.stage);
            const start = project.startDate ? dateToPercent(project.startDate) : 0;
            const end = project.estimatedCompletion
              ? dateToPercent(project.estimatedCompletion)
              : start + 20;
            const width = Math.max(end - start, 3);

            return (
              <div key={project.id} className="flex items-center gap-3 h-10">
                <div className="w-48 text-sm text-right truncate text-gray-300">
                  {project.name}
                </div>
                <div className="flex-1 relative h-8">
                  <div
                    className="absolute h-full rounded-md flex items-center px-3 text-xs font-medium text-white transition-all"
                    style={{
                      left: `${start}%`,
                      width: `${width}%`,
                      background: `${stage?.color}80`,
                      borderLeft: `3px solid ${stage?.color}`,
                    }}
                  >
                    <span className="truncate">
                      {project.unitCount}u • {formatCurrency(project.estimatedValue)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Projects without dates */}
        {projects.filter(p => !p.startDate && !p.estimatedCompletion).length > 0 && (
          <div className="mt-6 glass p-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">No dates set</h4>
            <div className="flex flex-wrap gap-2">
              {projects.filter(p => !p.startDate && !p.estimatedCompletion).map(p => {
                const stage = STAGES.find(s => s.id === p.stage);
                return (
                  <span key={p.id} className="text-xs px-3 py-1 rounded-full" style={{ background: `${stage?.color}20`, color: stage?.color }}>
                    {p.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
