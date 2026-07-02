# Contributing to Stellargrid

Thanks for considering a contribution! This project is listed on [GrantFox](https://grantfox.xyz/) — issues labeled `good first issue` or `help wanted` are open for paid contribution through GrantFox's OSS Contributions track.

## Local setup

1. `pnpm install`
2. Copy `.env.example` to `.env.local` and fill in your own Supabase project's `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (the service role key is only needed for the staked-match server actions in `lib/match-actions.ts`).
3. Run the SQL files in your Supabase SQL editor in this order: `database-setup.sql`, `supabase-word-attempts-table.sql`, `supabase-staked-matches-table.sql`.
4. `pnpm dev`

## Working on the staked multiplayer feature without a Stellar account

Leave `NEXT_PUBLIC_ESCROW_MODE=mock` (the default) in `.env.local`. `lib/soroban/mockEscrowClient.ts` simulates instant, no-op staking and settlement purely against Supabase, so you can build and test the entire match lifecycle — create, join, stake, play, settle — without ever touching the real Stellar network. See `lib/soroban/escrowClient.ts` for the interface every escrow call goes through.

Only set `NEXT_PUBLIC_ESCROW_MODE=live` once `lib/soroban/trustlessWorkEscrowClient.ts` exists (see the "Integrate Trustless Work SDK" issue).

## Project structure pointers

- `stores/gameStore.ts` — the daily single-player puzzle. Do not modify this for staked-match work; it's a separate, parallel store (`stores/matchStore.ts`).
- `lib/boardGenerator.ts` — shared Boggle board generator, used by both the daily route (date-seeded) and staked matches (randomly seeded per match).
- `lib/match-actions.ts` — server actions for the match lifecycle.
- `supabase-staked-matches-table.sql` — schema + RLS policies for staked matches. Money-adjacent columns are never writable directly by clients — see the policy comments before adding new client-facing fields.

## Branch & PR conventions

- Branch names should describe the change (e.g. `feature/trustless-work-integration`, `fix/match-timer-race`) — not tied to any particular tool or assistant.
- Run `pnpm lint` and `pnpm build` before opening a PR; CI runs both automatically.
- Fill out the PR template — link the issue you're closing, and describe how you tested the change (mock mode is fine for anything not touching real Stellar calls).

## Code of conduct

Be respectful and constructive in issues, PRs, and reviews. This is a community project — assume good faith, and raise concerns directly rather than escalating.
