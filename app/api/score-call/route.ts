import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { scenario, transcript, callId } = await req.json();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const transcriptText = transcript
    .map((t: any) => `${t.speaker === 'loan_officer' ? 'Loan Officer' : 'Borrower'}: ${t.content}`)
    .join('\n');

  const prompt = `You are a mortgage sales training evaluator. Score this call transcript.

Scenario: ${scenario.title}
Win condition: ${scenario.win_condition}

Transcript:
${transcriptText}

Return ONLY valid JSON matching this exact structure:
{
  "overall_score": <0-100>,
  "pass_fail": "<pass|fail>",
  "category_scores": {
    "discovery": <0-20>,
    "rapport": <0-15>,
    "needs_analysis": <0-15>,
    "product_positioning": <0-15>,
    "objection_handling": <0-15>,
    "compliance_safe_language": <0-10>,
    "closing_next_step": <0-10>
  },
  "what_went_well": ["<item>", "<item>", "<item>"],
  "missed_opportunities": ["<item>", "<item>"],
  "best_objection_response": "<quote or description>",
  "coaching_notes": ["<note>", "<note>", "<note>"],
  "recommended_drill": "<drill description>"
}`;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  const clean = text.replace(/```json|```/g, '').trim();
  const scorecard = JSON.parse(clean);

  if (callId) {
    await supabaseAdmin.from('scorecards').insert({
      call_id: callId,
      ...scorecard,
    }).catch(() => {});
    await supabaseAdmin.from('training_calls').update({
      status: 'scored',
      completed_at: new Date().toISOString(),
    }).eq('id', callId).catch(() => {});
  }

  return NextResponse.json(scorecard);
}
