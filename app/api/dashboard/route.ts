import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const { data: reps } = await supabaseAdmin.from('profiles').select('id, full_name, email');
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentCalls } = await supabaseAdmin
    .from('training_calls')
    .select('id, scenario_id, mode, status, started_at, scorecards(overall_score, pass_fail)')
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(50);
  return NextResponse.json({ reps, recentCalls });
}
