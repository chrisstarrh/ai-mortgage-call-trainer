import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const { scenario_id, mode = 'text' } = await req.json();
  const { data, error } = await supabaseAdmin.from('training_calls').insert({ user_id: session?.user?.id ?? null, scenario_id, mode, status: 'started' }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ callId: data.id });
}
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('training_calls').select('id,scenario_id,mode,status,started_at,completed_at,scorecards(overall_score,pass_fail,recommended_drill)').eq('user_id',session.user.id).order('started_at',{ascending:false}).limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
