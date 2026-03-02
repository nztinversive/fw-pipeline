import { NextRequest, NextResponse } from 'next/server';
import { createShareLink, getShareLinks } from '@/lib/store';
import { AudienceType, ViewMode } from '@/lib/types';

export async function GET() {
  return NextResponse.json(getShareLinks());
}

export async function POST(req: NextRequest) {
  const { audience, viewMode, password, expiresInDays } = await req.json();
  const link = createShareLink(
    audience as AudienceType,
    viewMode as ViewMode | undefined,
    password,
    expiresInDays
  );
  return NextResponse.json(link, { status: 201 });
}
