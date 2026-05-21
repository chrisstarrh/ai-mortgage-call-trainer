'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { Scenario, TranscriptLine, Scorecard } from '@/lib/types';
import { ScorecardPanel } from './ScorecardPanel';
const QUICK_STARTERSÚimport { useState, useRef, useEffect, useCallback } from 'react';
import type { Scenario, TranscriptLine, Scorecard } from '@/lib/types';
import { ScorecardPanel } from './ScorecardPanel';

const QUICK_STARTERS = [
  'Hi, is this a good time to chat?',
];

interface Props {
  scenario: Scenario;
  onBack: () => void;
}

export function TextCallPanel({ scenario, onBack }: Props) {
  return <div>Text Call</div>;
}
