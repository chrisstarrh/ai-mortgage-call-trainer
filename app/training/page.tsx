'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TextCallPanel } from '@/components/TextCallPanel';
import { VoiceCallPanel } from '@/components/VoiceCallPanel';

const SCENARIOS = [
  { id: 'cashout-debt-consolidation', title: 'Cash-Out Refi: Debt Consolidation', summary: 'Homeowner wants to consolidate high-interest debt using home equity.', difficulty: 'Easy' as const, win_condition: 'Schedule follow-up with application started', borrower: { name: 'Michelle Torres', age: 42, personality: 'Polite, skeptical, guarded until trust is built', voice_style: 'Measured', home_value: 420000, mortgage_balance: 210000, current_rate: 6.25, desired_cash_out: 50000, credit_score_range: '720-740', motivation: 'Eliminate high-interest debt', objections: ['worried about extending term', 'not sure rates are good enough'] } },
  { id: 'heloc-home-improvement', title: 'HELOC: Home Improvement', summary: 'Homeowner considering HELOC for kitchen renovation.', difficulty: 'Medium' as const, win_condition: 'Get borrower to agree to HELOC application', borrower: { name: 'James Park', age: 38, personality: 'Analytical, detail-oriented', voice_style: 'Direct', home_value: 550000, mortgage_balance: 280000, current_rate: 5.875, desired_cash_out: 75000, credit_score_range: '750-770', motivation: 'Increase home value', objections: ['variable rate concerns', 'comparing options'] } },
  { id: 'va-cashout-payment-relief', title: 'VA Cash-Out: Payment Relief', summary: 'Veteran seeking payment reduction through VA cash-out.', difficulty: 'Hard' as const, win_condition: 'Complete VA loan application and order COE', borrower: { name: 'Robert Martinez', age: 55, personality: 'Proud, tests you, had bad lender experience', voice_style: 'Blunt', home_value: 380000, mortgage_balance: 195000, current_rate: 7.0, desired_cash_out: 30000, credit_score_range: '680-700', motivation: 'Lower payment, cover medical bills', objections: ['distrust of lenders', 'funding fee concerns'] } },
];

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('scenario');
  const mode = params.get('mode') || 'text';
  const scenario = SCENARIOS.find(s => s.id === id);
  if (!scenario) return <main className="min-h-screen bg-page flex items-center justify-center"><button onClick={() => router.push('/')} className="text-accent">Back to home</button></main>;
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

export default function TrainingPage() {
  return <Suspense fallback={<div className="min-h-screen bg-page" />}><Inner /></Suspense>;
}
