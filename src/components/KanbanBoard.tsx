'use client';

import { Project, Stage, STAGES } from '@/lib/types';
import { formatCurrency } from '@/lib/stats';
import ProjectCard from './ProjectCard';

interface Props {
  projects: Project[];
  onMove: (id: string, stage: Stage) => void;
  onSelect: (project: Project) => void;
}

export default function KanbanBoard({ projects, onMove, onSelect }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ minHeight: 'calc(100vh - 200px)' }}>
      {STAGES.map(stage => {
        const stageProjects = projects.filter(p => p.stage === stage.id);
        const stageValue = stageProjects.reduce((sum, p) => sum + p.estimatedValue, 0);

        return (
          <div
            key={stage.id}
            className="flex-shrink-0 w-72"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const id = e.dataTransfer.getData('projectId');
              if (id) onMove(id, stage.id);
            }}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: stage.color }} />
                <h3 className="font-semibold text-sm uppercase tracking-wider" style={{ fontFamily: 'Oswald' }}>
                  {stage.label}
                </h3>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                  {stageProjects.length}
                </span>
              </div>
              <span className="text-xs text-[#B8860B]">{formatCurrency(stageValue)}</span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {stageProjects.map(project => (
                <div
                  key={project.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('projectId', project.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <ProjectCard project={project} onClick={() => onSelect(project)} />
                </div>
              ))}
              {stageProjects.length === 0 && (
                <div className="glass p-4 text-center text-gray-500 text-sm border-dashed">
                  Drop projects here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
