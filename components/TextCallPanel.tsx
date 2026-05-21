'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Scenario, TranscriptLine, Scorecard } from '@/lib/types';
import { ScorecardPanel } from './ScorecardPanel';

interface Props { scenario: Scenario; onBack: () => void; }

export function TextCallPanel({ scenario, onBack }: Props) {
  const [phase, setPhase] = useState<'idle'|'active'|'scoring'|'scored'>('idle');
  const [messages, setMessages] = useState<Array<{role:'user'|'assistant';content:string}>>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [callId, setCallId] = useState<string|null>(null);
  const [scorecard, setScorecard] = useState<Scorecard|null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingText]);

  const streamBorrowerReply = useCallback(async (msgs: any[]) => {
    setStreaming(true); setStreamingText('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, messages: msgs, callId }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setStreamingText(full);
      }
      setStreamingText('');
      setMessages(p => [...p, { role: 'assistant', content: full }]);
    } catch(e) {
      setStreamingText('');
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [scenario, callId]);

  async function startCall() {
    setPhase('active');
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenario.id, mode: 'text' }),
      });
      const data = await res.json();
      if (data.callId) setCallId(data.callId);
    } catch {}
    const initMsg = [{ role: 'user' as const, content: '[Call begins. Give a brief natural greeting as if you just answered the phone - 1-2 sentences only.]' }];
    setMessages(initMsg);
    await streamBorrowerReply(initMsg);
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || streaming || phase !== 'active') return;
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content }];
    setMessages(newMessages);
    await streamBorrowerReply(newMessages);
  }

  async function endCall() {
    setPhase('scoring');
    const transcript = messages.map((m, i) => ({
      speaker: m.role === 'user' ? 'loan_officer' as const : 'borrower' as const,
      content: m.content,
      sequence_num: i,
    }));
    try {
      const res = await fetch('/api/score-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, transcript, callId }),
      });
      const data = await res.json();
      setScorecard(data);
      setPhase('scored');
    } catch {
      setPhase('active');
    }
  }

  if (phase === 'scored' && scorecard) {
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-primary mb-4 transition-colors">&#8592; Back</button>
        <ScorecardPanel scorecard={scorecard} scenario={scenario} onRetry={() => { setPhase('idle'); setMessages([]); setScorecard(null); setCallId(null); }} onNewScenario={onBack} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-muted hover:text-primary transition-colors">&#8592; Back</button>
        <h2 className="text-base font-semibold text-primary">{scenario.borrower.name}</h2>
        {phase === 'active' && <button onClick={endCall} className="text-sm px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">End &amp; Score</button>}
        {phase === 'idle' && <div />}
        {phase === 'scoring' && <span className="text-sm text-muted">Scoring...</span>}
      </div>

      {phase === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted text-sm text-center max-w-sm">{scenario.summary}</p>
          <button onClick={startCall} className="px-6 py-3 bg-accent text-white font-medium rounded-xl hover:bg-accent/90 transition-colors">Start Call</button>
        </div>
      )}

      {(phase === 'active' || phase === 'scoring') && (
        <>
          <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0" style={{maxHeight:'60vh'}}>
            {messages.filter(m => !m.content.startsWith('[')).map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'bg-accent text-white' : 'bg-surface border border-border text-primary'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm bg-surface border border-border text-primary">{streamingText}</div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type your response..."
              disabled={streaming || phase === 'scoring'}
              className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent/40 disabled:opacity-50"
            />
            <button onClick={sendMessage} disabled={streaming || !input.trim() || phase === 'scoring'} className="px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50">Send</button>
          </div>
        </>
      )}
    </div>
  );
}
