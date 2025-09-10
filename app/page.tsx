import { WordGridGame } from "@/components/word-grid-game"
import { GameHeader } from "@/components/game-header"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#dce2e7] dark:bg-[#2d3748]">
      <div className="max-w-md mx-auto">
        <GameHeader />
        <div className="p-4">
          <WordGridGame />
        </div>
      </div>
    </main>
  )
}
