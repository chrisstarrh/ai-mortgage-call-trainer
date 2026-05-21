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
  const [currentSpeech, setCurrentSpeech] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const activeRef = useRef(false);
  const currentSpeechRef = useRef('');
  const messagesRef = useRef(messages);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { currentSpeechRef.current = currentSpeech; }, [currentSpeech]);
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
  useEffect(() => { return () => { try { recognitionRef.current?.stop(); } catch {} window.speechSynthesis?.cancel(); }; }, []);

  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.0; utt.pitch = 1.0; utt.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US English'));
      if (preferred) utt.voice = preferred;
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      window.speechSynthesis.speak(utt);
    });
  }, []);

  const getBorrowerReply = useCallback(async (msgs: any[]): Promise<string> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, messages: msgs, callId }),
    });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) { const { done, value } = await reader.read(); if (done) break; full += decoder.decode(value); }
    return full;
  }, [scenario, callId]);

  const startListening = useCallback(() => {
    if (!activeRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatusText('Speech not supported. Use Chrome.'); return; }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    setPhase('listening');
    setStatusText('Listening... speak now');
    setCurrentSpeech('');
    recognition.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setCurrentSpeech(t);
    };
    recognition.onend = async () => {
      if (!activeRef.current) return;
      const final = currentSpeechRef.current.trim();
      setCurrentSpeech('');
      if (!final) { startListening(); return; }
      setPhase('thinking');
      setStatusText('Borrower is thinking...');
      const newMsgs = [...messagesRef.current, { role: 'user' as const, content: final }];
      setMessages(newMsgs);
      const reply = await getBorrowerReply(newMsgs);
      const withReply = [...newMsgs, { role: 'assistant' as const, content: reply }];
      setMessages(withReply);
      setPhase('speaking');
      setStatusText('Borrower speaking...');
      await speakText(reply);
      if (activeRef.current) startListening();
    };
    recognition.onerror = (e: any) => {
      if (e.error === 'no-speech' && activeRef.current) startListening();
    };
    recognition.start();
  }, [getBorrowerReply, speakText]);

  async function startCall() {
    activeRef.current = true;
    setPhase('thinking');
    setStatusText('Connecting...');
    try {
      const res = await fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: scenario.id, mode: 'voice' }) });
      const data = await res.json();
      if (data.callId) setCallId(data.callId);
    } catch {}
    const initMsgs = [{ role: 'user' as const, content: '[Call begins. Give a brief natural greeting as if you just answered the phone - 1-2 sentences only.]' }];
    const greeting = await getBorrowerReply(initMsgs);
    const withGreeting = [...initMsgs, { role: 'assistant' as const, content: greeting }];
    setMessages(withGreeting);
    setPhase('speaking');
    setStatusText('Borrower speaking...');
    await speakText(greeting);
    if (activeRef.current) startListening();
  }

  async function endCall() {
    activeRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    window.speechSynthesis.cancel();
    setPhase('scoring');
    setStatusText('Scoring your call...');
    const transcript = messagesRef.current.filter(m => !m.content.startsWith('[')).map((m, i) => ({ speaker: m.role === 'user' ? 'loan_officer' as const : 'borrower' as const, content: m.content, sequence_num: i }));
    try {
      const res = await fetch('/api/score-call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, transcript, callId }) });
      const data = await res.json();
      setScorecard(data); setPhase('scored');
    } catch { setPhase('active'); }
  }

  if (phase === 'scored' && scorecard) return (
    <div>
      <button onClick={onBack} className='flex items-center gap-2 text-sm text-muted hover:text-primary mb-4'>&#8592; Back</button>
      <ScorecardPanel scorecard={scorecard} scenario={scenario} onRetry={() => { setPhase('idle'); setMessages([]); setScorecard(null); setCallId(null); activeRef.current = false; }} onNewScenario={onBack} />
    </div>
  );

  const icons: Record<string,string> = { idle:'📞', thinking:'💭', listening:'🎙️', speaking:'🔊', scoring:'📊' };

  return (
    <div className='flex flex-col h-full max-w-2xl mx-auto'>
      <div className='flex items-center justify-between mb-4'>
        <button onClick={onBack} className='text-sm text-muted hover:text-primary'>&#8592; Back</button>
        <h2 className='text-base font-semibold text-primary'>{scenario.borrower.name}</h2>
        {phase !== 'idle' && phase !== 'scoring' && phase !== 'scored'
          ? <button onClick={endCall} className='text-sm px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg'>End &amp; Score</button>
          : <div />}
      </div>

      {phase === 'idle' && (
        <div className='flex-1 flex flex-col items-center justify-center gap-6'>
          <div className='text-6xl'>📞</div>
          <div className='text-center'>
            <p className='text-primary font-medium mb-1'>{scenario.borrower.name}</p>
            <p className='text-muted text-sm max-w-sm'>{scenario.summary}</p>
          </div>
          <button onClick={startCall} className='px-8 py-4 bg-accent text-white text-lg font-medium rounded-2xl hover:bg-accent/90 transition-colors'>
            📞 Start Voice Call
          </button>
          <p className='text-xs text-muted'>Allow microphone access when prompted</p>
        </div>
      )}

      {phase !== 'idle' && phase !== 'scored' && (
        <>
          <div className='flex items-center gap-3 mb-4 px-4 py-3 bg-surface border border-border rounded-xl'>
            <span className='text-2xl'>{icons[phase] || '🎙️'}</span>
            <div className='flex-1'>
              <p className='text-sm font-medium text-primary'>{statusText}</p>
              {currentSpeech && <p className='text-xs text-accent mt-0.5 italic'>"{currentSpeech}"</p>}
            </div>
            {phase === 'listening' && (
              <div className='flex gap-1 items-end'>
                {[8,12,16,12,8].map((h, i) => (<div key={i} className='w-1.5 bg-accent rounded-full animate-pulse' style={{height: h+'px', animationDelay: (i*0.1)+'s'}} />))}
              </div>
            )}
          </div>
          <div ref={chatRef} className='flex-1 overflow-y-auto space-y-3 mb-4' style={{maxHeight:'55vh'}}>
            {messages.filter(m => !m.content.startsWith('[')).map((m, i) => (
              <div key={i} className={['flex', m.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}>
                <div className={['max-w-sm px-4 py-2.5 rounded-2xl text-sm', m.role === 'user' ? 'bg-accent text-white' : 'bg-surface border border-border text-primary'].join(' ')}>
                  <p className='text-xs opacity-60 mb-1'>{m.role === 'user' ? 'You' : scenario.borrower.name}</p>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
