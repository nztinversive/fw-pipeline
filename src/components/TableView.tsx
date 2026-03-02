'use client';

import { Project, STAGES } from '@/lib/types';
import { formatCurrency } from '@/lib/stats';

interface Props {
  projects: Project[];
  onSelect: (project: Project) => void;
}

export default function TableView({ projects, onSelect }: Props) {
  return (
    <div className="overflow-x-auto px-4 py-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-white/10">
            <th className="pb-3 font-medium">Project</th>
            <th className="pb-3 font-medium">Location</th>
            <th className="pb-3 font-medium">Stage</th>
            <th className="pb-3 font-medium text-right">Units</th>
            <th className="pb-3 font-medium text-right">Value</th>
            <th className="pb-3 font-medium">Priority</th>
            <th className="pb-3 font-medium">Health</th>
            <th className="pb-3 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => {
            const stage = STAGES.find(s => s.id === p.stage);
            return (
              <tr
                key={p.id}
                className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => onSelect(p)}
              >
                <td className="py-3 font-medium text-white">{p.name}</td>
                <td className="py-3 text-gray-400">{p.location.city}, {p.location.state}</td>
                <td className="py-3">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${stage?.color}20`, color: stage?.color }}>
                    {stage?.label}
                  </span>
                </td>
                <td className="py-3 text-right">{p.unitCount}</td>
                <td className="py-3 text-right text-[#B8860B] font-semibold">{formatCurrency(p.estimatedValue)}</td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    p.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>{p.priority}</span>
                </td>
                <td className="py-3">
                  {p.healthStatus === 'on-track' ? '🟢' : p.healthStatus === 'at-risk' ? '🟡' : '🔴'}
                </td>
                <td className="py-3 text-gray-500 text-xs">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
