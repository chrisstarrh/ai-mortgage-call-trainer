'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ScorecardPanel } from './ScorecardPanel';

export function VoiceCallPanel({ scenario, onBack }) {
  const [phase, setPhase] = useState('idle');
  const [msgs, setMsgs] = useState([]);
  const [callId, setCallId] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [status, setStatus] = useState('');
  const [interim, setInterim] = useState('');
  const active = useRef(false);
  const recRef = useRef(null);
  const interimRef = useRef('');
  const msgsRef = useRef([]);

  useEffect(() => { msgsRef.current = msgs; }, [msgs]);
  useEffect(() => { interimRef.current = interim; }, [interim]);
  useEffect(() => {
    return () => {
      active.current = false;
      try { recRef.current && recRef.current.stop(); } catch(e) {}
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === 'en-US') || voices[0];
      if (voice) utt.voice = voice;
      utt.onend = resolve;
      utt.onerror = resolve;
      window.speechSynthesis.speak(utt);
    });
  }, []);

  const getReply = useCallback(async (messages) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, messages, callId }),
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value);
    }
    return full;
  }, [scenario, callId]);

  const listen = useCallback(() => {
    if (!active.current) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus('Voice not supported — use Chrome'); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    recRef.current = rec;
    setPhase('listening');
    setStatus('Listening — speak now');
    setInterim('');

    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setInterim(t);
    };

    rec.onend = async () => {
      if (!active.current) return;
      const said = interimRef.current.trim();
      setInterim('');
      if (!said) { listen(); return; }
      setPhase('thinking');
      setStatus('Borrower is thinking...');
      const newMsgs = msgsRef.current.concat([{ role: 'user', content: said }]);
      setMsgs(newMsgs);
      const reply = await getReply(newMsgs);
      const withReply = newMsgs.concat([{ role: 'assistant', content: reply }]);
      setMsgs(withReply);
      if (!active.current) return;
      setPhase('speaking');
      setStatus('Borrower speaking...');
      await speak(reply);
      if (active.current) listen();
    };

    rec.onerror = (e) => {
      if (active.current && (e.error === 'no-speech' || e.error === 'aborted')) listen();
    };

    try { rec.start(); } catch(e) {}
  }, [getReply, speak]);

  async function startCall() {
    active.current = true;
    setPhase('thinking');
    setStatus('Connecting...');
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenario.id, mode: 'voice' }),
      });
      const data = await res.json();
      if (data.callId) setCallId(data.callId);
    } catch(e) {}
    const init = [{ role: 'user', content: '[Call begins. Give a brief natural greeting as if you just answered the phone, 1-2 sentences only.]' }];
    setMsgs(init);
    const greeting = await getReply(init);
    setMsgs(init.concat([{ role: 'assistant', content: greeting }]));
    setPhase('speaking');
    setStatus('Borrower speaking...');
    await speak(greeting);
    if (active.current) listen();
  }

  async function endCall() {
    active.current = false;
    try { recRef.current && recRef.current.stop(); } catch(e) {}
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setPhase('scoring');
    setStatus('Scoring your call...');
    const transcript = msgsRef.current
      .filter(m => !m.content.startsWith('['))
      .map((m, i) => ({ speaker: m.role === 'user' ? 'loan_officer' : 'borrower', content: m.content, sequence_num: i }));
    try {
      const res = await fetch('/api/score-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, transcript, callId }),
      });
      setScorecard(await res.json());
      setPhase('scored');
    } catch(e) { setPhase('active'); }
  }

  if (phase === 'scored' && scorecard) {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-muted hover:text-primary mb-4 block">Back</button>
        <ScorecardPanel
          scorecard={scorecard}
          scenario={scenario}
          onRetry={() => { setPhase('idle'); setMsgs([]); setScorecard(null); setCallId(null); active.current = false; }}
          onNewScenario={onBack}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-sm text-muted hover:text-primary">Back</button>
        <h2 className="font-semibold text-primary">{scenario.borrower.name}</h2>
        {phase !== 'idle' && phase !== 'scoring' && phase !== 'scored' ? (
          <button onClick={endCall} className="text-sm px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
            End and Score
          </button>
        ) : <div />}
      </div>

      {phase === 'idle' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="text-7xl">📞</div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-primary">{scenario.borrower.name}</p>
            <p className="text-sm text-muted max-w-sm">{scenario.summary}</p>
          </div>
          <button onClick={startCall} className="px-8 py-4 bg-accent text-white text-lg font-semibold rounded-2xl hover:bg-accent/90 transition-colors">
            📞 Start Voice Call
          </button>
          <p className="text-xs text-muted">Requires microphone permission. Use Chrome.</p>
        </div>
      )}

      {phase !== 'idle' && phase !== 'scored' && (
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">{status}</p>
              {interim && <p className="text-xs text-accent italic mt-0.5">{interim}</p>}
            </div>
            {phase === 'listening' && (
              <div className="flex items-end gap-0.5 h-5">
                <div className="w-1 bg-accent rounded-full animate-pulse" style={{height:'9px'}} />
                <div className="w-1 bg-accent rounded-full animate-pulse" style={{height:'15px',animationDelay:'0.1s'}} />
                <div className="w-1 bg-accent rounded-full animate-pulse" style={{height:'21px',animationDelay:'0.2s'}} />
                <div className="w-1 bg-accent rounded-full animate-pulse" style={{height:'15px',animationDelay:'0.3s'}} />
                <div className="w-1 bg-accent rounded-full animate-pulse" style={{height:'9px',animationDelay:'0.4s'}} />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-3" style={{maxHeight:'55vh'}}>
            {msgs.filter(m => !m.content.startsWith('[')).map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={m.role === 'user'
                  ? 'max-w-sm px-4 py-2.5 rounded-2xl text-sm bg-accent text-white'
                  : 'max-w-sm px-4 py-2.5 rounded-2xl text-sm bg-surface border border-border text-primary'
                }>
                  <p className="text-xs opacity-60 mb-1">{m.role === 'user' ? 'You' : scenario.borrower.name}</p>
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
