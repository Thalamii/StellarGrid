"use client"

import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck } from "lucide-react"

interface StakeConfirmationProps {
  stakeAmount: number
  assetCode: string
  myStaked: boolean
  opponentStaked: boolean
  loading: boolean
  onConfirmStake: () => void
}

// Shown while a match is in "awaiting_stakes" — both players must confirm
// their stake (via the active escrow client, mocked in Phase 1) before the
// match starts. Escrow status here reflects lib/soroban/escrowClient.ts,
// not a client-side guess.
export function StakeConfirmation({
  stakeAmount,
  assetCode,
  myStaked,
  opponentStaked,
  loading,
  onConfirmStake,
}: StakeConfirmationProps) {
  return (
    <div className="neomorphic-large p-6 space-y-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <ShieldCheck className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold">Confirm Your Stake</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Winner takes the full pot: {stakeAmount * 2} {assetCode}
      </p>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className={`neomorphic-small p-3 ${myStaked ? "text-green-700" : "text-muted-foreground"}`}>
          You: {myStaked ? "Staked ✓" : "Not staked"}
        </div>
        <div className={`neomorphic-small p-3 ${opponentStaked ? "text-green-700" : "text-muted-foreground"}`}>
          Opponent: {opponentStaked ? "Staked ✓" : "Waiting..."}
        </div>
      </div>

      {!myStaked && (
        <Button onClick={onConfirmStake} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Stake {stakeAmount} {assetCode}
        </Button>
      )}
    </div>
  )
}
