import { NextRequest, NextResponse } from 'next/server';
import { getShareLink, getSharePayload } from '@/lib/store';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const link = getShareLink(params.id);

  if (!link) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(link);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { password } = await req.json().catch(() => ({ password: undefined }));
  const result = getSharePayload(params.id, password);

  if (!result.ok) {
    if (result.reason === 'not_found') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (result.reason === 'password_required') {
      return NextResponse.json({ error: 'Password required' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 403 });
  }

  return NextResponse.json(result);
}
