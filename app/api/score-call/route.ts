import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  try {
    const { scenario, transcript } = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const lines = transcript.map((t: any) => (t.speaker === 'loan_officer' ? 'Loan Officer' : 'Borrower') + ': ' + t.content).join('\n');
    const prompt = 'Score this mortgage training call.\n\nScenario: ' + scenario.title + '\nWin condition: ' + scenario.win_condition + '\n\nTranscript:\n' + lines + '\n\nReturn ONLY valid JSON with this exact structure, no markdown:\n{"overall_score":75,"pass_fail":"pass","category_scores":{"discovery":15,"rapport":12,"needs_analysis":12,"product_positioning":12,"objection_handling":12,"compliance_safe_language":8,"closing_next_step":7},"what_went_well":["Good opening","Built rapport"],"missed_opportunities":["Could ask more questions"],"best_objection_response":"Good handling","coaching_notes":["Work on discovery","Practice objections"],"recommended_drill":"Discovery questions drill"}';
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const scorecard = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json(scorecard);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
