"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Coins, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useMatchStore } from "@/stores/matchStore"

const DEFAULT_STAKE = 5

// Entry point for staked play: create a new match (stake amount picker),
// browse the open lobby, or join a specific match by id. This is the
// "Stake & Play" trigger surfaced from components/game-header.tsx.
export function MatchLobbyDialog() {
  const { user } = useAuth()
  const router = useRouter()
  const { openMatches, refreshOpenMatches, createNewMatch, joinExistingMatch, loading, error } = useMatchStore()

  const [open, setOpen] = useState(false)
  const [stakeAmount, setStakeAmount] = useState(DEFAULT_STAKE)
  const [joinMatchId, setJoinMatchId] = useState("")

  useEffect(() => {
    if (open) {
      refreshOpenMatches()
    }
  }, [open, refreshOpenMatches])

  if (!user) {
    return null
  }

  const handleCreate = async () => {
    const matchId = await createNewMatch(user.id, stakeAmount)
    if (matchId) {
      setOpen(false)
      router.push(`/match/${matchId}`)
    }
  }

  const handleJoin = async (matchId: string) => {
    const joined = await joinExistingMatch(matchId, user.id)
    if (joined) {
      setOpen(false)
      router.push(`/match/${matchId}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="neomorphic-small border-0 text-purple-700 dark:text-purple-300">
          <Coins className="w-4 h-4 mr-1" />
          Stake &amp; Play
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Staked 1v1 — Winner Takes All</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="create">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="create">Create Match</TabsTrigger>
            <TabsTrigger value="join">Join Match</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            <label className="text-sm font-medium">Stake amount (USDC)</label>
            <Input
              type="number"
              min={1}
              value={stakeAmount}
              onChange={(e) => setStakeAmount(Number(e.target.value))}
            />
            <Button onClick={handleCreate} disabled={loading || stakeAmount <= 0} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Match
            </Button>

            {openMatches.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-sm text-muted-foreground">Open matches:</p>
                {openMatches.map((m) => (
                  <div key={m.id} className="flex items-center justify-between neomorphic-small p-2">
                    <span className="text-sm">
                      {m.stake_amount} {m.asset_code}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => handleJoin(m.id)} disabled={loading}>
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="join" className="space-y-4 mt-4">
            <label className="text-sm font-medium">Match ID</label>
            <Input value={joinMatchId} onChange={(e) => setJoinMatchId(e.target.value)} placeholder="Paste match ID" />
            <Button onClick={() => handleJoin(joinMatchId)} disabled={loading || !joinMatchId} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Join Match
            </Button>
          </TabsContent>
        </Tabs>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
