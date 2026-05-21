import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { scenario_id, mode = 'text' } = await req.json();
  const { data, error } = await supabaseAdmin
    .from('training_calls')
    .insert({ user_id: null, scenario_id, mode, status: 'started' })
    .select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ callId: data.id });
}

export async function GET() {
  const { data } = await supabaseAdmin
    .from('training_calls')
    .select('id, scenario_id, mode, status, started_at, scorecards(overall_score, pass_fail)')
    .order('started_at', { ascending: false })
    .limit(20);
  return NextResponse.json(data ?? []);
}
