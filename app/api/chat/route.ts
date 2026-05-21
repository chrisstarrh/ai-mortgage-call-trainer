import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildBorrowerInstructions } from '@/lib/prompts';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const { scenario, messages } = await req.json();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({ async start(ctrl) {
    const resp = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: buildBorrowerInstructions(scenario),
      messages,
    });
    for await (const chunk of resp) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        ctrl.enqueue(encoder.encode(chunk.delta.text));
      }
    }
    ctrl.close();
  }});
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
