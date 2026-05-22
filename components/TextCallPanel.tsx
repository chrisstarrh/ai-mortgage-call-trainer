'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Scenario, Scorecard } from '@/lib/types';
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

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, streamingText]);

  const streamReply = useCallback(async (msgs: any[]) => {
    setStreaming(true); setStreamingText('');
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, messages: msgs, callId }) });
      const reader = res.body!.getReader(); const dec = new TextDecoder(); let full = '';
      while (true) { const { done, value } = await reader.read(); if (done) break; full += dec.decode(value); setStreamingText(full); }
      setStreamingText(''); setMessages(p => [...p, { role: 'assistant', content: full }]);
    } finally { setStreaming(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [scenario, callId]);

  async function startCall() {
    setPhase('active');
    try { const res = await fetch('/api/calls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: scenario.id, mode: 'text' }) }); const d = await res.json(); if (d.callId) setCallId(d.callId); } catch {}
    const init = [{ role: 'user' as const, content: '[Call begins. Give a brief natural greeting, 1-2 sentences only.]' }];
    setMessages(init); await streamReply(init);
  }

  async function send() {
    const content = input.trim(); if (!content || streaming || phase !== 'active') return;
    setInput(''); const newMsgs = [...messages, { role: 'user' as const, content }]; setMessages(newMsgs); await streamReply(newMsgs);
  }

  async function endCall() {
    setPhase('scoring');
    const transcript = messages.filter(m => !m.content.startsWith('[')).map((m, i) => ({ speaker: m.role === 'user' ? 'loan_officer' : 'borrower', content: m.content, sequence_num: i }));
    try { const res = await fetch('/api/score-call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, transcript, callId }) }); setScorecard(await res.json()); setPhase('scored'); } catch { setPhase('active'); }
  }

  if (phase === 'scored' && scorecard) return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <header style={{padding:'20px 32px',display:'flex',alignItems:'center',gap:16,borderBottom:'1px solid var(--border)'}}>
        <button onClick={onBack} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',gap:6,fontFamily:'DM Sans,sans-serif'}}>← Back</button>
        <div style={{width:1,height:16,background:'var(--border)'}}></div>
        <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,letterSpacing:'-0.02em'}}>Call Review</span>
      </header>
      <div style={{maxWidth:700,margin:'0 auto',padding:'32px 24px'}}>
        <ScorecardPanel scorecard={scorecard} scenario={scenario}
          onRetry={() => { setPhase('idle'); setMessages([]); setScorecard(null); setCallId(null); }}
          onNewScenario={onBack} />
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <header style={{padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <button onClick={onBack} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',fontSize:13,fontFamily:'DM Sans,sans-serif'}}>← Back</button>
          <div style={{width:1,height:16,background:'var(--border)'}}></div>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,letterSpacing:'-0.02em'}}>{scenario.borrower.name}</div>
            <div style={{fontSize:11,color:'var(--text-faint)',fontFamily:'DM Mono,monospace',letterSpacing:'0.04em'}}>{scenario.title}</div>
          </div>
        </div>
        {phase === 'active' && <button onClick={endCall} style={{background:'var(--red-dim)',border:'1px solid rgba(244,63,94,0.25)',color:'var(--red)',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif',letterSpacing:'-0.01em'}}>End & Score</button>}
        {phase === 'scoring' && <div style={{fontSize:12,color:'var(--text-faint)',fontFamily:'DM Mono,monospace'}}>Scoring...</div>}
      </header>

      {/* Content */}
      <div style={{flex:1,display:'flex',flexDirection:'column',maxWidth:720,width:'100%',margin:'0 auto',padding:'24px 24px 0',minHeight:0}}>
        {phase === 'idle' && (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,textAlign:'center'}}>
            <div style={{width:72,height:72,background:'var(--accent-dim)',border:'1px solid var(--border-accent)',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>💬</div>
            <div>
              <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:22,letterSpacing:'-0.03em',marginBottom:8}}>{scenario.borrower.name}</div>
              <div style={{color:'var(--text-muted)',fontSize:14,maxWidth:380,lineHeight:1.65}}>{scenario.summary}</div>
            </div>
            <div style={{background:'var(--accent-dim)',border:'1px solid var(--border-accent)',borderRadius:12,padding:'10px 18px',fontSize:12,color:'var(--accent)',fontFamily:'DM Mono,monospace',maxWidth:420,lineHeight:1.5}}>
              🎯 {scenario.win_condition}
            </div>
            <button onClick={startCall} style={{background:'var(--accent)',color:'#020b14',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,letterSpacing:'-0.02em',border:'none',borderRadius:12,padding:'14px 32px',cursor:'pointer'}}>Start Call</button>
          </div>
        )}

        {(phase === 'active' || phase === 'scoring') && (
          <>
            <div ref={chatRef} style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:12,paddingBottom:16,minHeight:0}}>
              {messages.filter(m => !m.content.startsWith('[')).map((m, i) => (
                <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'75%',padding:'12px 16px',borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',fontSize:14,lineHeight:1.6,background:m.role==='user'?'var(--accent)':'var(--bg-card)',color:m.role==='user'?'#020b14':'var(--text)',border:m.role==='user'?'none':'1px solid var(--border)'}}>
                    <div style={{fontSize:10,opacity:0.6,marginBottom:4,fontFamily:'DM Mono,monospace',letterSpacing:'0.04em'}}>{m.role==='user'?'YOU':scenario.borrower.name.toUpperCase()}</div>
                    {m.content}
                  </div>
                </div>
              ))}
              {streamingText && (
                <div style={{display:'flex',justifyContent:'flex-start'}}>
                  <div style={{maxWidth:'75%',padding:'12px 16px',borderRadius:'18px 18px 18px 4px',fontSize:14,lineHeight:1.6,background:'var(--bg-card)',color:'var(--text)',border:'1px solid var(--border)'}}>
                    <div style={{fontSize:10,opacity:0.6,marginBottom:4,fontFamily:'DM Mono,monospace'}}>{scenario.borrower.name.toUpperCase()}</div>
                    {streamingText}
                  </div>
                </div>
              )}
            </div>
            <div style={{padding:'16px 0 24px',display:'flex',gap:10,flexShrink:0}}>
              <input ref={inputRef} className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && send()} placeholder="Type your response..." disabled={streaming || phase==='scoring'} />
              <button onClick={send} disabled={streaming || !input.trim()} style={{background:'var(--accent)',color:'#020b14',border:'none',borderRadius:10,padding:'0 20px',fontWeight:700,fontSize:13,cursor:'pointer',flexShrink:0,opacity:streaming||!input.trim()?0.5:1,fontFamily:'DM Sans,sans-serif'}}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
