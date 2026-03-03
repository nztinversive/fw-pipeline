'use client';

import { useState, useRef, useEffect } from 'react';
import { FilterState, STAGES, Stage, EMPTY_FILTERS } from '@/lib/types';
import { getActiveFilterCount } from '@/lib/filters';

const HEALTH_OPTIONS: { id: 'on-track' | 'at-risk' | 'blocked'; label: string; color: string }[] = [
  { id: 'on-track', label: 'On Track', color: 'var(--green)' },
  { id: 'at-risk', label: 'At Risk', color: 'var(--yellow)' },
  { id: 'blocked', label: 'Blocked', color: 'var(--red)' },
];

const PRIORITY_OPTIONS: { id: 'low' | 'medium' | 'high'; label: string; color: string }[] = [
  { id: 'high', label: 'High', color: '#ef4444' },
  { id: 'medium', label: 'Medium', color: '#eab308' },
  { id: 'low', label: 'Low', color: '#94a3b8' },
];

interface Props {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

type DropdownKey = 'stage' | 'health' | 'priority';

export default function FilterBar({ filters, onFiltersChange }: Props) {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeCount = getActiveFilterCount(filters);

  function toggleStage(id: Stage) {
    const next = filters.stages.includes(id)
      ? filters.stages.filter(s => s !== id)
      : [...filters.stages, id];
    onFiltersChange({ ...filters, stages: next });
  }

  function toggleHealth(id: 'on-track' | 'at-risk' | 'blocked') {
    const next = filters.healthStatuses.includes(id)
      ? filters.healthStatuses.filter(s => s !== id)
      : [...filters.healthStatuses, id];
    onFiltersChange({ ...filters, healthStatuses: next });
  }

  function togglePriority(id: 'low' | 'medium' | 'high') {
    const next = filters.priorities.includes(id)
      ? filters.priorities.filter(s => s !== id)
      : [...filters.priorities, id];
    onFiltersChange({ ...filters, priorities: next });
  }

  return (
    <div ref={containerRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 sm:max-w-[280px]">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={e => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Search projects..."
          className="w-full pl-8 pr-3 py-1.5 text-xs outline-none transition-colors"
          style={{
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {/* Stage filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'stage' ? null : 'stage')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              background: filters.stages.length > 0 ? 'var(--accent-subtle)' : 'var(--bg-input)',
              color: filters.stages.length > 0 ? 'var(--accent)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: filters.stages.length > 0 ? '1px solid var(--accent-border)' : '1px solid transparent',
            }}
          >
            Stage
            {filters.stages.length > 0 && (
              <span className="text-[10px] px-1 py-0.5 rounded-full leading-none" style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                {filters.stages.length}
              </span>
            )}
            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {openDropdown === 'stage' && (
            <div className="absolute top-full left-0 mt-1 glass p-2 min-w-[180px] z-30" style={{ boxShadow: 'var(--shadow-elevated)' }}>
              {STAGES.map(s => (
                <label key={s.id} className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={filters.stages.includes(s.id)} onChange={() => toggleStage(s.id)} className="accent-[var(--accent)]" />
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Health filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'health' ? null : 'health')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              background: filters.healthStatuses.length > 0 ? 'var(--accent-subtle)' : 'var(--bg-input)',
              color: filters.healthStatuses.length > 0 ? 'var(--accent)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: filters.healthStatuses.length > 0 ? '1px solid var(--accent-border)' : '1px solid transparent',
            }}
          >
            Health
            {filters.healthStatuses.length > 0 && (
              <span className="text-[10px] px-1 py-0.5 rounded-full leading-none" style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                {filters.healthStatuses.length}
              </span>
            )}
            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {openDropdown === 'health' && (
            <div className="absolute top-full left-0 mt-1 glass p-2 min-w-[160px] z-30" style={{ boxShadow: 'var(--shadow-elevated)' }}>
              {HEALTH_OPTIONS.map(h => (
                <label key={h.id} className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={filters.healthStatuses.includes(h.id)} onChange={() => toggleHealth(h.id)} className="accent-[var(--accent)]" />
                  <span className="w-2 h-2 rounded-full" style={{ background: h.color }} />
                  {h.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Priority filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
            style={{
              background: filters.priorities.length > 0 ? 'var(--accent-subtle)' : 'var(--bg-input)',
              color: filters.priorities.length > 0 ? 'var(--accent)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: filters.priorities.length > 0 ? '1px solid var(--accent-border)' : '1px solid transparent',
            }}
          >
            Priority
            {filters.priorities.length > 0 && (
              <span className="text-[10px] px-1 py-0.5 rounded-full leading-none" style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
                {filters.priorities.length}
              </span>
            )}
            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {openDropdown === 'priority' && (
            <div className="absolute top-full left-0 mt-1 glass p-2 min-w-[140px] z-30" style={{ boxShadow: 'var(--shadow-elevated)' }}>
              {PRIORITY_OPTIONS.map(p => (
                <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 text-xs cursor-pointer rounded hover:opacity-80" style={{ color: 'var(--text-primary)' }}>
                  <input type="checkbox" checked={filters.priorities.includes(p.id)} onChange={() => togglePriority(p.id)} className="accent-[var(--accent)]" />
                  <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  {p.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Clear all */}
        {activeCount > 0 && (
          <button
            onClick={() => onFiltersChange(EMPTY_FILTERS)}
            className="px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap"
            style={{ color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
