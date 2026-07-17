# Security Policy

## Reporting a vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Instead, report it privately via [GitHub Security Advisories](https://github.com/Thalamii/StellarGrid/security/advisories/new) for this repository. Include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce, or a proof of concept if available.
- Any suggested remediation, if you have one.

We'll acknowledge reports as soon as possible and keep you updated as we work on a fix.

## Scope

This project is under active development and integrates real financial value (staked USDC via Soroban escrow — see `lib/soroban/`) once live escrow (`NEXT_PUBLIC_ESCROW_MODE=live`) is enabled. Reports involving the following are especially high priority:

- Anything that could let a player manipulate match scores, stakes, or settlement outcomes (`lib/match-actions.ts`).
- Supabase RLS policy gaps allowing unauthorized reads/writes to `matches`, `match_participants`, or `match_events` (`supabase-staked-matches-table.sql`).
- Escrow client vulnerabilities, once the real Trustless Work integration (`lib/soroban/trustlessWorkEscrowClient.ts`) lands.

Reports about the daily single-player puzzle (no financial value, localStorage-based) are welcome but lower priority.

## Supported versions

Only the `main` branch is supported. There are no maintained release branches at this stage.
