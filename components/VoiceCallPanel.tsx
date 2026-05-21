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
  const synthRef = useRef<SpeechSynthesisUtterance|null>(null);
  const activeRef = useRef(false);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { return () => { stopListening(); window.speechSynthesis?.cancel(); }; }, []);

  function stopListening() {
    try { recognitionRef.current?.stop(); } catch {}
  }

  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1.05; utt.pitch = 1.0; utt.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US English') || v.name.includes('Female'));
      if (preferred) utt.voice = preferred;
      utt.onend = () => resolve();
      utt.onerror = () => resolve();
      synthRef.current = utt;
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
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value);
    }
    return full;
  }, [scenario, callId]);

  const startListening = useCallback(() => {
    if (!activeRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatusText('Browser speech not supported. Try Chrome.'); return; }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    setPhase('listening');
    setStatusText('Listening... speak now');
    setCurrentSpeech('');

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setCurrentSpeech(transcript);
    };

    recognition.onend = async () => {
      if (!activeRef.current) return;
      const final = currentSpeechRef.current;
      setCurrentSpeech('');
      if (!final.trim()) { startListening(); return; }

      setPhase('thinking');
      setStatusText('Borrower is responding...');
      const newMessages = [...messagesRef.current, { role: 'user' as const, content: final }];
      setMessages(newMessages);

      const reply = await getBorrowerReply(newMessages);
      const withReply = [...newMessages, { role: 'assistant' as const, content: reply }];
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

  // Refs to get current values inside callbacks
  const currentSpeechRef = useRef('');
  useEffect(() => { currentSpeechRef.current = currentSpeech; }, [currentSpeech]);
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  async function startCall() {
    activeRef.current = true;
    setPhase('thinking');
    setStatusText('Connecting...');
    try {
      const res = await fetch('/api/calls', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenario.id, mode: 'voice' }),
      });
      const data = await res.json();
      if (data.callId) setCallId(data.callId);
    } catch {}

    const initMsgs = [{ role: 'user' as const, content: '[Call begins. Give a brief natural greeting as if you just answered the phone - 1-2 sentences only.]' }];
    setMessages(initMsgs);
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
    stopListening();
    window.speechSynthesis.cancel();
    setPhase('scoring');
    setStatusText('Scoring your call...');

    const transcript = messagesRef.current
      .filter(m => !m.content.startsWith('['))
      .map((m, i) => ({ speaker: m.role === 'user' ? 'loan_officer' as const : 'borrower' as const, content: m.content, sequence_num: i }));

    try {
      const res = await fetch('/api/score-call', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, transcript, callId }),
      });
      const data = await res.json();
      setScorecard(data);
      setPhase('scored');
    } catch { setPhase('active'); }
  }

  const phaseIcon: Record<string, string> = {
    idle: '📞', active: '🎙️', listening: '🎙️', thinking: '💭', speaking: '🔊', scoring: '📊', scored: '✅'
  };

  if (phase === 'scored' && scorecard) {
    return (
      <div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-primary mb-4 transition-colors">← Back</button>
        <ScorecardPanel scorecard={scorecard} scenario={scenario}
          onRetry={() => { setPhase('idle'); setMessages([]); setScorecard(null); setCallId(null); activeRef.current = false; }}
          onNewScenario={onBack} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="text-sm text-muted hover:text-primary transition-colors">← Back</button>
        <h2 className="text-base font-semibold text-primary">{scenario.borrower.name}</h2>
        {phase !== 'idle' && phase !== 'scoring' && phase !== 'scored'
          ? <button onClick={endCall} className="text-sm px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors">End & Score</button>
          : <div />
        }
      </div>

      {phase === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-6xl">📞</div>
          <div className="text-center">
            <p className="text-primary font-medium mb-1">{scenario.borrower.name}</p>
            <p className="text-muted text-sm max-w-sm">{scenario.summary}</p>
          </div>
          <button onClick={startCall} className="px-8 py-4 bg-accent text-white text-lg font-medium rounded-2xl hover:bg-accent/90 transition-colors shadow-lg">
            📞 Start Voice Call
          </button>
          <p className="text-xs text-muted">Browser will ask for microphone permission</p>
        </div>
      )}

      {phase !== 'idle' && phase !== 'scored' && (
        <>
          {/* Status indicator */}
          <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-surface border border-border rounded-xl">
            <span className="text-2xl">{phaseIcon[phase] || '🎙️'}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">{statusText}</p>
              {currentSpeech && <p className="text-xs text-accent mt-0.5 italic">"{currentSpeech}"</p>}
            </div>
            {phase === 'listening' && (
              <div className="flex gap-1">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="w-1 bg-accent rounded-full animate-pulse" style={{height: `${8 + i*4}px`, animationDelay: `${i*0.1}s`}} />
                ))}
              </div>
            )}
          </div>

          {/* Transcript */}
          <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-4" style={{maxHeight:'55vh'}}>
            {messages.filter(m => !m.content.startsWith('[')).map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${m.role === 'user' ? 'bg-accent text-white' : 'bg-surface border border-border text-primary'}`}>
                  <p className="text-xs opacity-60 mb-1">{m.role === 'user' ? 'You' : scenario.borrower.name}</p>
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
