'use client';

import { useState } from 'react';
import { AudienceType, AUDIENCE_VIEW_MAP } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const audiences: { id: AudienceType; label: string; icon: string; desc: string }[] = [
  { id: 'team', label: 'Team', icon: '👥', desc: 'Kanban board for daily ops' },
  { id: 'sales', label: 'Sales', icon: '💼', desc: 'Funnel with conversion metrics' },
  { id: 'investors', label: 'Investors', icon: '📊', desc: 'Executive dashboard with KPIs' },
  { id: 'partners', label: 'Partners', icon: '🤝', desc: 'Timeline with milestones' },
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
      <div className="glass w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Oswald' }}>Share Pipeline</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Audience picker */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Who&apos;s this for?</label>
          <div className="grid grid-cols-2 gap-2">
            {audiences.map(a => (
              <button
                key={a.id}
                onClick={() => { setAudience(a.id); setLink(''); }}
                className={`p-3 rounded-lg text-left transition-all ${
                  audience === a.id
                    ? 'bg-[#B8860B]/20 border border-[#B8860B]'
                    : 'bg-white/5 border border-transparent hover:bg-white/10'
                }`}
              >
                <div className="text-lg mb-1">{a.icon}</div>
                <div className="text-sm font-medium">{a.label}</div>
                <div className="text-xs text-gray-500">{a.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Password (optional)</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Leave blank for public"
              className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Expires</label>
            <select
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none"
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
            className="w-full py-3 bg-[#B8860B] rounded-lg font-semibold hover:bg-[#D4A017] transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Share Link'}
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={link}
                readOnly
                className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm text-[#B8860B] outline-none"
              />
              <button
                onClick={copy}
                className="px-4 py-2 bg-[#B8860B] rounded-lg text-sm font-medium hover:bg-[#D4A017]"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              View: {AUDIENCE_VIEW_MAP[audience]} • {password ? 'Password protected' : 'Public'} • {expiry ? `Expires in ${expiry}d` : 'No expiry'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
