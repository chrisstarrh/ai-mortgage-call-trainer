import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { scenario_id, mode = 'text' } = await req.json();
  const { data, error } = await supabaseAdmin
    .from('training_calls')
    .insert({ scenario_id, mode, status: 'started' })
    .select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ callId: data.id });
}

export async function GET() {
  return NextResponse.json([]);
}
