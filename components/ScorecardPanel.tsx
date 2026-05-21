'use client';

const CATEGORIES = [
  ['discovery','Discovery',20],
  ['rapport','Rapport & Trust',15],
  ['needs_analysis','Needs Analysis',15],
  ['product_positioning','Product Positioning',15],
  ['objection_handling','Objection Handling',15],
  ['compliance_safe_language','Compliance Language',10],
  ['closing_next_step','Closing / Next Step',10],
];

function ScoreBar({ label, value, max }) {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted w-44 flex-shrink-0">{label} <span className="text-muted/60">/{max}</span></span>
      <div className="flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
        <div className={"h-full rounded-full " + color} style={{width: pct + '%'}} />
      </div>
      <span className="text-sm font-mono font-medium w-6 text-right">{value}</span>
    </div>
  );
}

export function ScorecardPanel({ scorecard, scenario, onRetry, onNewScenario }) {
  const passed = scorecard.pass_fail === 'pass';
  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-6">
        <div>
          <div className="text-5xl font-bold font-mono leading-none text-primary">{scorecard.overall_score}</div>
          <div className="text-sm text-muted mt-1">out of 100</div>
        </div>
        <div>
          <div className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-2 " + (passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
            {passed ? 'Pass' : 'Needs Work'}
          </div>
          <div className="text-sm text-muted">{scenario.title}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-primary mb-4">Category Breakdown</h3>
        {CATEGORIES.map(([key, label, max]) => (
          <ScoreBar key={key} label={label} value={scorecard.category_scores[key]} max={max} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-emerald-400 mb-2">Went Well</h3>
          <ul className="space-y-1.5">{scorecard.what_went_well.map((item, i) => <li key={i} className="text-xs text-muted leading-relaxed">• {item}</li>)}</ul>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-red-400 mb-2">Missed</h3>
          <ul className="space-y-1.5">{scorecard.missed_opportunities.map((item, i) => <li key={i} className="text-xs text-muted leading-relaxed">• {item}</li>)}</ul>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-primary mb-2">Coaching Notes</h3>
        <ul className="space-y-1.5">{scorecard.coaching_notes.map((note, i) => <li key={i} className="text-xs text-muted leading-relaxed">{i+1}. {note}</li>)}</ul>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-accent mb-1">Recommended Drill</h3>
        <p className="text-xs text-muted">{scorecard.recommended_drill}</p>
      </div>

      <div className="flex gap-3">
        {onRetry && <button onClick={onRetry} className="flex-1 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 transition-colors">Retry this scenario</button>}
        {onNewScenario && <button onClick={onNewScenario} className="flex-1 py-2.5 bg-surface border border-border text-sm font-medium rounded-xl hover:border-accent/40 transition-all">Choose new scenario</button>}
      </div>
    </div>
  );
}
