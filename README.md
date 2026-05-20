# AI Mortgage Call Trainer MVP

A starter MVP for live AI borrower roleplay calls for mortgage loan officers.

## What this includes
- Next.js app skeleton
- OpenAI Realtime session route for live AI borrower voice roleplay
- Scenario library for cash-out refi / HELOC / VA refinance
- Supabase database schema
- Post-call scoring API
- Borrower prompt and scoring rubric

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local`
3. Add OpenAI and Supabase keys
4. Create Supabase project and run `supabase/schema.sql`
5. `npm run dev`

## Important
This is an MVP scaffold, not production-ready mortgage compliance software. Add company-approved compliance review, audit logging, secure auth, and data retention rules before deploying.
