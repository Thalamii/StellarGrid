import { StakedMatchGame } from "@/components/staked-match-game"

export default function MatchPage({ params }: { params: { matchId: string } }) {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <StakedMatchGame matchId={params.matchId} />
    </main>
  )
}
