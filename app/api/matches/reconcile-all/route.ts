import { type NextRequest, NextResponse } from "next/server"
import { reconcileAllMatches } from "@/lib/match-actions"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Scheduled sweep endpoint (e.g. Vercel Cron) that reconciles all stuck matches:
// timed-out active matches settle automatically, and expired awaiting_stakes matches refund.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const result = await reconcileAllMatches()
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}
