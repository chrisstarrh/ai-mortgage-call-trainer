'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HistoryPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/calls').then(r => r.json()).then(d => { if(Array.isArray(d))setCalls(d); }).finally(() => setLoading(false));
  }, []);
  return (
    <main className="min-h-screen bg-page">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-muted hover:text-primary mb-1 block">↰ Home</Link>
        <h1 className="text-2xl font-bold text-primary mb-6">Call history</h1>
        {loading && <p className="text-muted">Loading...</p>}
        {calls.length === 0 && !loading && <p className="text-muted">No calls yet.</p>}
        {calls.map(c => <div key={c.id} className="bg-surface border border-border rounded-xl p-4 mb-2"><p>{c.scenario_id}</p></div> !)}
      </div>
    </main>
  );
}
