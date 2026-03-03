'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, Stage, STAGES, ViewMode, FilterState, EMPTY_FILTERS } from '@/lib/types';
import { computeStats, formatCurrency } from '@/lib/stats';
import { filterProjects } from '@/lib/filters';
import KanbanBoard from '@/components/KanbanBoard';
import FunnelView from '@/components/FunnelView';
import ExecutiveView from '@/components/ExecutiveView';
import TimelineView from '@/components/TimelineView';
import TableView from '@/components/TableView';
import ChatWidget from '@/components/ChatWidget';
import ShareModal from '@/components/ShareModal';
import FilterBar from '@/components/FilterBar';

const VIEW_TABS: { id: ViewMode; label: string }[] = [
  { id: 'kanban', label: 'Kanban' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'executive', label: 'Executive' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'table', label: 'Table' },
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<ViewMode>('kanban');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const stats = computeStats(projects);
  const filteredProjects = useMemo(() => filterProjects(projects, filters), [projects, filters]);
  const isFiltered = filteredProjects.length !== projects.length;

  async function handleMove(id: string, stage: Stage) {
    await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage }),
    });
    fetchProjects();
  }

  return (
    <div className="min-h-screen content-layer flex flex-col">
      {/* Header */}
      <header className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2.5" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-heading)', letterSpacing: '-0.3px' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              FW Pipeline
            </h1>
            <span className="text-xs px-2.5 py-1 rounded-md font-medium" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
              {isFiltered
                ? `${filteredProjects.length} of ${stats.totalProjects} projects`
                : `${stats.totalProjects} projects`
              } &bull; {formatCurrency(isFiltered ? filteredProjects.reduce((s, p) => s + p.estimatedValue, 0) : stats.totalValue)}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              + Add Project
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input-focus)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-input)')}
            >
              Share
            </button>
          </div>
        </div>

        {/* Pipeline Flow Bar */}
        {filteredProjects.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] font-semibold uppercase tracking-[1.5px] mb-2" style={{ color: '#cbd5e1' }}>
              Pipeline Flow
            </div>
            <div className="flex gap-1 h-10 overflow-hidden" style={{ borderRadius: '10px', background: 'var(--bg-secondary)' }}>
              {STAGES.map(s => {
                const count = filteredProjects.filter(p => p.stage === s.id).length;
                if (count === 0) return null;
                const pct = (count / filteredProjects.length) * 100;
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: s.color,
                      minWidth: '40px',
                    }}
                  >
                    <span className="font-bold text-sm" style={{ fontFamily: 'var(--heading-font)' }}>{count}</span>
                    <span className="text-[10px] opacity-80 font-medium hidden sm:inline">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-4">
          <FilterBar filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* View tabs */}
        <div className="flex gap-1 border-b overflow-x-auto view-tabs-scroll" style={{ borderColor: 'var(--border)' }}>
          {VIEW_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="px-4 py-2.5 text-sm font-medium transition-all -mb-px whitespace-nowrap"
              style={{
                color: view === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: view === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* View content */}
      <main className="p-4 flex-1">
        {view === 'kanban' && (
          <KanbanBoard projects={filteredProjects} onMove={handleMove} onSelect={setSelectedProject} />
        )}
        {view === 'funnel' && <FunnelView projects={filteredProjects} />}
        {view === 'executive' && <ExecutiveView projects={filteredProjects} />}
        {view === 'timeline' && <TimelineView projects={filteredProjects} />}
        {view === 'table' && <TableView projects={filteredProjects} onSelect={setSelectedProject} />}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t no-print" style={{ borderColor: 'var(--border)' }}>
        <div className="text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: 'var(--heading-font)', color: '#cbd5e1' }}>
          Powered by FW Pipeline
        </div>
        <div className="text-[11px] mt-1" style={{ color: '#e2e8f0' }}>
          Modular Construction Management
        </div>
      </footer>

      {/* Chat widget */}
      <ChatWidget onDataChange={fetchProjects} />

      {/* Share modal */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />

      {/* Add Project Modal */}
      {showAddModal && (
        <AddProjectModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (data) => {
            await fetch('/api/projects', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            setShowAddModal(false);
            fetchProjects();
          }}
        />
      )}

      {/* Project Detail Drawer */}
      {selectedProject && (
        <ProjectDrawer
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={async (updates) => {
            await fetch('/api/projects', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: selectedProject.id, ...updates }),
            });
            setSelectedProject(null);
            fetchProjects();
          }}
          onDelete={async () => {
            await fetch(`/api/projects?id=${selectedProject.id}`, { method: 'DELETE' });
            setSelectedProject(null);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}

function AddProjectModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: Partial<Project>) => void }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [units, setUnits] = useState('');
  const [value, setValue] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass w-full max-w-md p-4 sm:p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-heading)' }}>Add Project</h2>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Project name"
            className="w-full px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
            <input value={state} onChange={e => setState(e.target.value)} placeholder="State"
              className="w-full sm:w-20 px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={units} onChange={e => setUnits(e.target.value)} placeholder="Unit count" type="number"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
            <input value={value} onChange={e => setValue(e.target.value)} placeholder="Value ($)" type="number"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2 text-sm transition-colors"
            style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>Cancel</button>
          <button onClick={() => onAdd({ name: name || 'New Project', location: { city, state }, unitCount: parseInt(units) || 0, estimatedValue: parseFloat(value) || 0 })}
            className="flex-1 py-2 text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', borderRadius: 'var(--radius-sm)' }}>Add to Pipeline</button>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProjectDrawer({ project, onClose, onUpdate, onDelete }: {
  project: Project; onClose: () => void; onUpdate: (_updates: Partial<Project>) => void; onDelete: () => void;
}) {
  const stage = STAGES.find(s => s.id === project.stage);
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full sm:max-w-lg h-full overflow-y-auto p-4 sm:p-6 border-l"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-primary)' }}>{project.name}</h2>
          <button onClick={onClose} className="text-xl" style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>
        <div className="space-y-4">
          <div className="glass p-4">
            <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Location</div>
            <div style={{ color: 'var(--text-primary)' }}>{project.location.city}, {project.location.state}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="glass p-4">
              <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Units</div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-primary)' }}>{project.unitCount}</div>
            </div>
            <div className="glass p-4">
              <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Value</div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)', color: 'var(--accent)' }}>{formatCurrency(project.estimatedValue)}</div>
            </div>
            <div className="glass p-4">
              <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Stage</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: stage?.color }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{stage?.label}</span>
              </div>
            </div>
          </div>
          {project.contacts.length > 0 && (
            <div className="glass p-4">
              <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Contacts</div>
              {project.contacts.map((c, i) => (
                <div key={i} className="text-sm">
                  <span style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}> — {c.role}</span>
                </div>
              ))}
            </div>
          )}
          {project.notes && (
            <div className="glass p-4">
              <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Notes</div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{project.notes}</p>
            </div>
          )}
          <div className="flex gap-2 pt-4">
            <button onClick={() => onDelete()} className="px-4 py-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--red)', borderRadius: 'var(--radius-sm)' }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
