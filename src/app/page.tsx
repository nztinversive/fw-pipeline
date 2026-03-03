'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project, Stage, ViewMode } from '@/lib/types';
import { computeStats, formatCurrency } from '@/lib/stats';
import KanbanBoard from '@/components/KanbanBoard';
import FunnelView from '@/components/FunnelView';
import ExecutiveView from '@/components/ExecutiveView';
import TimelineView from '@/components/TimelineView';
import TableView from '@/components/TableView';
import ChatWidget from '@/components/ChatWidget';
import ShareModal from '@/components/ShareModal';

const VIEW_TABS: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'kanban', label: 'Kanban', icon: '📋' },
  { id: 'funnel', label: 'Funnel', icon: '🔽' },
  { id: 'executive', label: 'Executive', icon: '📊' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'table', label: 'Table', icon: '📄' },
];

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<ViewMode>('kanban');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const stats = computeStats(projects);

  async function handleMove(id: string, stage: Stage) {
    await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage }),
    });
    fetchProjects();
  }

  return (
    <div className="min-h-screen content-layer">
      {/* Header */}
      <header className="border-b px-6 py-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-heading)', letterSpacing: '-0.3px' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              FW Pipeline
            </h1>
            <span className="text-xs px-2 py-1 rounded" style={{ color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
              {stats.totalProjects} projects &bull; {formatCurrency(stats.totalValue)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-sm font-medium transition-colors"
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
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-input-focus)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-input)')}
            >
              🔗 Share
            </button>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-1 mt-4">
          {VIEW_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="px-4 py-2 text-sm font-medium transition-all"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: view === tab.id ? 'var(--accent-subtle)' : 'transparent',
                color: view === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                border: view === tab.id ? '1px solid var(--accent-border)' : '1px solid transparent',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Stats bar */}
      <div className="px-6 py-3 border-b flex items-center gap-6 text-sm overflow-x-auto" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Pipeline: </span>
          <span className="font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(stats.totalValue)}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>In Production: </span>
          <span className="font-bold" style={{ color: 'var(--green)' }}>{stats.stageDistribution.production.count}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Leads: </span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{stats.stageDistribution.lead.count}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>At Risk: </span>
          <span className="font-bold" style={{ color: stats.atRisk > 0 ? 'var(--yellow)' : 'var(--green)' }}>
            {stats.atRisk}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Conversion: </span>
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{stats.conversionRate.toFixed(0)}%</span>
        </div>
      </div>

      {/* View content */}
      <main className="p-4">
        {view === 'kanban' && (
          <KanbanBoard projects={projects} onMove={handleMove} onSelect={setSelectedProject} />
        )}
        {view === 'funnel' && <FunnelView projects={projects} />}
        {view === 'executive' && <ExecutiveView projects={projects} />}
        {view === 'timeline' && <TimelineView projects={projects} />}
        {view === 'table' && <TableView projects={projects} onSelect={setSelectedProject} />}
      </main>

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
      <div className="glass w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-heading)' }}>Add Project</h2>
        <div className="space-y-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Project name"
            className="w-full px-3 py-2 text-sm outline-none"
            style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
          />
          <div className="flex gap-2">
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="City"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
            <input
              value={state}
              onChange={e => setState(e.target.value)}
              placeholder="State"
              className="w-20 px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex gap-2">
            <input
              value={units}
              onChange={e => setUnits(e.target.value)}
              placeholder="Unit count"
              type="number"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Value ($)"
              type="number"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm transition-colors"
            style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onAdd({
              name: name || 'New Project',
              location: { city, state },
              unitCount: parseInt(units) || 0,
              estimatedValue: parseFloat(value) || 0,
            })}
            className="flex-1 py-2 text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', borderRadius: 'var(--radius-sm)' }}
          >
            Add to Pipeline
          </button>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ProjectDrawer({ project, onClose, onUpdate, onDelete }: {
  project: Project;
  onClose: () => void;
  onUpdate: (_updates: Partial<Project>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-lg h-full overflow-y-auto p-6 border-l"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-primary)' }}>{project.name}</h2>
          <button onClick={onClose} className="text-xl" style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>

        <div className="space-y-4">
          <div className="glass p-4">
            <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Location</div>
            <div style={{ color: 'var(--text-primary)' }}>{project.location.city}, {project.location.state}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass p-4">
              <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Units</div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-primary)' }}>{project.unitCount}</div>
            </div>
            <div className="glass p-4">
              <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Value</div>
              <div className="text-2xl font-bold" style={{ fontFamily: 'var(--heading-font)', color: 'var(--accent)' }}>{formatCurrency(project.estimatedValue)}</div>
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
            <button
              onClick={() => onDelete()}
              className="px-4 py-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--red)', borderRadius: 'var(--radius-sm)' }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
