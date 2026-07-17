"use client"

import { Trophy, Frown, Handshake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface MatchResultsProps {
  didWin: boolean | null // null = tie
  myScore: number
  opponentScore: number
  stakeAmount: number
  assetCode: string
  payoutTxHash: string | null
  onPlayAgain: () => void
}

export function MatchResults({
  didWin,
  myScore,
  opponentScore,
  stakeAmount,
  assetCode,
  payoutTxHash,
  onPlayAgain,
}: MatchResultsProps) {
  return (
    <motion.div
      className="neomorphic-large p-8 text-center space-y-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {didWin === null ? (
        <>
          <Handshake className="w-12 h-12 mx-auto text-blue-600" />
          <h2 className="text-2xl font-bold">It&apos;s a tie!</h2>
          <p className="text-muted-foreground">Both stakes have been refunded.</p>
        </>
      ) : didWin ? (
        <>
          <Trophy className="w-12 h-12 mx-auto text-yellow-500" />
          <h2 className="text-2xl font-bold text-green-700">You won!</h2>
          <p className="text-muted-foreground">
            {myScore} vs {opponentScore} — pot of {stakeAmount * 2} {assetCode} released to you.
          </p>
        </>
      ) : (
        <>
          <Frown className="w-12 h-12 mx-auto text-gray-500" />
          <h2 className="text-2xl font-bold text-gray-700">You lost</h2>
          <p className="text-muted-foreground">
            {myScore} vs {opponentScore} — better luck next round.
          </p>
        </>
      )}

      {payoutTxHash && (
        <p className="text-xs text-muted-foreground break-all">Payout reference: {payoutTxHash}</p>
      )}

      <Button onClick={onPlayAgain} className="w-full">
        Back to Lobby
      </Button>
    </motion.div>
  )
}
