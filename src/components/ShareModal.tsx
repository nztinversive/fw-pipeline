'use client';

import { useState } from 'react';
import { AudienceType, AUDIENCE_VIEW_MAP } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const audiences: { id: AudienceType; label: string; desc: string }[] = [
  { id: 'team', label: 'Team', desc: 'Kanban board for daily ops' },
  { id: 'sales', label: 'Sales', desc: 'Funnel with conversion metrics' },
  { id: 'investors', label: 'Investors', desc: 'Executive dashboard with KPIs' },
  { id: 'partners', label: 'Partners', desc: 'Timeline with milestones' },
];

export default function ShareModal({ open, onClose }: Props) {
  const [audience, setAudience] = useState<AudienceType>('investors');
  const [password, setPassword] = useState('');
  const [expiry, setExpiry] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          viewMode: AUDIENCE_VIEW_MAP[audience],
          password: password || undefined,
          expiresInDays: expiry ? parseInt(expiry) : undefined,
        }),
      });
      const data = await res.json();
      setLink(`${window.location.origin}/share/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass w-full max-w-md p-4 sm:p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-heading)' }}>Share Pipeline</h2>
          <button onClick={onClose} className="text-xl" style={{ color: 'var(--text-secondary)' }}>✕</button>
        </div>

        {/* Audience picker */}
        <div className="mb-4">
          <label className="text-sm mb-2 block" style={{ color: 'var(--text-secondary)' }}>Who&apos;s this for?</label>
          <div className="grid grid-cols-2 gap-2">
            {audiences.map(a => (
              <button
                key={a.id}
                onClick={() => { setAudience(a.id); setLink(''); }}
                className="p-3 text-left transition-all"
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: audience === a.id ? 'var(--accent-subtle)' : 'var(--bg-input)',
                  border: audience === a.id ? '1px solid var(--accent-border)' : '1px solid transparent',
                }}
              >
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.label}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Password (optional)</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Leave blank for public"
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: 'var(--text-secondary)' }}>Expires</label>
            <select
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
            >
              <option value="">Never</option>
              <option value="1">24 hours</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
            </select>
          </div>
        </div>

        {/* Generate / Copy */}
        {!link ? (
          <button
            onClick={generate}
            disabled={loading}
            className="w-full py-3 font-semibold transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', borderRadius: 'var(--radius-sm)' }}
          >
            {loading ? 'Generating...' : 'Generate Share Link'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={link}
                readOnly
                className="flex-1 px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)' }}
              />
              <button
                onClick={copy}
                className="px-4 py-2 text-sm font-medium"
                style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', borderRadius: 'var(--radius-sm)' }}
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              View: {AUDIENCE_VIEW_MAP[audience]} &bull; {password ? 'Password protected' : 'Public'} &bull; {expiry ? `Expires in ${expiry}d` : 'No expiry'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
