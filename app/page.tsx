import Link from 'next/link';

const SCENARIOS = [
  { id: 'cashout-debt-consolidation', title: 'Discovery Call', sub: 'Cash-Out Refi', summary: 'Gather full application details and book a second call to review the numbers together.', difficulty: 'Easy', tag: 'easy', borrower: 'Michelle Torres', icon: '👩' },
  { id: 'second-call-pitch', title: 'Second Call Pitch', sub: 'Present the Numbers', summary: 'Explain the benefits clearly and concisely. Handle objections and secure a commitment.', difficulty: 'Medium', tag: 'medium', borrower: 'Michelle Torres', icon: '👩' },
  { id: 'heloc-home-improvement', title: 'HELOC Discovery', sub: 'Home Improvement', summary: 'Walk an analytical borrower through HELOC options and get them to submit a formal application.', difficulty: 'Medium', tag: 'medium', borrower: 'James Park', icon: '👨' },
  { id: 'va-cashout-payment-relief', title: 'VA Loan Call', sub: 'Payment Relief', summary: 'Earn the trust of a veteran who has been burned before. Complete the VA application.', difficulty: 'Hard', tag: 'hard', borrower: 'Robert Martinez', icon: '👨' },
];

export default function Home() {
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
      {/* Header */}
      <header style={{padding:'24px 40px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid var(--border)',position:'relative',zIndex:2}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,background:'var(--accent)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:'#020b14',letterSpacing:'-0.02em'}}>IQ</div>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,letterSpacing:'-0.04em',lineHeight:1}}>MS<span style={{color:'var(--accent)'}}>.</span>IQ</div>
            <div style={{fontSize:10,color:'var(--text-faint)',letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:'DM Mono,monospace',marginTop:1}}>Mortgage Sales Intelligence</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:100,padding:'6px 14px',fontSize:12,color:'var(--text-muted)',fontFamily:'DM Mono,monospace'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'var(--emerald)',boxShadow:'0 0 6px rgba(16,185,129,0.5)'}}></div>
          AI Ready
        </div>
      </header>

      {/* Hero */}
      <div style={{padding:'64px 40px 48px',maxWidth:960,margin:'0 auto',position:'relative',zIndex:2}}>
        <div style={{marginBottom:12,display:'inline-flex',alignItems:'center',gap:8,background:'var(--accent-dim)',border:'1px solid var(--border-accent)',borderRadius:100,padding:'4px 14px',fontSize:11,color:'var(--accent)',fontFamily:'DM Mono,monospace',letterSpacing:'0.06em',textTransform:'uppercase'}}>
          Call Training Suite
        </div>
        <h1 style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'clamp(32px,5vw,52px)',letterSpacing:'-0.04em',lineHeight:1.1,marginBottom:16,marginTop:12}}>
          Train smarter.<br/>
          <span style={{color:'var(--accent)'}}>Close better.</span>
        </h1>
        <p style={{color:'var(--text-muted)',fontSize:16,maxWidth:480,lineHeight:1.7,marginBottom:0}}>
          Practice real mortgage sales calls against AI borrowers. Get instant scored feedback on every conversation.
        </p>
      </div>

      {/* Grid */}
      <div style={{padding:'0 40px 80px',maxWidth:960,margin:'0 auto',position:'relative',zIndex:2}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(420px,1fr))',gap:16}}>
          {SCENARIOS.map((s, i) => (
            <div key={s.id} style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:'28px 28px 24px',display:'flex',flexDirection:'column',gap:20,transition:'border-color 0.2s,transform 0.2s',position:'relative',overflow:'hidden'}}>
              {/* Top row */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:11,color:'var(--text-faint)',fontFamily:'DM Mono,monospace',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:6}}>{s.sub}</div>
                  <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:20,letterSpacing:'-0.03em',lineHeight:1.2}}>{s.title}</div>
                </div>
                <span style={{fontSize:10,fontWeight:700,letterSpacing:'0.06em',textTransform:'uppercase',padding:'4px 10px',borderRadius:100,fontFamily:'DM Mono,monospace',background:s.tag==='easy'?'var(--emerald-dim)':s.tag==='medium'?'var(--amber-dim)':'var(--red-dim)',color:s.tag==='easy'?'var(--emerald)':s.tag==='medium'?'var(--amber)':'var(--red)',border:'1px solid '+(s.tag==='easy'?'rgba(16,185,129,0.25)':s.tag==='medium'?'rgba(245,158,11,0.25)':'rgba(244,63,94,0.25)')}}>
                  {s.difficulty}
                </span>
              </div>

              <p style={{color:'var(--text-muted)',fontSize:14,lineHeight:1.65}}>{s.summary}</p>

              {/* Borrower */}
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(255,255,255,0.03)',borderRadius:10,border:'1px solid var(--border)'}}>
                <span style={{fontSize:20}}>{s.icon}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{s.borrower}</div>
                  <div style={{fontSize:11,color:'var(--text-faint)',fontFamily:'DM Mono,monospace'}}>AI Borrower</div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{display:'flex',gap:10}}>
                <Link href={"/training?scenario="+s.id+"&mode=text"} style={{flex:1,textAlign:'center',padding:'11px 16px',background:'var(--accent)',color:'#020b14',fontWeight:700,fontSize:13,borderRadius:10,textDecoration:'none',letterSpacing:'-0.01em',fontFamily:'DM Sans,sans-serif',transition:'opacity 0.15s'}}>
                  Text Call
                </Link>
                <Link href={"/training?scenario="+s.id+"&mode=voice"} style={{flex:1,textAlign:'center',padding:'11px 16px',background:'transparent',color:'var(--text-muted)',fontWeight:500,fontSize:13,borderRadius:10,textDecoration:'none',border:'1px solid var(--border)',fontFamily:'DM Sans,sans-serif',transition:'color 0.15s,border-color 0.15s'}}>
                  🎙 Voice Call
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
