import { NextRequest, NextResponse } from 'next/server';
import { getProjects, addProject, updateProject, deleteProject, moveProject } from '@/lib/store';

export async function GET() {
  return NextResponse.json(getProjects());
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const project = addProject(data);
  return NextResponse.json(project, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, stage, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  if (stage && Object.keys(updates).length === 0) {
    const project = moveProject(id, stage);
    return project ? NextResponse.json(project) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const project = updateProject(id, stage ? { stage, ...updates } : updates);
  return project ? NextResponse.json(project) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const ok = deleteProject(id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
