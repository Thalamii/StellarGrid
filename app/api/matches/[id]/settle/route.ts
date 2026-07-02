import { type NextRequest, NextResponse } from "next/server"
import { settleMatch } from "@/lib/match-actions"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Triggers settlement for a match (winner determination + escrow release).
// Idempotent — see settleMatch's guard against re-settling. Called by
// submitScore's own settlement check today; exists as a standalone route so
// a future reconciliation cron (or a contributor's oracle-key-holding
// process, per the Trustless Work integration issue) can trigger it directly
// without going through the client-facing submitScore flow.
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await settleMatch(params.id)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
