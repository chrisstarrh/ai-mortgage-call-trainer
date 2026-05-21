'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Scenario, Scorecard } from '@/lib/types';
import { ScorecardPanel } from './ScorecardPanel';

interface Props { scenario: Scenario; onBack: () => void; }

export function VoiceCallPanel({ scenario, onBack }: Props) {
  const [phase, setPhase] = useState<'idle'|'active'|'listening'|'thinking'|'speaking'|'scoring'|'scored'>('idle');
  const [messages, setMessages] = useState<Array<{role:'user'|'assistant';content:string}>>([]);
  const [callId, setCallId] = useState<string|null>(null);
  const [scorecard, setScorecard] = useState<Scorecard|null>(null);
  const [statusText, setStatusText] = useState('');
  const [interimText, setInterimText] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const activeRef = useRef(false);
  const interimRef = useRef('');
  const msgsRef = useRef<Array<{role:'user'|'assistant';content:string}>>([]);

  useEffect(() => { msgsRef.current = messages; }, [messages]);
  useEffect(() => { interimRef.current = interimText; }, [interimText]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
  useEffect(() => { return () => { activeRef.current = false; try { recRef.current?.stop(); } catch {} window.speechSynthesis?.cancel(); }; }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0; u.pitch = 1.0; u.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find(x => x.lang === 'en-US') || voices[0];
      if (v) u.voice = v;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }, []);

  const getReply = useCallback(async (msgs: any[]): Promise<string> => {
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, messages: msgs, callId }) });
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let full = '';
    while (true) { const { done, value } = await reader.read(); if (done) break; full += dec.decode(value); }
    return full;
  }, [scenario, callId]);

  const listen = useCallback(() => {
    if (!activeRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatusText('Try Chrome — speech not supported here'); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    recRef.current = rec;
    setPhase('listening'); setStatusText('Listening...'); setInterimText('');
    rec.onresult = (e: any) => { setInterimText(Array.from(e.results).map((r: any) => r[0].transcript).join('')); };
    rec.onend = async () => {
      if (!activeRef.current) return;
      const said = interimRef.current.trim();
      setInterimText('');
      if (!said) { listen(); return; }
      setPhase('thinking'); setStatusText('Borrower thinking...');
      const newMsgs = [...msgsRef.current, { role: 'user' as const, content: said }];
      setMessages(newMsgs);
      const reply = await getReply(newMsgs);
      const withReply = [...newMsgs, { role: 'assistant' as const, content: reply }];
      setMessages(withReply);
      if (!activeRef.current) return;
      setPhase('speaking'); setStatusText('Borrower speaking...');
      await speak(reply);
      if (activeRef.current) listen();
    };
    rec.onerror = (e: any) => { if (activeRef.current && (e.error === 'no-speech' || e.error === 'aborted')) listen(); };
    try { rec.start(); } catch {}
  }, [getReply, speak]);

  async function startCall() {
    activeRef.current = true;
    setPhase('thinking'); setStatusText('Connecting...');
    try {
      const res = await fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: scenario.id, mode: 'voice' }) });
      const d = await res.json();
      if (d.callId) setCallId(d.callId);
    } catch {}
    const init = [{ role: 'user' as const, content: '[Call begins. Give a brief natural greeting as if you just answered the phone — 1-2 sentences only.]' }];
    setMessages(init);
    const greeting = await getReply(init);
    setMessages([...init, { role: 'assistant' as const, content: greeting }]);
    setPhase('speaking'); setStatusText('Borrower speaking...');
    await speak(greeting);
    if (activeRef.current) listen();
  }

  async function endCall() {
    activeRef.current = false;
    try { recRef.current?.stop(); } catch {}
    window.speechSynthesis.cancel();
    setPhase('scoring'); setStatusText('Scoring your call...');
    const transcript = msgsRef.current.filter(m => !m.content.startsWith('[')).map((m, i) => ({ speaker: m.role === 'user' ? 'loan_officer' as const : 'borrower' as const, content: m.content, sequence_num: i }));
    try {
      const res = await fetch('/api/score-call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, transcript, callId }) });
      setScorecard(await res.json()); setPhase('scored');
    } catch { setPhase('active'); }
  }

  if (phase === 'scored' && scorecard) return (
    <div>
      <button onClick={onBack} className='text-sm text-muted hover:text-primary mb-4 block'>back</button>
      <ScorecardPanel scorecard={scorecard} scenario={scenario}
        onRetry={() => { setPhase('idle'); setMessages([]); setScorecard(null); setCallId(null); activeRef.current = false; }}
        onNewScenario={onBack} />
    </div>
  );

  const icons: Record<string,string> = { idle:'phone', thinking:'thinking', listening:'mic', speaking:'speaker', scoring:'chart' };

  return (
    <div className='flex flex-col h-full max-w-2xl mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <button onClick={onBack} className='text-sm text-muted hover:text-primary'>Back</button>
        <h2 className='font-semibold text-primary'>{scenario.borrower.name}</h2>
        {phase !== 'idle' && phase !== 'scoring' && phase !== 'scored'
          ? <button onClick={endCall} className='text-sm px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg'>End and Score</button>
          : <div />}
      </div>

      {phase === 'idle' && (
        <div className='flex-1 flex flex-col items-center justify-center gap-6'>
          <div className='text-7xl'>📞</div>
          <div className='text-center space-y-2'>
            <p className='text-lg font-medium text-primary'>{scenario.borrower.name}</p>
            <p className='text-sm text-muted max-w-sm'>{scenario.summary}</p>
          </div>
          <button onClick={startCall} className='px-8 py-4 bg-accent text-white text-lg font-semibold rounded-2xl hover:bg-accent/90 transition-colors'>
            Start Voice Call
          </button>
          <p className='text-xs text-muted'>Requires microphone. Works best in Chrome.</p>
        </div>
      )}

      {phase !== 'idle' && phase !== 'scored' && (
        <div className='flex flex-col flex-1'>
          <div className='flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl mb-4'>
            <div className='flex-1'>
              <p className='text-sm font-medium text-primary'>{statusText}</p>
              {interimText && <p className='text-xs text-accent italic mt-0.5'>{interimText}</p>}
            </div>
            {phase === 'listening' && <div className='flex items-end gap-0.5 h-5'>{[3,5,7,5,3].map((h,i) => <div key={i} className='w-1 bg-accent rounded-full animate-pulse' style={{height: h*3+2}} />)}</div>}
          </div>
          <div ref={chatRef} className='flex-1 overflow-y-auto space-y-3' style={{maxHeight:'55vh'}}>
            {messages.filter(m => !m.content.startsWith('[')).map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={m.role === 'user' ? 'max-w-sm px-4 py-2.5 rounded-2xl text-sm bg-accent text-white' : 'max-w-sm px-4 py-2.5 rounded-2xl text-sm bg-surface border border-border text-primary'}>
                  <p className='text-xs opacity-60 mb-1'>{m.role === 'user' ? 'You' : scenario.borrower.name}</p>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
