import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ callId: 'call-' + Date.now() });
}

export async function GET() {
  return NextResponse.json([]);
}
