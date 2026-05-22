import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { scenario, messages } = await req.json();
    const system = 'You are ' + scenario.borrower.name + ', a homeowner considering mortgage refinance. Stay in character. Be realistic and conversational. Keep responses to 2-3 sentences max. Scenario: ' + scenario.title + '. Your motivation: ' + scenario.borrower.motivation + '. Objections you have: ' + (scenario.borrower.objections || []).join(', ') + '.';
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const stream = await client.messages.stream({ model: 'claude-sonnet-4-5', max_tokens: 150, system, messages });
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
