import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { scenario, transcript } = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const lines = (transcript || [])
      .map((t: any) => (t.speaker === 'loan_officer' ? 'Loan Officer' : scenario.borrower.name) + ': ' + t.content)
      .join('\n');

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: 'You are a mortgage sales training evaluator. Score this call transcript.\n\nScenario: ' + scenario.title + '\nWin condition: ' + scenario.win_condition + '\nBorrower: ' + scenario.borrower.name + '\n\nTranscript:\n' + lines + '\n\nReturn ONLY valid JSON, no markdown, matching this exact structure:\n{"overall_score":75,"pass_fail":"pass","category_scores":{"discovery":15,"rapport":12,"needs_analysis":12,"product_positioning":12,"objection_handling":12,"compliance_safe_language":7,"closing_next_step":5},"what_went_well":["Good rapport building","Clear explanation of benefits"],"missed_opportunities":["Could have asked about timeline earlier","Did not confirm next steps clearly"],"best_objection_response":"Description of best objection handling moment","coaching_notes":["Work on discovery questions","Be more concise when explaining rates"],"recommended_drill":"Practice the rate explanation in 30 seconds or less"}'
      }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const scorecard = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json(scorecard);
  } catch (e: any) {
    console.error('Score error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
