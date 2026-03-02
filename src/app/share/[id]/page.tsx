'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Project, ShareLink } from '@/lib/types';
import FunnelView from '@/components/FunnelView';
import ExecutiveView from '@/components/ExecutiveView';
import TimelineView from '@/components/TimelineView';
import TableView from '@/components/TableView';
import KanbanBoard from '@/components/KanbanBoard';

export default function SharePage() {
  const params = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [error] = useState('');
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects);
    // In a real app, we'd fetch the share link config from API
    // For MVP, just show the executive view
    setLink({ id: params.id as string, audience: 'investors', viewMode: 'executive', createdAt: '' });
    setAuthed(true);
  }, [params.id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">Link Expired or Invalid</h2>
          <p className="text-gray-400">This pipeline share link is no longer available.</p>
        </div>
      </div>
    );
  }

  if (!authed || !link) return null;

  const view = link.viewMode;

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#B8860B]" style={{ fontFamily: 'Oswald' }}>
          Fading West Pipeline
        </h1>
        <span className="text-xs text-gray-500">Shared view • {link.audience}</span>
      </header>
      <main>
        {view === 'kanban' && <KanbanBoard projects={projects} onMove={() => {}} onSelect={() => {}} />}
        {view === 'funnel' && <FunnelView projects={projects} />}
        {view === 'executive' && <ExecutiveView projects={projects} />}
        {view === 'timeline' && <TimelineView projects={projects} />}
        {view === 'table' && <TableView projects={projects} onSelect={() => {}} />}
      </main>
    </div>
  );
}
