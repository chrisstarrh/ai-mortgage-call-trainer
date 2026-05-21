'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TextCallPanel } from '@/components/TextCallPanel';
import { VoiceCallPanel } from '@/components/VoiceCallPanel';

const scenariosData = [
  { id: 'cashout-debt-consolidation', title: 'Cash-Out Refi: Debt Consolidation', summary: 'Homeowner wants to consolidate high-interest debt', difficulty: 'Easy', win_condition: 'Schedule a follow-up call with loan application started', borrower: { name: 'Michelle Torres', age: 42, personality: 'Polite, skeptical, guarded until trust is built', voice_style: 'Measured, asks clarifying questions', home_value: 420000, mortgage_balance: 210000, current_rate: 6.25, desired_cash_out: 50000, credit_score_range: '720-740', motivation: 'Eliminate $1,800/month in credit card and car payments', objections: ['worried about extending loan term', 'not sure if rates are good enough', 'wants to think about it'] } },
  { id: 'heloc-home-improvement', title: 'HELOC: Home Improvement', summary: 'Homeowner considering HELOC for kitchen renovation', difficulty: 'Medium', win_condition: 'Get borrower to agree to a formal HELOC application', borrower: { name: 'James Park', age: 38, personality: 'Analytical, detail-oriented, compares everything', voice_style: 'Direct, numbers-focused', home_value: 550000, mortgage_balance: 280000, current_rate: 5.875, desired_cash_out: 75000, credit_score_range: '750-770', motivation: 'Increase home value before potential sale in 3 years', objections: ['variable rate concerns', 'wants to compare with personal loan', 'worried about qualification'] } },
  { id: 'va-cashout-payment-relief', title: 'VA Cash-Out: Payment Relief', summary: 'Veteran seeking payment reduction through VA cash-out', difficulty: 'Hard', win_condition: 'Complete VA loan application and order COE', borrower: { name: 'Robert Martinez', age: 55, personality: 'Proud, had bad experience with lenders before, tests you', voice_style: 'Blunt, uses military terminology', home_value: 380000, mortgage_balance: 195000, current_rate: 7.0, desired_cash_out: 30000, credit_score_range: '680-700', motivation: 'Lower monthly payment, use equity for medical bills', objections: ['distrust of lenders', 'funding fee concerns', 'worried about appraisal'] } },
];

function TrainingInner() {
  const params = useSearchParams();
  const router = useRouter();
  const scenarioId = params.get('scenario');
  const mode = params.get('mode') || 'text';
  const scenario = scenariosData.find(s => s.id === scenarioId);

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
          ? <VoiceCallPanel scenario={scenario as any} onBack={() => router.push('/')} />
          : <TextCallPanel scenario={scenario as any} onBack={() => router.push('/')} />
        }
      </div>
    </main>
  );
}

export default function TrainingPage() {
  return <Suspense fallback={<div className="min-h-screen bg-page" />}><TrainingInner /></Suspense>;
}
