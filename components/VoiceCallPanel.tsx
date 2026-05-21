'use client';
import { useState, useRef, useEffect } from 'react';
import type { Scenario, TranscriptLine, Scorecard } from '@/lib/types';
import { ScorecardPanel } from './ScorecardPanel';

interface Props {
  scenario: Scenario;
  onBack: () => void;
}

export function VoiceCallPanel({ scenario, onBack }: Props) {
  return <div>Voice Call</div>;
}
