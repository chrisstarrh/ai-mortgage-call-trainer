import Link from 'next/link';

const SCENARIOS = [
  { id: 'cashout-debt-consolidation', title: 'Cash-Out Refi: Debt Consolidation', summary: 'Homeowner wants to consolidate high-interest debt using home equity.', difficulty: 'Easy', borrower: 'Michelle Torres', personality: 'Polite but skeptical' },
  { id: 'heloc-home-improvement', title: 'HELOC: Home Improvement', summary: 'Homeowner considering a HELOC for a kitchen renovation.', difficulty: 'Medium', borrower: 'James Park', personality: 'Analytical and detail-oriented' },
  { id: 'va-cashout-payment-relief', title: 'VA Cash-Out: Payment Relief', summary: 'Veteran seeking payment reduction through VA cash-out refi.', difficulty: 'Hard', borrower: 'Robert Martinez', personality: 'Proud, tests you' },
];

const COLORS = { Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20', Hard: 'text-red-400 bg-red-500/10 border-red-500/20' };

export default function Home() {
  return (
    <main className="min-h-screen bg-page">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-primary mb-2">AI Mortgage Call Trainer</h1>
          <p className="text-muted">Practice cash-out refi, HELOC, and VA loan calls against realistic AI borrowers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SCENARIOS.map(s => (
            <div key={s.id} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <span className={"text-xs font-medium px-2.5 py-1 rounded-full border " + COLORS[s.difficulty]}>{s.difficulty}</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-primary mb-1">{s.title}</h2>
                <p className="text-sm text-muted leading-relaxed">{s.summary}</p>
              </div>
              <div className="text-xs text-muted border-t border-border/50 pt-3">
                <span className="font-medium text-primary">{s.borrower}</span> · {s.personality}
              </div>
              <div className="flex gap-2 mt-auto">
                <Link href={"/training?scenario=" + s.id + "&mode=text"} className="flex-1 text-center py-2 px-3 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 transition-colors">
                  Text Call
                </Link>
                <Link href={"/training?scenario=" + s.id + "&mode=voice"} className="flex-1 text-center py-2 px-3 bg-surface border border-border text-sm font-medium rounded-xl hover:border-accent/40 hover:text-accent transition-all">
                  Voice Call
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
