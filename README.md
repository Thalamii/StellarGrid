# Stellargrid

[![CI](https://github.com/Thalamii/StellarGrid/actions/workflows/ci.yml/badge.svg)](https://github.com/Thalamii/StellarGrid/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

A Boggle-style word-finding game built with Next.js, Supabase, and Zustand — including a staked 1v1 "winner takes all" multiplayer mode with Soroban escrow on Stellar.

## Features

- **Daily puzzle**: a deterministic, date-seeded 4x4 letter grid shared by all players each day.
- **Staked 1v1 matches**: two players stake equal USDC via a [Trustless Work](https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow) Soroban escrow, play the same randomly-seeded board simultaneously, and the winner takes the full pot.
- **Live scoreboard**: opponent score updates via Supabase Realtime while a staked match is in progress.

## Tech stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Radix UI, Framer Motion, Zustand.
- **Backend**: Supabase (Postgres, Auth, Realtime) via Next.js Server Actions and API routes.
- **Stellar/Soroban**: staked matches integrate [Trustless Work](https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow) for escrow. This is currently mocked (`lib/soroban/mockEscrowClient.ts`) so the match lifecycle can be developed and tested with no Stellar dependency — see [CONTRIBUTING.md](./CONTRIBUTING.md) for the real-integration contributor issue.

## Local development

1. Copy `.env.example` to `.env.local` and fill in your Supabase project's URL, anon key, and (for staked matches) service role key.
2. Run the SQL in `database-setup.sql`, `supabase-word-attempts-table.sql`, and `supabase-staked-matches-table.sql` in your Supabase SQL editor, in that order.
3. Install dependencies and start the dev server:

   ```bash
   pnpm install
   pnpm dev
   ```

4. `NEXT_PUBLIC_ESCROW_MODE=mock` (the default) lets you exercise the full staked-match flow — create, join, stake, play, settle — without any real Stellar transactions.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines, and the repository's GitHub issues for the current contributor backlog (real Trustless Work SDK integration, wallet connect, on-chain leaderboard contract, and more). See also [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).
