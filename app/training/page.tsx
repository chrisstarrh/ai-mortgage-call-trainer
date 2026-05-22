'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TextCallPanel } from '@/components/TextCallPanel';
import { VoiceCallPanel } from '@/components/VoiceCallPanel';

const SCENARIOS = [
  {
    id: 'cashout-debt-consolidation',
    title: 'Cash-Out Refi: Discovery Call',
    summary: 'Homeowner open to refinancing. Gather their full application details and book a second call.',
    difficulty: 'Easy',
    win_condition: 'Get full application details (income, employment, property value, desired cash-out, credit score range) and book a specific date/time for a second call to review the numbers.',
    borrower: {
      name: 'Michelle Torres',
      age: 42,
      personality: 'Polite and open, but mildly skeptical. Warms up quickly when treated with respect.',
      voice_style: 'Measured, conversational, asks clarifying questions',
      home_value: 420000,
      mortgage_balance: 210000,
      current_rate: 6.25,
      desired_cash_out: 50000,
      credit_score_range: '720-740',
      motivation: 'Wants to consolidate $35k in credit card and car debt into one lower payment.',
      objections: ['Is this the right time with rates?', 'Will my payment go up?', 'I need to think about it'],
    },
  },
  {
    id: 'second-call-pitch',
    title: 'Second Call: Present the Numbers',
    summary: 'You have run the numbers. Now present the benefits clearly and get Michelle to commit to moving forward.',
    difficulty: 'Medium',
    win_condition: 'Clearly explain the monthly savings, total benefit, and loan terms. Handle any remaining objections and get Michelle to verbally commit to moving forward — either signing the application or scheduling the next concrete step.',
    borrower: {
      name: 'Michelle Torres',
      age: 42,
      personality: 'Warmer than the first call since she already met you. She has reviewed the rough numbers but still has a few questions. She responds well to clear, simple explanations without jargon.',
      voice_style: 'Friendly but focused. She wants clarity, not a sales pitch.',
      home_value: 420000,
      mortgage_balance: 210000,
      current_rate: 6.25,
      desired_cash_out: 50000,
      credit_score_range: '720-740',
      motivation: 'Save money monthly and simplify her finances. She is close to deciding yes but needs to feel confident.',
      objections: ['What exactly are the closing costs?', 'How long until I break even?', 'What happens if rates drop more?', 'I want to make sure this is really worth it'],
    },
  },
  {
    id: 'heloc-home-improvement',
    title: 'HELOC: Home Improvement',
    summary: 'Homeowner considering a HELOC for a kitchen renovation.',
    difficulty: 'Medium',
    win_condition: 'Get borrower to agree to a formal HELOC application.',
    borrower: {
      name: 'James Park',
      age: 38,
      personality: 'Analytical, detail-oriented, compares everything',
      voice_style: 'Direct, numbers-focused',
      home_value: 550000,
      mortgage_balance: 280000,
      current_rate: 5.875,
      desired_cash_out: 75000,
      credit_score_range: '750-770',
      motivation: 'Increase home value before potential sale in 3 years.',
      objections: ['Variable rate concerns', 'Wants to compare with personal loan', 'Worried about qualification'],
    },
  },
  {
    id: 'va-cashout-payment-relief',
    title: 'VA Cash-Out: Payment Relief',
    summary: 'Veteran seeking payment reduction through VA cash-out refi.',
    difficulty: 'Hard',
    win_condition: 'Complete VA loan application and order Certificate of Eligibility.',
    borrower: {
      name: 'Robert Martinez',
      age: 55,
      personality: 'Proud, had bad experience with lenders before, tests you',
      voice_style: 'Blunt, direct',
      home_value: 380000,
      mortgage_balance: 195000,
      current_rate: 7.0,
      desired_cash_out: 30000,
      credit_score_range: '680-700',
      motivation: 'Lower monthly payment and use equity for medical bills.',
      objections: ['Distrust of lenders', 'Funding fee concerns', 'Worried about appraisal'],
    },
  },
];

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('scenario');
  const mode = params.get('mode') || 'text';
  const scenario = SCENARIOS.find(s => s.id === id);

  if (!scenario) return (
    <main className="min-h-screen bg-page flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted mb-4">Scenario not found.</p>
        <button onClick={() => router.push('/')} className="text-accent hover:underline">Back to home</button>
      </div>
    </main>
  );

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
