import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: reps } = await supabase
    .from('profiles')
    .select('id, full_name, email, rep_stats(*)');

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentCalls } = await supabase
    .from('training_calls')
    .select('id, scenario_id, mode, status, started_at, profiles(full_name), scorecards(overall_score, pass_fail)')
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ reps, recentCalls });
}
