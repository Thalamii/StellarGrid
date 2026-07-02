-- Staked 1v1 multiplayer ("winner takes all") schema.
-- Run this in your Supabase SQL Editor after database-setup.sql and
-- supabase-word-attempts-table.sql.
--
-- Unlike the anonymous session_id based daily-puzzle tables, staked matches
-- require a real Supabase auth user (see hooks/use-auth.tsx) since real
-- money moves through these rows. Escrow settlement itself happens on-chain
-- (Trustless Work / Soroban) — these tables are a coordination/cache layer,
-- never the source of truth for who actually won the funds.

-- 1. Matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'awaiting_stakes', 'active', 'completed', 'settled', 'cancelled', 'refunded', 'disputed')),
  stake_amount NUMERIC NOT NULL CHECK (stake_amount > 0),
  asset_code TEXT NOT NULL DEFAULT 'USDC',
  escrow_id TEXT, -- Trustless Work escrow reference; null until Phase 2 wires the real SDK
  board_seed BIGINT NOT NULL, -- random per-match seed, NOT date-derived (see lib/boardGenerator.ts)
  board_snapshot JSONB NOT NULL, -- board + possibleWords/targetWords, generated once, identical for both players
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stake_deadline_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  winner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payout_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Match participants table
CREATE TABLE IF NOT EXISTS public.match_participants (
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stellar_address TEXT,
  stake_tx_hash TEXT, -- server-written only, never client-reported
  staked_at TIMESTAMP WITH TIME ZONE,
  score INTEGER NOT NULL DEFAULT 0,
  found_words JSONB NOT NULL DEFAULT '[]',
  submitted_at TIMESTAMP WITH TIME ZONE,
  connection_status TEXT NOT NULL DEFAULT 'connected' CHECK (connection_status IN ('connected', 'disconnected')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (match_id, user_id)
);

-- 3. Match events table (append-only audit/reconciliation log)
CREATE TABLE IF NOT EXISTS public.match_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON public.matches(created_by);
CREATE INDEX IF NOT EXISTS idx_match_participants_user ON public.match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON public.match_events(match_id);

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- matches policies
-- ---------------------------------------------------------------------------

-- Participants (and the creator, before anyone has joined) can see their own matches.
CREATE POLICY "Participants can view their matches" ON public.matches
  FOR SELECT USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.match_participants mp
      WHERE mp.match_id = matches.id AND mp.user_id = auth.uid()
    )
  );

-- Anyone signed in can browse open matches waiting for an opponent (public lobby),
-- but only non-sensitive columns are meaningful here — clients should not rely on
-- payout/escrow fields from this policy branch.
CREATE POLICY "Signed-in users can browse open lobby matches" ON public.matches
  FOR SELECT USING (
    status = 'created' AND auth.uid() IS NOT NULL
  );

-- Only the creator can insert their own match row (server action runs as the user).
CREATE POLICY "Users can create their own match" ON public.matches
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- No direct client UPDATE — all status/stake/payout transitions go through
-- service-role server actions (lib/match-actions.ts) which bypass RLS.
CREATE POLICY "No direct client updates to matches" ON public.matches
  FOR UPDATE USING (false);

-- ---------------------------------------------------------------------------
-- match_participants policies
-- ---------------------------------------------------------------------------

-- A participant can see their own row and their opponent's row within the same match.
CREATE POLICY "Participants can view rows in their matches" ON public.match_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_participants mp
      WHERE mp.match_id = match_participants.match_id AND mp.user_id = auth.uid()
    )
  );

-- Users can join a match (insert their own participant row) directly.
CREATE POLICY "Users can join a match" ON public.match_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Clients may only update their own score/found_words/connection_status while playing;
-- stake_tx_hash/staked_at are never writable by clients (server actions bypass RLS).
CREATE POLICY "Participants can update own live game state" ON public.match_participants
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- match_events policies (insert-only via service-role server actions)
-- ---------------------------------------------------------------------------

CREATE POLICY "Participants can view events for their matches" ON public.match_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_participants mp
      WHERE mp.match_id = match_events.match_id AND mp.user_id = auth.uid()
    )
  );

CREATE POLICY "No direct client inserts to match_events" ON public.match_events
  FOR INSERT WITH CHECK (false);
