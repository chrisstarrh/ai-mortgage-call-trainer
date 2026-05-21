import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { scenario, transcript, callId } = await req.json();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a mortgage training evaluator. Score this call transcript.

Scenario: ${scenario.title}
Borrower: ${scenario.borrower.name}
Win condition: ${scenario.win_condition}

Transcript:
${transcript.map((t: any) => `${t.speaker}: ${t.content}`).join('\n')}

Return ONLY valid JSON with this exact structure:
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
  "what_went_well": ["<string>", "<string>"],
  "missed_opportunities": ["<string>", "<string>"],
  "best_objection_response": "<string>",
  "coaching_notes": ["<string>", "<string>"],
  "recommended_drill": "<string>"
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as any).text;
  const scorecard = JSON.parse(text.match(/{[sS]*}/)[0]);

  if (callId) {
    await supabaseAdmin.from('scorecards').insert({
      call_id: callId,
      ...scorecard,
    }).catch(() => {});
  }

  return NextResponse.json(scorecard);
}
