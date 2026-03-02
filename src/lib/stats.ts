import { Project, PipelineStats, Stage, STAGES } from './types';

export function computeStats(projects: Project[]): PipelineStats {
  const stageDistribution = {} as Record<Stage, { count: number; value: number }>;
  STAGES.forEach(s => { stageDistribution[s.id] = { count: 0, value: 0 }; });

  let totalValue = 0;
  let atRisk = 0;
  let blocked = 0;
  const delivered = projects.filter(p => p.stage === 'delivered');

  projects.forEach(p => {
    stageDistribution[p.stage].count++;
    stageDistribution[p.stage].value += p.estimatedValue;
    totalValue += p.estimatedValue;
    if (p.healthStatus === 'at-risk') atRisk++;
    if (p.healthStatus === 'blocked') blocked++;
  });

  const conversionRate = projects.length > 0 ? (delivered.length / projects.length) * 100 : 0;

  return {
    totalProjects: projects.length,
    totalValue,
    avgCycleTime: 120, // placeholder days
    conversionRate,
    stageDistribution,
    atRisk,
    blocked,
  };
}

export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}
