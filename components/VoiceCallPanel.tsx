'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Scenario, Scorecard } from '@/lib/types';
import { ScorecardPanel } from './ScorecardPanel';
interface Props { scenario: Scenario; onBack: () => void; }
export function VoiceCallPanel({ scenario, onBack }: Props) {
  const [phase, setPhase] = useState<string>('idle');
  const [messages, setMessages] = useState<Array<{role:string;content:string}>>([]);
  const [callId, setCallId] = useState<string|null>(null);
  const [scorecard, setScorecard] = useState<Scorecard|null>(null);
  const [statusText, setStatusText] = useState('Ready');
  const [currentSpeech, setCurrentSpeech] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const activeRef = useRef(false);
  const speechRef = useRef('');
  const msgsRef = useRef<Array<{role:string;content:string}>>([]);
  useEffect(() => { msgsRef.current = messages; }, [messages]);
  useEffect(() => { speechRef.current = currentSpeech; }, [currentSpeech]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
  const speak = useCallback((text: string) => new Promise<void>(resolve => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    const v = window.speechSynthesis.getVoices().find((x: SpeechSynthesisVoice) => x.name.includes('Samantha') || x.name.includes('Google US English'));
    if (v) u.voice = v;
    u.onend = () => resolve(); u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  }), []);
  const getReply = useCallback(async (msgs: Array<{role:string;content:string}>) => {
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, messages: msgs, callId }) });
    const reader = res.body!.getReader(); const dec = new TextDecoder(); let full = '';
    while (true) { const { done, value } = await reader.read(); if (done) break; full += dec.decode(value); }
    return full;
  }, [scenario, callId]);
  const listen = useCallback(() => {
    if (!activeRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatusText('Use Chrome for voice'); return; }
    const r = new SR(); r.continuous = false; r.interimResults = true; r.lang = 'en-US'; recRef.current = r;
    setPhase('listening'); setStatusText('Listening... speak now'); setCurrentSpeech('');
    r.onresult = (e: any) => { setCurrentSpeech(Array.from(e.results).map((x: any) => x[0].transcript).join('')); };
    r.onend = async () => {
      if (!activeRef.current) return;
      const said = speechRef.current.trim(); setCurrentSpeech('');
      if (!said) { listen(); return; }
      setPhase('thinking'); setStatusText('Borrower responding...');
      const next = [...msgsRef.current, { role: 'user', content: said }];
      setMessages(next);
      const reply = await getReply(next);
      const full = [...next, { role: 'assistant', content: reply }];
      setMessages(full); setPhase('speaking'); setStatusText('Borrower speaking...');
      await speak(reply);
      if (activeRef.current) listen();
    };
    r.onerror = (e: any) => { if (e.error === 'no-speech' && activeRef.current) listen(); };
    r.start();
  }, [getReply, speak]);
  async function startCall() {
    activeRef.current = true; setPhase('thinking'); setStatusText('Connecting...');
    try { const res = await fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: scenario.id, mode: 'voice' }) }); const data = await res.json(); if (data.callId) setCallId(data.callId); } catch (_) {}
    const init = [{ role: 'user', content: '[Call begins. Give a brief natural greeting - 1-2 sentences only.]' }];
    const greeting = await getReply(init);
    setMessages([...init, { role: 'assistant', content: greeting }]);
    setPhase('speaking'); setStatusText('Borrower speaking...');
    await speak(greeting);
    if (activeRef.current) listen();
  }
  async function endCall() {
    activeRef.current = false; try { recRef.current?.stop(); } catch (_) {} window.speechSynthesis.cancel();
    setPhase('scoring'); setStatusText('Scoring...');
    const tx = msgsRef.current.filter(m => !m.content.startsWith('[')).map((m, i) => ({ speaker: m.role === 'user' ? 'loan_officer' : 'borrower', content: m.content, sequence_num: i }));
    try { const res = await fetch('/api/score-call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, transcript: tx, callId }) }); setScorecard(await res.json()); setPhase('scored'); } catch (_) { setPhase('active'); }
  }
  if (phase === 'scored' && scorecard) return (
    <div>
      <button onClick={onBack} className='text-sm text-muted hover:text-primary mb-4 block'>&#8592; Back</button>
      <ScorecardPanel scorecard={scorecard} scenario={scenario} onRetry={() => { setPhase('idle'); setMessages([]); setScorecard(null); setCallId(null); activeRef.current = false; }} onNewScenario={onBack} />
    </div>
  );
  return (
    <div className='flex flex-col h-full max-w-2xl mx-auto'>
      <div className='flex items-center justify-between mb-4'>
        <button onClick={onBack} className='text-sm text-muted hover:text-primary'>&#8592; Back</button>
        <h2 className='text-base font-semibold text-primary'>{scenario.borrower.name}</h2>
        {phase !== 'idle' && phase !== 'scoring' && phase !== 'scored' ? <button onClick={endCall} className='text-sm px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg'>End &amp; Score</button> : <div />}
      </div>
      {phase === 'idle' && (
        <div className='flex-1 flex flex-col items-center justify-center gap-6'>
          <div className='text-6xl'>&#128222;</div>
          <p className='text-muted text-sm text-center max-w-sm'>{scenario.summary}</p>
          <button onClick={startCall} className='px-8 py-4 bg-accent text-white text-lg font-medium rounded-2xl hover:bg-accent/90 transition-colors'>&#128222; Start Voice Call</button>
          <p className='text-xs text-muted'>Allow microphone when prompted &#8212; Chrome recommended</p>
        </div>
      )}
      {phase !== 'idle' && phase !== 'scored' && (
        <div className='flex flex-col flex-1'>
          <div className='flex items-center gap-3 mb-4 px-4 py-3 bg-surface border border-border rounded-xl'>
            <p className='text-sm font-medium text-primary flex-1'>{statusText}</p>
            {currentSpeech ? <p className='text-xs text-accent italic'>{currentSpeech}</p> : null}
          </div>
          <div ref={chatRef} className='flex-1 overflow-y-auto space-y-3 mb-4' style={{ maxHeight: '55vh' }}>
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