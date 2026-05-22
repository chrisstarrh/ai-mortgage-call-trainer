import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const { scenario, transcript, callId } = await req.json();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const transcriptText = transcript
    .map((t: any) => (t.speaker === 'loan_officer' ? 'Loan Officer' : 'Borrower') + ': ' + t.content)
    .join('\n');

  const prompt = 'You are a mortgage sales training evaluator. Score this call.\n\nScenario: ' + scenario.title + '\nWin condition: ' + scenario.win_condition + '\n\nTranscript:\n' + transcriptText + '\n\nReturn ONLY valid JSON:\n{"overall_score":0,"pass_fail":"fail","category_scores":{"discovery":0,"rapport":0,"needs_analysis":0,"product_positioning":0,"objection_handling":0,"compliance_safe_language":0,"closing_next_step":0},"what_went_well":[],"missed_opportunities":[],"best_objection_response":"","coaching_notes":[],"recommended_drill":""}';

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  const clean = text.replace(/```json|```/g, '').trim();
  
  try {
    const scorecard = JSON.parse(clean);
    // Try to save to DB
    try {
      const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
      await supabaseAdmin.from('scorecards').insert({ call_id: callId, ...scorecard });
    } catch {}
    return NextResponse.json(scorecard);
  } catch {
    return NextResponse.json({ error: 'Failed to parse scorecard' }, { status: 500 });
  }
}
