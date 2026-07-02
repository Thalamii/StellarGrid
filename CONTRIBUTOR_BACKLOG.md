# Contributor backlog

GitHub Issues are currently disabled on this repository, so the six Phase 2+
items from the staked-multiplayer plan are recorded here instead. Once Issues
are enabled (Settings → General → Features → Issues), these should be filed
as individual issues (with `good first issue` / `help wanted` labels as noted)
so they're visible to GrantFox contributors.

---

## 1. Integrate Trustless Work SDK for real testnet escrow

`help wanted`, `stellar/soroban`

Staked 1v1 matches (`lib/match-actions.ts`, `stores/matchStore.ts`) currently run against `lib/soroban/mockEscrowClient.ts` — an in-memory, no-op implementation of the `EscrowClient` interface (`lib/soroban/escrowClient.ts`) that lets the full match lifecycle and UI be built/tested without any Stellar dependency.

Replace the mock with a real integration of [Trustless Work](https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow) — an existing open-source Soroban escrow contract supporting USDC, already used by GrantFox itself for contributor payouts. We're dogfooding it here rather than writing a custom escrow contract.

**What to build:**
- New file `lib/soroban/trustlessWorkEscrowClient.ts` implementing the same `EscrowClient` interface (`createMatch`, `buildDepositTx`, `submitSignedTx`, `settle`, `refundTimeout`, `getMatchState`).
- Wire it into `getEscrowClient()` in `lib/soroban/escrowClient.ts` behind `NEXT_PUBLIC_ESCROW_MODE=live` (currently throws if set, since no live implementation exists yet).
- Confirm against current Trustless Work SDK docs how a 1v1 winner-takes-all maps onto their milestone/release model.
- Decide the settlement authorization model (backend-triggered release vs. co-signing).

**Acceptance criteria:**
- [ ] `trustlessWorkEscrowClient.ts` implements every method of `EscrowClient` against the real Trustless Work testnet SDK
- [ ] `NEXT_PUBLIC_ESCROW_MODE=live` works end-to-end: create → join → both stake (real testnet USDC) → play → settle (real payout)
- [ ] No changes needed to any call site outside `lib/soroban/`
- [ ] README/CONTRIBUTING updated with testnet setup steps

Relevant files: `lib/soroban/escrowClient.ts`, `lib/soroban/mockEscrowClient.ts`, `lib/match-actions.ts`, `supabase-staked-matches-table.sql` (`matches.escrow_id`).

---

## 2. Wallet connect via Stellar Wallets Kit + signature-based wallet linking

`help wanted`, `stellar/soroban`

Staked matches need a player's Stellar wallet address to actually stake/receive payouts. Today there's no wallet connection anywhere in the app — `hooks/use-auth.tsx` only handles Supabase email/password auth (identity), which is separate from wallet connection (payment capability).

**What to build:**
- Add `@creit.tech/stellar-wallets-kit` dependency.
- New file `hooks/use-wallet.tsx` (sibling to `hooks/use-auth.tsx`, not merged): `connect()`, `signAndSubmit(xdr)`, persisted last-connected wallet for auto-reconnect (mirror the localStorage pattern in `lib/anonymous-session.ts`).
- New `wallet_links` table (`user_id` PK → `auth.users`, `stellar_address` unique, `verified_at`).
- New server action `linkWallet(userId, address)`: nonce challenge, signature verification (`@stellar/stellar-sdk`'s `Keypair.verify`), then upsert `wallet_links`.
- New `components/wallet-connect-button.tsx`, surfaced in `components/game-header.tsx` alongside `components/match-lobby-dialog.tsx`.
- Gate staked match creation/join on having a verified `wallet_links` row.

**Acceptance criteria:**
- [ ] User can connect a Stellar wallet (Freighter at minimum) via the kit
- [ ] Wallet address is cryptographically verified before being linked
- [ ] `match-lobby-dialog.tsx` blocks staked-match creation/join until a wallet is linked
- [ ] Reconnect works across page reloads

Relevant files: `hooks/use-auth.tsx` (pattern reference), `components/game-header.tsx`, `components/match-lobby-dialog.tsx`, `supabase-staked-matches-table.sql`.

---

## 3. On-chain leaderboard/reputation Soroban contract

`help wanted`, `stellar/soroban`, `rust`

Match results currently live only in Supabase. Add a bespoke Soroban contract recording match results keyed by wallet address — a lightweight, self-contained example of on-chain game state. Unlike escrow (dogfooding Trustless Work), this is genuinely new Rust.

**What to build:**
- New Soroban contract (suggest `contracts/leaderboard/`, standard `soroban-sdk` layout):
  - State: `Map<Address, PlayerStats>` where `PlayerStats { wins: u32, losses: u32, total_staked: i128, last_match_id: BytesN<32> }`.
  - `record_result(match_id, winner, loser, score_winner, score_loser)` — called by the same backend authority that triggers escrow settlement.
  - `get_stats(address) -> PlayerStats` — public read.
- Deploy to Stellar testnet.
- Wire `record_result` into `settleMatch()` in `lib/match-actions.ts`, right after the escrow `settle()` call succeeds.
- New leaderboard page/component reading `get_stats` (can be a smaller follow-up PR).

**Acceptance criteria:**
- [ ] Contract compiles, has tests, deploys to testnet
- [ ] `record_result` called automatically at the end of `settleMatch()`
- [ ] `get_stats` queryable from the frontend
- [ ] Basic leaderboard UI shows top players by wins

Relevant files: `lib/match-actions.ts` (`settleMatch`), `app/api/matches/[id]/settle/route.ts`.

---

## 4. Realtime sync polish for staked matches

`good first issue`

`stores/matchStore.ts` has basic Realtime wiring (`subscribeToMatch`, `score_update` broadcasts), but status transitions (opponent joined, both staked, match started, match ended) are currently polled every 3 seconds from `components/staked-match-game.tsx` rather than pushed via Realtime.

**What to build:**
- Presence tracking per match channel (`match:{matchId}`) so `connection_status` reflects live connect/disconnect.
- Dedicated broadcast events for each status transition (`opponent_joined`, `stake_confirmed`, `match_started` with server `startedAt`/`endsAt`, `match_ended`), fired from `lib/match-actions.ts`.
- Replace the `setInterval(() => loadMatch(...), 3000)` polling loop in `components/staked-match-game.tsx` with listeners for these events.
- Handle disconnect/reconnect gracefully (last-synced score isn't lost if a player never reconnects to submit).

**Acceptance criteria:**
- [ ] No more polling loop — all status transitions arrive via Realtime broadcast
- [ ] Both players' match timers start from the same server-provided timestamp
- [ ] Presence accurately reflects connect/disconnect within a few seconds

Relevant files: `stores/matchStore.ts` (`subscribeToMatch`), `components/staked-match-game.tsx`, `lib/match-actions.ts`.

---

## 5. Anti-cheat hardening: server-side word re-validation before settlement

`good first issue`

`submitScore` in `lib/match-actions.ts` currently trusts the client-submitted `score`/`foundWords` as-is (same trust level as the existing daily game). Now that real money is at stake, submitted scores should be re-validated server-side before determining a winner and triggering payout.

**What to build:**
- In `submitScore`, re-solve/validate each submitted word against `matches.board_snapshot` (reuse the Trie/path logic in `lib/boardGenerator.ts`) rather than trusting the client's word list, and recompute the score server-side.
- Extend `word_attempts` (`supabase-word-attempts-table.sql`) with a nullable `match_id` column; log staked-match word attempts into the same table.
- Basic rate-limit heuristics flagging impossible solve speeds.

**Acceptance criteria:**
- [ ] Submitted score is recomputed server-side from validated words, not trusted from the client
- [ ] Invalid/impossible words are rejected or flagged
- [ ] `word_attempts` logs staked-match attempts with `match_id` populated
- [ ] Existing daily single-player flow is unaffected

Relevant files: `lib/match-actions.ts` (`submitScore`), `lib/boardGenerator.ts`, `supabase-word-attempts-table.sql`.

---

## 6. Reconciliation cron for stuck matches

`good first issue`

`lib/match-actions.ts` already has `reconcileMatch(matchId)` and a corresponding `GET /api/matches/[id]/reconcile` route that sweep a *single* match for stuck states, but nothing calls this on a schedule.

**What to build:**
- A scheduled sweep (Vercel Cron fits, given this is Vercel-deployed) querying all `active` matches with `ends_at` in the past and all `awaiting_stakes` matches with `stake_deadline_at` in the past, calling `reconcileMatch` (or a new bulk variant) for each.
- Consider a new `app/api/matches/reconcile-all/route.ts` (no `[id]`) for the cron to hit, separate from the existing per-match route.
- Document the cron schedule choice.

**Acceptance criteria:**
- [ ] A scheduled job sweeps all stuck matches, not just one at a time
- [ ] Timed-out active matches settle automatically even if both clients disconnect
- [ ] Matches stuck in `awaiting_stakes` past deadline refund automatically
- [ ] Existing per-match route is untouched

Relevant files: `lib/match-actions.ts` (`reconcileMatch`, `settleMatch`), `app/api/matches/[id]/reconcile/route.ts`.
