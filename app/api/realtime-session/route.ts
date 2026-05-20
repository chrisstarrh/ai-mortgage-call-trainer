import { NextRequest, NextResponse } from 'next/server';
import { buildBorrowerInstructions } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  const { scenario } = await req.json();
  const instructions = buildBorrowerInstructions(scenario);

  const r = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-realtime-2',
      voice: 'alloy',
      instructions,
      input_audio_transcription: { model: 'gpt-4o-mini-transcribe' },
      turn_detection: { type: 'server_vad' }
    })
  });

  if (!r.ok) return NextResponse.json({ error: await r.text() }, { status: 500 });
  return NextResponse.json(await r.json());
}
