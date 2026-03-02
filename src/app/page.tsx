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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#B8860B]" style={{ fontFamily: 'Oswald' }}>
              FW PIPELINE
            </h1>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
              {stats.totalProjects} projects • {formatCurrency(stats.totalValue)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#B8860B] rounded-lg text-sm font-medium hover:bg-[#D4A017] transition-colors"
            >
              + Add Project
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="px-4 py-2 bg-white/10 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                view === tab.id
                  ? 'bg-[#B8860B]/20 text-[#B8860B] border border-[#B8860B]/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Stats bar */}
      <div className="px-6 py-3 border-b border-white/5 flex items-center gap-6 text-sm overflow-x-auto">
        <div>
          <span className="text-gray-500">Pipeline: </span>
          <span className="text-[#B8860B] font-bold">{formatCurrency(stats.totalValue)}</span>
        </div>
        <div>
          <span className="text-gray-500">In Production: </span>
          <span className="text-green-400 font-bold">{stats.stageDistribution.production.count}</span>
        </div>
        <div>
          <span className="text-gray-500">Leads: </span>
          <span className="text-gray-300 font-bold">{stats.stageDistribution.lead.count}</span>
        </div>
        <div>
          <span className="text-gray-500">At Risk: </span>
          <span className={`font-bold ${stats.atRisk > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
            {stats.atRisk}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Conversion: </span>
          <span className="text-white font-bold">{stats.conversionRate.toFixed(0)}%</span>
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
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Oswald' }}>Add Project</h2>
        <div className="space-y-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Project name"
            className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
          />
          <div className="flex gap-2">
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="City"
              className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
            />
            <input
              value={state}
              onChange={e => setState(e.target.value)}
              placeholder="State"
              className="w-20 bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <input
              value={units}
              onChange={e => setUnits(e.target.value)}
              placeholder="Unit count"
              type="number"
              className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
            />
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Value ($)"
              type="number"
              className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
            Cancel
          </button>
          <button
            onClick={() => onAdd({
              name: name || 'New Project',
              location: { city, state },
              unitCount: parseInt(units) || 0,
              estimatedValue: parseFloat(value) || 0,
            })}
            className="flex-1 py-2 bg-[#B8860B] rounded-lg text-sm font-medium hover:bg-[#D4A017]"
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
      <div className="w-full max-w-lg bg-[#1a2332] border-l border-white/10 h-full overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Oswald' }}>{project.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div className="glass p-4">
            <div className="text-sm text-gray-400 mb-1">Location</div>
            <div className="text-white">{project.location.city}, {project.location.state}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass p-4">
              <div className="text-sm text-gray-400 mb-1">Units</div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Oswald' }}>{project.unitCount}</div>
            </div>
            <div className="glass p-4">
              <div className="text-sm text-gray-400 mb-1">Value</div>
              <div className="text-2xl font-bold text-[#B8860B]" style={{ fontFamily: 'Oswald' }}>{formatCurrency(project.estimatedValue)}</div>
            </div>
          </div>

          {project.contacts.length > 0 && (
            <div className="glass p-4">
              <div className="text-sm text-gray-400 mb-2">Contacts</div>
              {project.contacts.map((c, i) => (
                <div key={i} className="text-sm">
                  <span className="text-white">{c.name}</span>
                  <span className="text-gray-500"> — {c.role}</span>
                </div>
              ))}
            </div>
          )}

          {project.notes && (
            <div className="glass p-4">
              <div className="text-sm text-gray-400 mb-1">Notes</div>
              <p className="text-sm text-gray-300">{project.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => onDelete()}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
