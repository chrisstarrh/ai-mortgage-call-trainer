import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { scenario_id, mode = 'text' } = await req.json();
    // Try to log to DB but don't fail if it errors
    try {
      const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
      const { data } = await supabaseAdmin
        .from('training_calls')
        .insert({ user_id: null, scenario_id, mode, status: 'started' })
        .select('id').single();
      if (data?.id) return NextResponse.json({ callId: data.id });
    } catch {}
    // Return a fake callId if DB fails - calls still work
    return NextResponse.json({ callId: 'local-' + Date.now() });
  } catch (e: any) {
    return NextResponse.json({ callId: 'local-' + Date.now() });
  }
}

export async function GET() {
  return NextResponse.json([]);
}
