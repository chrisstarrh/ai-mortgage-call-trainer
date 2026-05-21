import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildBorrowerSystemPrompt } from '@/lib/prompts';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
export const runtime = 'edge';
export async function POST(req: NextRequest) {
  const { scenario, messages, callId } = await req.json();
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const stream = await client.messages.stream({ model: 'claude-sonnet-4-20250514', max_tokens: 300, system: buildBorrowerSystemPrompt(scenario), messages });
  const encoder = new TextEncoder();
  let fullText = '';
  const readable = new ReadableStream({ async start(ctrl) {
    for await (const chunk of stream) {
      if (chunk.type==='content_block_delta'&&chunk.delta.type==='text_delta') { fullText+=chunk.delta.text; ctrl.enqueue(encoder.encode(chunk.delta.text)); }
    }
    if(callId){ supabaseAdmin.from('call_transcripts').insert({call_id:callId,speaker:'borrower',content:fullText,sequence_num:messages.length+1}).catch(()=>{}); }
    ctrl.close();
  } });
  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
