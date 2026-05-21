import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', session.user.id)
    .single();

  if (!profile || !['manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Team reps + their stats
  const { data: reps } = await supabase
    .from('profiles')
    .select('id, full_name, email, rep_stats(*)')
    .eq('team_id', profile.team_id)
    .eq('role', 'loan_officer');

  // Recent calls across team (last 30 days)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentCalls } = await supabase
    .from('training_calls')
    .select(`
      id, scenario_id, mode, status, started_at,
      profiles (full_name),
      scorecards (overall_score, pass_fail)
    `)
    .eq('profiles.team_id', profile.team_id)
    .gte('started_at', since)
    .order('started_at', { ascending: false })
    .limit(50);

  // Scenario performance breakdown
  const { data: scenarioStats } = await supabase.rpc('scenario_pass_rates', {
    p_team_id: profile.team_id,
  }).catch(() => ({ data: null }));

  return NextResponse.json({ reps, recentCalls, scenarioStats });
}
