'use client';
import{useState,useRef,useEffect,useCallback}from 'react';
import type{Scenario,Scorecard}from'@/lib/types';
import{ScorecardPanel}from'./ScorecardPanel';
interface P{scenario:Scenario;onBack:()=>void;}
export function VoiceCallPanel({scenario,onBack}:P){
 const[phase,setPhase]=useState('idle');
 const[msgs,setMsgs]=useState<any[]>([]);
 const[callId,setCallId]=useState<string|null>(null);
 const[sc,setSc]=useState<Scorecard|null>(null);
 const[status,setStatus]=useState('');
 const[interim,setInterim]=useState('');
 const active=useRef(false);
 const rec=useRef<any>(null);
 const iRef=useRef('');
 const mRef=useRef<any[]>([]);
 useEffect(()=>{mRef.current=msgs;},[msgs]);
 useEffect(()=>{iRef.current=interim;},[interim]);
 useEffect(()=>{return()=>{active.current=false;try{rec.current?.stop();}catch{}window.speechSynthesis?.cancel();};},[]);
 const speak=useCallback((t:string)=>new Promise<void>(res=>{
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(t);
  const vs=window.speechSynthesis.getVoices();
  const v=vs.find(x=>x.lang==='en-US')||vs[0];
  if(v)u.voice=v;
  u.onend=()=>res();u.onerror=()=>res();
  window.speechSynthesis.speak(u);
 }),[]);
 const getReply=useCallback(async(ms:any[])=>{
  const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario,messages:ms,callId})});
  const reader=r.body!.getReader();const dec=new TextDecoder();let full='';
  while(true){const{done,value}=await reader.read();if(done)break;full+=dec.decode(value);}
  return full;
 },[scenario,callId]);
 const listen=useCallback(()=>{
  if(!active.current)return;
  const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  if(!SR){setStatus('Use Chrome for voice support');return;}
  const r=new SR();r.continuous=false;r.interimResults=true;r.lang='en-US';
  rec.current=r;setPhase('listening');setStatus('Listening...');setInterim('');
  r.onresult=(e:any)=>{setInterim(Array.from(e.results).map((x:any)=>x[0].transcript).join(''));};
  r.onend=async()=>{
   if(!active.current)return;
   const said=iRef.current.trim();setInterim('');
   if(!said){listen();return;}
   setPhase('thinking');setStatus('Borrower thinking...');
   const nm=[...mRef.current,{role:'user',content:said}];setMsgs(nm);
   const reply=await getReply(nm);
   const wr=[...nm,{role:'assistant',content:reply}];setMsgs(wr);
   if(!active.current)return;
   setPhase('speaking');setStatus('Borrower speaking...');
   await speak(reply);if(active.current)listen();
  };
  r.onerror=(e:any)=>{if(active.current&&(e.error==='no-speech'||e.error==='aborted'))listen();};
  try{r.start();}catch{}
 },[getReply,speak]);
 async function startCall(){
  active.current=true;setPhase('thinking');setStatus('Connecting...');
  try{const r=await fetch('/api/calls',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario_id:scenario.id,mode:'voice'})});const d=await r.json();if(d.callId)setCallId(d.callId);}catch{}
  const init=[{role:'user',content:'[Call begins. Give a brief natural greeting as if you just answered the phone, 1-2 sentences only.]'}];
  setMsgs(init);const greeting=await getReply(init);
  setMsgs([...init,{role:'assistant',content:greeting}]);
  setPhase('speaking');setStatus('Borrower speaking...');
  await speak(greeting);if(active.current)listen();
 }
 async function endCall(){
  active.current=false;try{rec.current?.stop();}catch{}window.speechSynthesis.cancel();
  setPhase('scoring');setStatus('Scoring your call...');
  const tr=mRef.current.filter(m=>!m.content.startsWith('[')).map((m,i)=>({speaker:m.role==='user'?'loan_officer':'borrower',content:m.content,sequence_num:i}));
  try{const r=await fetch('/api/score-call',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scenario,transcript:tr,callId})});setSc(await r.json());setPhase('scored');}catch{setPhase('active');}
 }
 if(phase==='scored'&&sc)return(<div><button onClick={onBack} className='text-sm text-muted hover:text-primary mb-4 block'>Back</button><ScorecardPanel scorecard={sc} scenario={scenario} onRetry={()=>{setPhase('idle');setMsgs([]);setSc(null);setCallId(null);active.current=false;}} onNewScenario={onBack}/></div>);
 return(
  <div className='flex flex-col h-full max-w-2xl mx-auto'>
   <div className='flex items-center justify-between mb-6'>
    <button onClick={onBack} className='text-sm text-muted hover:text-primary'>Back</button>
    <h2 className='font-semibold text-primary'>{scenario.borrower.name}</h2>
    {phase!=='idle'&&phase!=='scoring'&&phase!=='scored'?<button onClick={endCall} className='text-sm px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg'>End and Score</button>:<div/>}
   </div>
   {phase==='idle'&&(
    <div className='flex-1 flex flex-col items-center justify-center gap-6'>
     <div className='text-7xl'>📞</div>
     <div className='text-center'><p className='text-lg font-medium text-primary'>{scenario.borrower.name}</p><p className='text-sm text-muted'>{scenario.summary}</p></div>
     <button onClick={startCall} className='px-8 py-4 bg-accent text-white text-lg font-semibold rounded-2xl hover:bg-accent/90'>Start Voice Call</button>
     <p className='text-xs text-muted'>Requires microphone. Best in Chrome.</p>
    </div>
   )}
   {phase!=='idle'&&phase!=='scored'&&(
    <div className='flex flex-col flex-1'>
     <div className='flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl mb-4'>
      <div className='flex-1'><p className='text-sm font-medium text-primary'>{status}</p>{interim&&<p className='text-xs text-accent italic mt-0.5'>{interim}</p>}</div>
     </div>
     <div className='flex-1 overflow-y-auto space-y-3' style={{maxHeight:'55vh'}}>
      {msgs.filter(m=>!m.content.startsWith('[')).map((m,i)=>(
       <div key={i} className={m.role==='user'?'flex justify-end':'flex justify-start'}>
        <div className={m.role==='user'?'max-w-sm px-4 py-2.5 rounded-2xl text-sm bg-accent text-white':'max-w-sm px-4 py-2.5 rounded-2xl text-sm bg-surface border border-border text-primary'}>
         <p className='text-xs opacity-60 mb-1'>{m.role==='user'?'You':scenario.borrower.name}</p>
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