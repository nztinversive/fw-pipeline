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
    { role: 'assistant', content: 'Hey! I can help manage your pipeline. Ask me anything about your projects, or tell me to add and move projects around.' },
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
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: newMessages.slice(1).slice(-20), // last 20 messages, skip initial greeting
        }),
      });
      const { reply } = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      // Always refresh data — AI may have taken actions
      onDataChange();
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
        className="chat-fab fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full text-2xl shadow-lg transition-all z-50 flex items-center justify-center no-print"
        style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
      >
        {open ? '✕' : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel fixed bottom-20 sm:bottom-24 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-96 h-[500px] max-h-[70vh] glass flex flex-col z-40 no-print" style={{ boxShadow: 'var(--shadow-elevated)' }}>
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
                <div className="px-3 py-2 text-sm flex items-center gap-1" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)' }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '0ms' }} />
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '150ms' }} />
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--text-muted)', animationDelay: '300ms' }} />
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
