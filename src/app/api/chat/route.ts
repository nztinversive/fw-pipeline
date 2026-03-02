import { NextRequest, NextResponse } from 'next/server';
import { getProjects, addProject, moveProject } from '@/lib/store';
import { computeStats, formatCurrency } from '@/lib/stats';
import { Stage } from '@/lib/types';

const STAGES: Stage[] = ['lead', 'qualified', 'design', 'permitting', 'production', 'delivered'];

function parseMessage(msg: string): { reply: string } {
  const lower = msg.toLowerCase().trim();
  const projects = getProjects();
  const stats = computeStats(projects);

  // Stats queries
  if (lower.includes('total value') || lower.includes('pipeline value')) {
    return { reply: `Total pipeline value: **${formatCurrency(stats.totalValue)}** across ${stats.totalProjects} projects.` };
  }
  if (lower.includes('how many') && lower.includes('project')) {
    return { reply: `You have **${stats.totalProjects} projects** in the pipeline. ${stats.atRisk} at risk, ${stats.blocked} blocked.` };
  }
  if (lower.includes('conversion') || lower.includes('close rate')) {
    return { reply: `Conversion rate (Lead → Delivered): **${stats.conversionRate.toFixed(1)}%** (${projects.filter(p => p.stage === 'delivered').length} of ${stats.totalProjects} delivered).` };
  }
  if (lower.includes('at risk') || lower.includes('at-risk')) {
    const risky = projects.filter(p => p.healthStatus === 'at-risk');
    if (risky.length === 0) return { reply: 'No projects currently at risk. 🎯' };
    return { reply: `**${risky.length} project(s) at risk:**\n${risky.map(p => `• ${p.name} (${p.stage})`).join('\n')}` };
  }
  if (lower.includes('blocked')) {
    const blocked = projects.filter(p => p.healthStatus === 'blocked');
    if (blocked.length === 0) return { reply: 'No blocked projects. All clear. ✅' };
    return { reply: `**${blocked.length} blocked project(s):**\n${blocked.map(p => `• ${p.name} (${p.stage})`).join('\n')}` };
  }
  if (lower.match(/stat|overview|summary|dashboard/)) {
    return {
      reply: `📊 **Pipeline Overview**\n• ${stats.totalProjects} projects — ${formatCurrency(stats.totalValue)} total value\n• ${stats.stageDistribution.production.count} in production, ${stats.stageDistribution.lead.count} leads\n• ${stats.atRisk} at risk, ${stats.blocked} blocked\n• ${stats.conversionRate.toFixed(0)}% conversion rate`,
    };
  }

  // Move project
  const moveMatch = lower.match(/move\s+(.+?)\s+to\s+(lead|qualified|design|permitting|production|delivered)/i);
  if (moveMatch) {
    const name = moveMatch[1].replace(/^the\s+/, '').replace(/\s+project$/, '');
    const stage = moveMatch[2] as Stage;
    const project = projects.find(p => p.name.toLowerCase().includes(name));
    if (project) {
      moveProject(project.id, stage);
      return { reply: `Moved **${project.name}** to **${stage}**. ✅` };
    }
    return { reply: `Couldn't find a project matching "${name}". Try using the full project name.` };
  }

  // Add project
  const addMatch = lower.match(/add\s+(?:a\s+)?(?:new\s+)?(?:project)?[:\s]*(.+)/i);
  if (addMatch && (lower.includes('add') && (lower.includes('unit') || lower.includes('project') || lower.includes('$')))) {
    const desc = addMatch[1];
    const unitMatch = desc.match(/(\d+)\s*unit/i);
    const valueMatch = desc.match(/\$?([\d.]+)\s*[mM]/);
    const cityMatch = desc.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    const stageMatch = desc.match(/(?:in\s+|currently\s+)(lead|qualified|design|permitting|production|delivered)/i);

    const project = addProject({
      name: cityMatch ? `${cityMatch[1]} ${unitMatch ? unitMatch[1] + '-Unit' : 'Project'}` : 'New Project',
      location: { city: cityMatch?.[1] || '', state: '' },
      unitCount: unitMatch ? parseInt(unitMatch[1]) : 0,
      estimatedValue: valueMatch ? parseFloat(valueMatch[1]) * 1_000_000 : 0,
      stage: (stageMatch?.[1]?.toLowerCase() as Stage) || 'lead',
    });
    return { reply: `Added **${project.name}** to **${project.stage}** — ${formatCurrency(project.estimatedValue)}. 🚀` };
  }

  // Show projects in a stage
  const stageQuery = STAGES.find(s => lower.includes(s));
  if (stageQuery && (lower.includes('show') || lower.includes('list') || lower.includes("what's in") || lower.includes('which'))) {
    const inStage = projects.filter(p => p.stage === stageQuery);
    if (inStage.length === 0) return { reply: `No projects in **${stageQuery}** right now.` };
    return {
      reply: `**${stageQuery.charAt(0).toUpperCase() + stageQuery.slice(1)}** (${inStage.length}):\n${inStage.map(p => `• ${p.name} — ${formatCurrency(p.estimatedValue)}, ${p.unitCount} units`).join('\n')}`,
    };
  }

  // Fallback
  return {
    reply: `I can help with:\n• **"Add a new project: 20 units in Denver, $3.5M"**\n• **"Move Austin to production"**\n• **"What's our total pipeline value?"**\n• **"Show me all projects in permitting"**\n• **"Pipeline overview"**\n• **"Which projects are at risk?"**`,
  };
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });
  const { reply } = parseMessage(message);
  return NextResponse.json({ reply });
}
