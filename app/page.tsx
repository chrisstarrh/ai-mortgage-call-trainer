import Link from 'next/link';
import scenarios from '@/data/scenarios.json';

export default function Home() {
  return <main className="container">
    <h1>AI Mortgage Call Trainer</h1>
    <p className="muted">Practice cash-out refi, HELOC, VA, and debt consolidation calls against realistic AI borrowers.</p>
    <div className="grid">
      {scenarios.map((s) => <div className="card" key={s.id}>
        <h2>{s.title}</h2>
        <p>{s.summary}</p>
        <p className="muted">Difficulty: {s.difficulty} · Goal: {s.win_condition}</p>
        <Link className="btn" href={`/training?scenario=${s.id}`}>Start Roleplay</Link>
      </div>)}
    </div>
  </main>
}
