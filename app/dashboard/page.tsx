'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);
  return (
    <main className="min-h-screen bg-page">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-muted hover:text-primary mb-1 block">↰ Home</Link>
        <h1 className="text-2xl font-bold text-primary mb-6">Manager dashboard</h1>
        {loading && <p className="text-muted">Loading...</p>}
        {data?.error && <p className="text-red-400">{data.error}</p>}
        <pre className="text-xs text-muted">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </main>
  );
}
