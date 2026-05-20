'use client';
import { useMemo, useState } from 'react';
import scenarios from '@/data/scenarios.json';

export default function TrainingPage({ searchParams }: { searchParams: { scenario?: string }}) {
  const scenario = useMemo(() => scenarios.find(s => s.id === searchParams.scenario) || scenarios[0], [searchParams.scenario]);
  const [status, setStatus] = useState('Not started');
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<any>(null);

  async function startCall() {
    setStatus('Connecting...');
    const tokenRes = await fetch('/api/realtime-session', { method: 'POST', body: JSON.stringify({ scenario }) });
    const tokenData = await tokenRes.json();
    const ephemeralKey = tokenData.client_secret?.value || tokenData.value;

    const peer = new RTCPeerConnection();
    const audioEl = document.createElement('audio');
    audioEl.autoplay = true;
    peer.ontrack = (e) => { audioEl.srcObject = e.streams[0]; };

    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    peer.addTrack(ms.getTracks()[0]);

    const dc = peer.createDataChannel('oai-events');
    dc.addEventListener('message', (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type?.includes('transcript') && msg.transcript) setTranscript(t => t + '\n' + msg.transcript);
      } catch {}
    });

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    const sdpResponse = await fetch('https://api.openai.com/v1/realtime?model=gpt-realtime-2', {
      method: 'POST',
      body: offer.sdp,
      headers: { Authorization: `Bearer ${ephemeralKey}`, 'Content-Type': 'application/sdp' }
    });
    const answer = { type: 'answer' as RTCSdpType, sdp: await sdpResponse.text() };
    await peer.setRemoteDescription(answer);
    setPc(peer);
    setStatus('Live call in progress');
  }

  async function endCall() {
    pc?.close();
    setStatus('Call ended. Scoring...');
    const res = await fetch('/api/score-call', { method: 'POST', body: JSON.stringify({ scenario, transcript }) });
    const data = await res.json();
    setScore(data);
    setStatus('Scored');
  }

  return <main className="container">
    <h1>{scenario.title}</h1>
    <p className="muted">Borrower: {scenario.borrower.name} · {scenario.borrower.personality}</p>
    <div className="card"><strong>Status:</strong> {status}</div>
    <button className="btn" onClick={startCall}>Start Call</button>{' '}
    <button className="btn secondary" onClick={endCall}>End & Score</button>
    <div className="card"><h2>Live Transcript Notes</h2><pre>{transcript || 'Transcript events will appear here when supported by session events.'}</pre></div>
    {score && <div className="card"><h2>Scorecard</h2><pre>{JSON.stringify(score, null, 2)}</pre></div>}
  </main>
}
