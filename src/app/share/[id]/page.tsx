'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Project, ShareLink } from '@/lib/types';
import FunnelView from '@/components/FunnelView';
import ExecutiveView from '@/components/ExecutiveView';
import TimelineView from '@/components/TimelineView';
import TableView from '@/components/TableView';
import KanbanBoard from '@/components/KanbanBoard';

interface SharePayload {
  link: ShareLink;
  projects: Project[];
}

export default function SharePage() {
  const params = useParams<{ id: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [link, setLink] = useState<ShareLink | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  const shareId = typeof params.id === 'string' ? params.id : '';

  const loadShare = useCallback(async (sharePassword?: string) => {
    setLoading(true);
    setError('');

    try {
      const metaRes = await fetch(`/api/share/${shareId}`);
      if (!metaRes.ok) {
        setError('This pipeline share link is no longer available.');
        setAuthed(false);
        setLink(null);
        setProjects([]);
        return;
      }

      const meta = await metaRes.json() as ShareLink;
      setLink(meta);

      if (meta.passwordProtected && !sharePassword) {
        setAuthed(false);
        return;
      }

      const payloadRes = await fetch(`/api/share/${shareId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: sharePassword }),
      });

      if (payloadRes.status === 401 || payloadRes.status === 403) {
        setError(payloadRes.status === 401 ? 'Password required.' : 'Incorrect password.');
        setAuthed(false);
        setProjects([]);
        return;
      }

      if (!payloadRes.ok) {
        setError('This pipeline share link is no longer available.');
        setAuthed(false);
        setProjects([]);
        return;
      }

      const payload = await payloadRes.json() as SharePayload;
      setProjects(payload.projects);
      setLink(payload.link);
      setAuthed(true);
    } catch {
      setError('Unable to load the shared pipeline right now.');
      setAuthed(false);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    if (shareId) {
      void loadShare();
    }
  }, [loadShare, shareId]);

  if (loading) {
    return null;
  }

  if (error && !link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Link Expired or Invalid</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!authed && link?.passwordProtected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass w-full max-w-md p-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-heading)', fontFamily: 'var(--heading-font)' }}>
            Password Protected
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Enter the password to view this shared pipeline.
          </p>
          {error && (
            <p className="text-sm mb-3" style={{ color: 'var(--red)' }}>
              {error}
            </p>
          )}
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
            <button
              onClick={() => void loadShare(password)}
              className="w-full py-2 text-sm font-medium"
              style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', borderRadius: 'var(--radius-sm)' }}
            >
              View Pipeline
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!authed || !link) {
    return null;
  }

  const view = link.viewMode;

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#B8860B]" style={{ fontFamily: 'Oswald' }}>
          Fading West Pipeline
        </h1>
        <span className="text-xs text-gray-500">Shared view - {link.audience}</span>
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
