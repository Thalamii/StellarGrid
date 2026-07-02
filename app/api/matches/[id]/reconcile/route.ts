import { type NextRequest, NextResponse } from "next/server"
import { reconcileMatch } from "@/lib/match-actions"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Sweeps a single match for stuck states (expired active match never
// submitted, expired stake window never fully funded). Intended to be
// called periodically (e.g. Vercel Cron hitting known in-flight match ids)
// once a contributor wires up scheduling — see the "Reconciliation cron"
// issue for turning this into a full sweep across all in-flight matches.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const result = await reconcileMatch(params.id)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
