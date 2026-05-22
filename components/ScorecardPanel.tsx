'use client';

const CATS = [
  ['discovery','Discovery',20],
  ['rapport','Rapport & Trust',15],
  ['needs_analysis','Needs Analysis',15],
  ['product_positioning','Product Positioning',15],
  ['objection_handling','Objection Handling',15],
  ['compliance_safe_language','Compliance',10],
  ['closing_next_step','Closing / Next Step',10],
];

function Bar({ label, value, max }: any) {
  const v = Number(value) || 0;
  const pct = Math.round((v / max) * 100);
  const cls = pct >= 80 ? 'score-high' : pct >= 55 ? 'score-mid' : 'score-low';
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
      <div style={{width:160,fontSize:12,color:'var(--text-muted)',flexShrink:0,display:'flex',justifyContent:'space-between'}}>
        <span>{label}</span><span style={{fontFamily:'DM Mono,monospace',color:'var(--text-faint)'}}>/{max}</span>
      </div>
      <div className="score-track" style={{flex:1}}>
        <div className={'score-fill ' + cls} style={{width:pct+'%'}} />
      </div>
      <div style={{width:24,textAlign:'right',fontFamily:'DM Mono,monospace',fontSize:13,fontWeight:500,color:'var(--text)'}}>{v}</div>
    </div>
  );
}

export function ScorecardPanel({ scorecard, scenario, onRetry, onNewScenario }: any) {
  if (!scorecard) return <div style={{color:'var(--text-muted)',padding:24}}>No scorecard available.</div>;
  const scores = scorecard.category_scores || {};
  const passed = scorecard.pass_fail === 'pass';
  const score = scorecard.overall_score || 0;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {/* Score hero */}
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:'28px 28px',display:'flex',alignItems:'center',gap:24}}>
        <div style={{textAlign:'center',flexShrink:0}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:56,letterSpacing:'-0.05em',lineHeight:1,color:score>=80?'var(--emerald)':score>=60?'var(--amber)':'var(--red)'}}>{score}</div>
          <div style={{fontSize:11,color:'var(--text-faint)',fontFamily:'DM Mono,monospace',letterSpacing:'0.04em',marginTop:4}}>/100</div>
        </div>
        <div style={{flex:1}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:passed?'var(--emerald-dim)':'var(--red-dim)',border:'1px solid '+(passed?'rgba(16,185,129,0.25)':'rgba(244,63,94,0.25)'),borderRadius:100,padding:'5px 14px',fontSize:12,fontWeight:700,color:passed?'var(--emerald)':'var(--red)',fontFamily:'DM Mono,monospace',letterSpacing:'0.04em',marginBottom:10}}>
            {passed ? '✓ PASS' : '✕ NEEDS WORK'}
          </div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,letterSpacing:'-0.02em',marginBottom:4}}>{scenario?.title}</div>
          <div style={{fontSize:12,color:'var(--text-muted)'}}>{scenario?.borrower?.name}</div>
        </div>
      </div>

      {/* Category scores */}
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:20,padding:'24px 24px'}}>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,letterSpacing:'-0.02em',marginBottom:18,color:'var(--text)'}}>Category Breakdown</div>
        {CATS.map(([key, label, max]) => <Bar key={key} label={label} value={scores[key]} max={max} />)}
      </div>

      {/* Went well / Missed */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'20px'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--emerald)',letterSpacing:'0.04em',marginBottom:12,fontFamily:'DM Mono,monospace'}}>✓ WENT WELL</div>
          {(scorecard.what_went_well||[]).map((item: string, i: number) => <div key={i} style={{fontSize:13,color:'var(--text-muted)',marginBottom:8,paddingLeft:12,borderLeft:'2px solid var(--emerald)',lineHeight:1.5}}>{item}</div>)}
        </div>
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'20px'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--red)',letterSpacing:'0.04em',marginBottom:12,fontFamily:'DM Mono,monospace'}}>✕ MISSED</div>
          {(scorecard.missed_opportunities||[]).map((item: string, i: number) => <div key={i} style={{fontSize:13,color:'var(--text-muted)',marginBottom:8,paddingLeft:12,borderLeft:'2px solid var(--red)',lineHeight:1.5}}>{item}</div>)}
        </div>
      </div>

      {/* Coaching */}
      <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'20px'}}>
        <div style={{fontSize:12,fontWeight:700,color:'var(--accent)',letterSpacing:'0.04em',marginBottom:12,fontFamily:'DM Mono,monospace'}}>COACHING NOTES</div>
        {(scorecard.coaching_notes||[]).map((note: string, i: number) => <div key={i} style={{fontSize:13,color:'var(--text-muted)',marginBottom:8,display:'flex',gap:10}}><span style={{color:'var(--text-faint)',fontFamily:'DM Mono,monospace',flexShrink:0}}>{String(i+1).padStart(2,'0')}</span>{note}</div>)}
      </div>

      {/* Drill */}
      {scorecard.recommended_drill && (
        <div style={{background:'var(--accent-dim)',border:'1px solid var(--border-accent)',borderRadius:16,padding:'20px'}}>
          <div style={{fontSize:12,fontWeight:700,color:'var(--accent)',letterSpacing:'0.04em',marginBottom:8,fontFamily:'DM Mono,monospace'}}>RECOMMENDED DRILL</div>
          <div style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.6}}>{scorecard.recommended_drill}</div>
        </div>
      )}

      {/* Actions */}
      <div style={{display:'flex',gap:12,paddingBottom:32}}>
        {onRetry && <button onClick={onRetry} style={{flex:1,padding:'13px',background:'var(--accent)',color:'#020b14',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,letterSpacing:'-0.02em',border:'none',borderRadius:12,cursor:'pointer'}}>Retry Scenario</button>}
        {onNewScenario && <button onClick={onNewScenario} style={{flex:1,padding:'13px',background:'transparent',color:'var(--text-muted)',fontFamily:'DM Sans,sans-serif',fontWeight:500,fontSize:14,border:'1px solid var(--border)',borderRadius:12,cursor:'pointer'}}>New Scenario</button>}
      </div>
    </div>
  );
}
