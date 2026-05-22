import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { scenario, transcript } = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const lines = (transcript || []).map((t: any) => (t.speaker === 'loan_officer' ? 'You' : scenario.borrower.name) + ': ' + t.content).join('\n');
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [{ role: 'user', content: 'Score this mortgage training call. Scenario: ' + scenario.title + '. Win condition: ' + scenario.win_condition + '.\n\n' + lines + '\n\nReturn ONLY valid JSON (no markdown):\n{"overall_score":70,"pass_fail":"pass","category_scores":{"discovery":14,"rapport":11,"needs_analysis":11,"product_positioning":11,"objection_handling":11,"compliance_safe_language":7,"closing_next_step":5},"what_went_well":["Good opening"],"missed_opportunities":["Ask more questions"],"best_objection_response":"Good response","coaching_notes":["Practice discovery"],"recommended_drill":"Discovery drill"}' }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const scorecard = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json(scorecard);
  } catch (e: any) {
    console.error('Score error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
