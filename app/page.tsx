import { WordGridGame } from "@/components/word-grid-game"
import { GameHeader } from "@/components/game-header"

export default function Home() {
  return (
    <main className="min-h-screen p-4 bg-[#d4dde4] dark:bg-[#242424]">
      <div className="max-w-md mx-auto space-y-6">
        <GameHeader />
        <WordGridGame />
      </div>
    </main>
  )
}
