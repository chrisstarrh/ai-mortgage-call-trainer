'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import scenarios from '../../../data/scenarios.json';
import { TextCallPanel } from '@/components/TextCallPanel';
import { VoiceCallPanel } from '@/components/VoiceCallPanel';

export default function TrainingPage() {
  const params = useSearchParams();
  const router = useRouter();
  const scenarioId = params.get('scenario');
  const mode = params.get('mode') || 'text';
  const scenario = (scenarios as any[]).find(s => s.id === scenarioId);

  if (!scenario) {
    return (
      <main className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">Scenario not found.</p>
          <button onClick={() => router.push('/')} className="text-accent hover:underline">Back to home</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page">
      <div className="max-w-3xl mx-auto px-6 py-10 h-screen flex flex-col">
        {mode === 'voice'
          ? <VoiceCallPanel scenario={scenario} onBack={() => router.push('/')} />
          : <TextCallPanel scenario={scenario} onBack={() => router.push('/')} />
        }
      </div>
    </main>
  );
}
