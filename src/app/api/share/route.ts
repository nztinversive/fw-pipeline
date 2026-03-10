import { NextRequest, NextResponse } from 'next/server';
import { createShareLink, getShareLinks } from '@/lib/store';
import { AudienceType, AUDIENCE_VIEW_MAP, ViewMode } from '@/lib/types';

export async function GET() {
  return NextResponse.json(getShareLinks());
}

export async function POST(req: NextRequest) {
  const { audience, viewMode, password, expiresInDays } = await req.json();
  if (!audience || !Object.keys(AUDIENCE_VIEW_MAP).includes(audience)) {
    return NextResponse.json({ error: 'Invalid audience' }, { status: 400 });
  }

  const link = createShareLink(
    audience as AudienceType,
    viewMode as ViewMode | undefined,
    password,
    expiresInDays
  );
  return NextResponse.json(link, { status: 201 });
}
