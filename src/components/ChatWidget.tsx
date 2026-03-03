'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  onDataChange: () => void;
}

export default function ChatWidget({ onDataChange }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hey! I can help manage the pipeline. Try "pipeline overview" or "add a project".' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const { reply } = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (/add|move|update|delete|mark/i.test(userMsg)) {
        onDataChange();
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-2xl shadow-lg transition-all z-50 flex items-center justify-center"
        style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] glass flex flex-col z-40" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
            <span className="font-semibold text-sm" style={{ fontFamily: 'var(--heading-font)', color: 'var(--text-primary)' }}>Pipeline Assistant</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[80%] px-3 py-2 text-sm"
                  style={{
                    background: m.role === 'user' ? 'var(--accent-subtle)' : 'var(--bg-input)',
                    color: m.role === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-md)',
                    whiteSpace: 'pre-wrap',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: m.content
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 text-sm" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)' }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about the pipeline..."
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
            <button
              onClick={send}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
