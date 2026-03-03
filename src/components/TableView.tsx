'use client';

import { Project, STAGES } from '@/lib/types';
import { formatCurrency } from '@/lib/stats';

interface Props {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export default function TableView({ projects, onSelect }: Props) {
  function exportCSV() {
    const headers = ['Name', 'City', 'State', 'Stage', 'Units', 'Estimated Value', 'Priority', 'Health Status', 'Contacts', 'Notes', 'Created', 'Updated'];

    const rows = projects.map(p => [
      p.name,
      p.location.city,
      p.location.state,
      STAGES.find(s => s.id === p.stage)?.label || p.stage,
      p.unitCount.toString(),
      p.estimatedValue.toString(),
      p.priority,
      p.healthStatus,
      p.contacts.map(c => `${c.name} (${c.role})`).join('; '),
      p.notes.replace(/"/g, '""'),
      p.createdAt,
      p.updatedAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pipeline-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-x-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-muted)' }}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </h3>
        <button
          onClick={exportCSV}
          className="px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5"
          style={{
            background: 'var(--bg-input)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input-focus)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-input)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>
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
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{
                    background: p.healthStatus === 'on-track' ? 'var(--green)' : p.healthStatus === 'at-risk' ? 'var(--yellow)' : 'var(--red)',
                  }} />
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
