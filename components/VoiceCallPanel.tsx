'use client';
import { useState, useRef, useEffect } from 'react';
import type { Scenario, TranscriptLine, Scorecard } from '@/lib/types';
import { ScorecardPanel } from './ScorecardPanel';

export function VoiceCallPanel({ scenario, onBack }: { scenario: any; onBack: () => void }) {
  const [phase, setPhase] = useState('idle');
  const [transcript, setTranscript] = useState<any[]>([]);
  const [scorecard, setScorecard] = useState<any>(null);
  const [callId, setCallId] = useState<string|null>(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  const pcRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const animRef = useRef<any>(null);
  const chatRef = useRef<any>(null);

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }); }, [transcript]);
  useEffect(() => { return () => { pcRef.current?.close(); if(timerRef.current)clearInterval(timerRef.current); if(animRef.current)cancelAnimationFrame(animRef.current); }; }, []);

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  async function startCall() {
    setPhase('connecting');
    try {
      const callRes = await fetch('/api/calls', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ scenario_id: scenario.id, mode:'voice' }) });
      const cd = await callRes.json(); if(cd.callId)setCallId(cd.callId);
      const tokRes = await fetch('/api/realtime-session', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ scenario }) });
      const td = await tokRes.json(); const epk = td.client_secret?.value ?? td.value;
      if(!td || !epk)throw new Error('No ephemeral key received. Check OPENAI_API_KEY.');
      const pc = new RTCPeerConnection(); pcRef.current=pc;
      const ael = document.createElement('audio'); ael.autoplay=true; pc.ontrack=e=>{ael.srcObject=e.streams[0];};
      const ms = await navigator.mediaDevices.getUserMedia({audio:true}); pc.addTrack(ms.getTracks()[0]);
      const dc = pc.createDataChannel('oai-events');
      dc.addEventListener('message', e => { try { const m = JSON.parse(e.data); if(m.type==='conversation.item.input_audio_transcription.completed')setTranscript(t=>[...t,{speaker:'loan_officer',content:m.transcript,sequence_num:t.length}]); if(m.type==='response.audio_transcript.done')setTranscript(t=>[...t,{speaker:'borrower',content:m.transcript,sequence_num:t.length}]); }catch{} });
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const sdpRes = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',{method:'POST',body:offer.sdp,headers:{Authorization:`Bearer ${epk}`,'Content-Type':'application/sdp'}});
      await pc.setRemoteDescription({type:'answer',sdp:await sdpRes.text()});
      setPhase('active'); timerRef.current=setInterval(()=>setDuration(d=>d+1),1000);
      setTranscript(t=>[...t,{speaker:'system',content:`Voice call started with ${scenario.borrower.name}`,sequence_num:0}]);
    }catch(err){ setTranscript([{speaker:'system',content:`Error: ${err.message}`,sequence_num:0}]); setPhase('idle'); }
  }

  async function endCall() {
    pcRef.current?.close(); if(timerRef.current)clearInterval(timerRef.current); setVolume(0); setPhase('scoring');
    const res = await fetch('/api/score-call',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario,transcript:transcript.filter(t=>t.speaker!=='system'),callId})});
    const data = await res.json(); setScorecard(data); setPhase('scored');
  }

  if(phase==='scored'&&scorecard)return(<div><button onClick={onBack} className="flex items-center gap-2 text-sm text-muted hover:text-primary mb-4 transition-colors">← Back</button><ScorecardPanel scorecard={scorecard} scenario={scenario} onRetry={()=>{setPhase('idle');setTranscript([]);setScorecard(null);setDuration(0);}} onNewScenario={onBack} /></div>);

  return(<div className="flex flex-col"><p>Voice Call with {scenario.borrower.name}</p><button onClick={phase==='idle'?startCall:endCall}>{pohase==='idle'?'Start':'scoring'?'Scoring...':'End call'}</button></div>);
}
