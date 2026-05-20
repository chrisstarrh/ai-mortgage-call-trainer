import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { scenario, transcript } = await req.json();
  const prompt = `Score this mortgage roleplay call. Scenario: ${JSON.stringify(scenario)} Transcript: ${transcript || 'No transcript captured. Score as incomplete.'}`;

  const response = await client.responses.create({
    model: 'gpt-5.5',
    input: [
      { role: 'system', content: 'You are a strict mortgage sales trainer. Return valid JSON only.' },
      { role: 'user', content: prompt }
    ]
  });

  const text = response.output_text;
  try { return NextResponse.json(JSON.parse(text)); }
  catch { return NextResponse.json({ raw: text }); }
}
