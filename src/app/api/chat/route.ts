import { NextRequest, NextResponse } from 'next/server';
import { getProjects, addProject, moveProject } from '@/lib/store';
import { computeStats, formatCurrency } from '@/lib/stats';
import { Stage, Project } from '@/lib/types';

const STAGES_LIST: Stage[] = ['lead', 'qualified', 'design', 'permitting', 'production', 'delivered'];

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ─── Keyword-based fallback (original parser) ────────────────────────────────

function parseMessageKeyword(msg: string): { reply: string } {
  const trimmed = msg.trim();
  const lower = trimmed.toLowerCase();
  const projects = getProjects();
  const stats = computeStats(projects);

  if (lower.includes('total value') || lower.includes('pipeline value')) {
    return { reply: `Total pipeline value: **${formatCurrency(stats.totalValue)}** across ${stats.totalProjects} projects.` };
  }
  if (lower.includes('how many') && lower.includes('project')) {
    return { reply: `You have **${stats.totalProjects} projects** in the pipeline. ${stats.atRisk} at risk, ${stats.blocked} blocked.` };
  }
  if (lower.includes('conversion') || lower.includes('close rate')) {
    return { reply: `Conversion rate (Lead to Delivered): **${stats.conversionRate.toFixed(1)}%** (${projects.filter(p => p.stage === 'delivered').length} of ${stats.totalProjects} delivered).` };
  }
  if (lower.includes('at risk') || lower.includes('at-risk')) {
    const risky = projects.filter(p => p.healthStatus === 'at-risk');
    if (risky.length === 0) return { reply: 'No projects currently at risk.' };
    return { reply: `**${risky.length} project(s) at risk:**\n${risky.map(p => `• ${p.name} (${p.stage})`).join('\n')}` };
  }
  if (lower.includes('blocked')) {
    const blocked = projects.filter(p => p.healthStatus === 'blocked');
    if (blocked.length === 0) return { reply: 'No blocked projects. All clear.' };
    return { reply: `**${blocked.length} blocked project(s):**\n${blocked.map(p => `• ${p.name} (${p.stage})`).join('\n')}` };
  }
  if (lower.match(/stat|overview|summary|dashboard/)) {
    return {
      reply: `**Pipeline Overview**\n• ${stats.totalProjects} projects — ${formatCurrency(stats.totalValue)} total value\n• ${stats.stageDistribution.production.count} in production, ${stats.stageDistribution.lead.count} leads\n• ${stats.atRisk} at risk, ${stats.blocked} blocked\n• ${stats.conversionRate.toFixed(0)}% conversion rate`,
    };
  }

  const moveMatch = lower.match(/move\s+(.+?)\s+to\s+(lead|qualified|design|permitting|production|delivered)/i);
  if (moveMatch) {
    const name = moveMatch[1].replace(/^the\s+/, '').replace(/\s+project$/, '');
    const stage = moveMatch[2] as Stage;
    const project = projects.find(p => p.name.toLowerCase().includes(name));
    if (project) {
      moveProject(project.id, stage);
      return { reply: `Moved **${project.name}** to **${stage}**.` };
    }
    return { reply: `Couldn't find a project matching "${name}". Try using the full project name.` };
  }

  const addMatch = trimmed.match(/add\s+(?:a\s+)?(?:new\s+)?(?:project)?[:\s]*(.+)/i);
  if (addMatch && (lower.includes('add') && (lower.includes('unit') || lower.includes('project') || lower.includes('$')))) {
    const desc = addMatch[1];
    const unitMatch = desc.match(/(\d+)\s*unit/i);
    const valueMatch = desc.match(/\$?([\d.]+)\s*[mM]/);
    const cityMatch = desc.match(/\bin\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/);
    const stageMatch = desc.match(/(?:in\s+|currently\s+)(lead|qualified|design|permitting|production|delivered)/i);
    const city = cityMatch ? toTitleCase(cityMatch[1]) : '';

    const project = addProject({
      name: city ? `${city} ${unitMatch ? unitMatch[1] + '-Unit' : 'Project'}` : 'New Project',
      location: { city, state: '' },
      unitCount: unitMatch ? parseInt(unitMatch[1]) : 0,
      estimatedValue: valueMatch ? parseFloat(valueMatch[1]) * 1_000_000 : 0,
      stage: (stageMatch?.[1]?.toLowerCase() as Stage) || 'lead',
    });
    return { reply: `Added **${project.name}** to **${project.stage}** — ${formatCurrency(project.estimatedValue)}.` };
  }

  const stageQuery = STAGES_LIST.find(s => lower.includes(s));
  if (stageQuery && (lower.includes('show') || lower.includes('list') || lower.includes("what's in") || lower.includes('which'))) {
    const inStage = projects.filter(p => p.stage === stageQuery);
    if (inStage.length === 0) return { reply: `No projects in **${stageQuery}** right now.` };
    return {
      reply: `**${stageQuery.charAt(0).toUpperCase() + stageQuery.slice(1)}** (${inStage.length}):\n${inStage.map(p => `• ${p.name} — ${formatCurrency(p.estimatedValue)}, ${p.unitCount} units`).join('\n')}`,
    };
  }

  return {
    reply: `I can help with:\n• **"Pipeline overview"**\n• **"Move Austin to production"**\n• **"Add a new project: 20 units in Denver, $3.5M"**\n• **"Which projects are at risk?"**\n• **"Show me projects in permitting"**`,
  };
}

// ─── OpenAI-powered assistant ─────────────────────────────────────────────────

async function handleWithOpenAI(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ reply: string }> {
  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const projects = getProjects();
  const stats = computeStats(projects);

  const systemPrompt = `You are a construction pipeline management assistant for Fading West, a modular construction company. Be concise, friendly, and data-driven. Use ** for bold text. Use bullet points with • for lists.

Current Pipeline Data:
${JSON.stringify(projects.map(p => ({
  id: p.id, name: p.name, city: p.location.city, state: p.location.state,
  stage: p.stage, units: p.unitCount, value: p.estimatedValue,
  priority: p.priority, health: p.healthStatus,
  contacts: p.contacts.map(c => c.name).join(', '), notes: p.notes,
})), null, 2)}

Pipeline Stats:
- Total: ${stats.totalProjects} projects, ${formatCurrency(stats.totalValue)}
- At Risk: ${stats.atRisk}, Blocked: ${stats.blocked}
- Conversion Rate: ${stats.conversionRate.toFixed(1)}%

Available stages: ${STAGES_LIST.join(', ')}`;

  const tools: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }> = [
    {
      type: 'function',
      function: {
        name: 'move_project',
        description: 'Move a project to a different pipeline stage',
        parameters: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: 'Name or partial name of the project' },
            target_stage: { type: 'string', enum: STAGES_LIST, description: 'The stage to move the project to' },
          },
          required: ['project_name', 'target_stage'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'add_project',
        description: 'Add a new project to the pipeline',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Project name' },
            city: { type: 'string', description: 'City location' },
            state: { type: 'string', description: 'State abbreviation (e.g. CO, TX)' },
            unit_count: { type: 'number', description: 'Number of units' },
            estimated_value: { type: 'number', description: 'Estimated value in dollars' },
            stage: { type: 'string', enum: STAGES_LIST, description: 'Initial pipeline stage' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
          required: ['name'],
        },
      },
    },
  ];

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await client.chat.completions.create({
    model: 'gpt-5-mini',
    max_completion_tokens: 1024,
    messages,
    tools,
    tool_choice: 'auto',
  });

  const choice = response.choices[0];

  // Handle tool calls
  if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
    const toolResults: Array<{ role: 'tool'; tool_call_id: string; content: string }> = [];

    for (const tc of choice.message.tool_calls) {
      if (tc.type !== 'function') {
        continue;
      }

      const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      let result = '';

      if (tc.function.name === 'move_project') {
        const projectName = String(args.project_name || '').toLowerCase();
        const targetStage = args.target_stage as Stage;
        const project = projects.find(p =>
          p.name.toLowerCase().includes(projectName)
        );
        if (project) {
          moveProject(project.id, targetStage);
          result = `Moved "${project.name}" to ${targetStage}`;
        } else {
          result = `Project "${String(args.project_name || '')}" not found`;
        }
      } else if (tc.function.name === 'add_project') {
        const newProject = addProject({
          name: String(args.name || 'Untitled Project'),
          location: { city: String(args.city || ''), state: String(args.state || '') },
          unitCount: Number(args.unit_count || 0),
          estimatedValue: Number(args.estimated_value || 0),
          stage: (args.stage as Stage) || 'lead',
          priority: (args.priority as Project['priority']) || 'medium',
        });
        result = `Added "${newProject.name}" to ${newProject.stage} stage with value ${formatCurrency(newProject.estimatedValue)}`;
      }

      toolResults.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result,
      });
    }

    // Send tool results back for final response
    const assistantToolMessage = {
      role: 'assistant' as const,
      content: choice.message.content ?? '',
      tool_calls: choice.message.tool_calls,
    };

    const followUp = await client.chat.completions.create({
      model: 'gpt-5-mini',
      max_completion_tokens: 1024,
      messages: [
        ...messages,
        assistantToolMessage,
        ...toolResults,
      ],
      tools,
    });

    return { reply: followUp.choices[0].message.content || 'Done.' };
  }

  return { reply: choice.message.content || 'I processed your request.' };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();
  if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });

  // Use OpenAI if API key is configured
  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await handleWithOpenAI(message, history || []);
      return NextResponse.json(result);
    } catch (error) {
      console.error('OpenAI API error:', error);
      const { reply } = parseMessageKeyword(message);
      return NextResponse.json({ reply: reply + '\n\n*(AI assistant unavailable, using basic mode)*' });
    }
  }

  // Fallback to keyword matching
  const { reply } = parseMessageKeyword(message);
  return NextResponse.json({ reply });
}
