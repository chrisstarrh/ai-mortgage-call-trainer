import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { scenario, messages } = await req.json();
    const b = scenario.borrower;
    const system = [
      'You are ' + b.name + ', a real homeowner considering a mortgage refinance. Stay in character at all times.',
      'Personality: ' + b.personality,
      'Scenario: ' + scenario.title,
      'Your motivation: ' + b.motivation,
      'Your main objections: ' + (b.objections || []).join('; '),
      'Voice style: ' + b.voice_style,
      '',
      'Rules:',
      '- Keep ALL responses to 2-3 sentences maximum. Never give long speeches.',
      '- React naturally to what the loan officer says. If they explain something well, soften. If they are pushy or unclear, push back.',
      '- Raise your objections naturally during the conversation, not all at once.',
      '- Never break character or mention you are an AI.',
      '- Do NOT volunteer that you are ready to commit — make the loan officer earn it.',
    ].join('\n');

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-5',
      max_tokens: 150,
      system,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(ctrl) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            ctrl.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        ctrl.close();
      },
    });

    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (e: any) {
    console.error('Chat error:', e.message);
    return new Response('I apologize, could you repeat that?', { status: 200 });
  }
}
