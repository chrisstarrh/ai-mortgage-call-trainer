'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Scenario, TranscriptLine, Scorecard } from '@/lib/types';
import { ScorecardPanel } from './ScorecardPanel';

const QUICK_STARTERS = [
  'Hi, is this a good time to chat?',
  "What's your main goal with this call today?",
  'Tell me about your current mortgage situation.',
  "What's driving you to look at refinancing now?",
];

interface Props {
  scenario: Scenario;
  onBack: () => void;
}

export function TextCallPanel({ scenario, onBack }: Props) {
  const [phase, setPhase] = useState<'idle' | 'active' | 'scoring' | 'scored'>('idle');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTime = useRef<number>(0);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingText]);

  const appendSystem = (content: string) => {
    setTranscript((t) => [...t, { speaker: 'system', content, sequence_num: t.length }]);
  };

  async function startCall() {
    setPhase('active');
    startTime.current = Date.now();
    try {
      const res = await fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: scenario.id, mode: 'text' }) });
      const data = await res.json();
      if (data.callId) setCallId(data.callId);
    } catch {}
    appendSystem(`Call started — speaking with ${scenario.borrower.name}`);
    await streamBorrowerReply([{ role: 'user', content: '[Call begins. Give a brief, natural greeting as if you just answered the phone - 1-2 sentences only.]' }]);
  }

  const streamBorrowerReply = useCallback(async (msgs) => {
    setStreaming(true); setStreamingText('');
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, messages: msgs, callId }) });
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let full = '';
      while (true) { const { done, value } = await reader.read(); if (done) break; full += decoder.decode(value); setStreamingText(full); }
      setStreamingText(''); setMessages(p => [...p, { role: 'assistant', content: full }]); setTranscript(t => [...t, { speaker: 'borrower', content: full, sequence_num: t.length }]);
    } catch { setStreamingText(''); } finally { setStreaming(false); setTimeout(() => inputRef.current?.focus(), 100); }
    }, [scenario, callId]);

  async function sendMessage(text) {
    const content = (text ?? input).trim();
    if (!content || streaming || phase !== 'active') return;
    setInput('');
    const newMsg = { role: 'user', content };
    const newMessages = [...messages, newMsg];
    setMessages(newMessages); setTranscript(t => [...t, { speaker: 'loan_officer', content, sequence_num: t.length }]);
    await streamBorrowerReply(newMessages);
  }

  async function endCall() {
    setPhase('scoring'); appendSystem('Call ended — generating scorecard…');
    const res = await fetch('/api/score-call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, transcript: transcript.filter(t => t.speaker !== 'system'), callId }) });
    const data = await res.json(); setScorecard(data); setPhase('scored');
  }

  if (phase === 'scored' && scorecard) return(<div><button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-primary mb-4 transition-colors">← Back</button><ScorecardPanel scorecard={scorecard} scenario={scenario} onRetry={() => { setPhase('idle'); setMessages([]); setTranscript([]); setScorecard(null); setCallId(null); }} onNewScenario={onBack} /></div>)

  return(<div className="flex flex-col h-full"><p>Text Call Panel</p></div>);
}
