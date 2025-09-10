import dynamic from "next/dynamic"
import { WordGridGame } from "@/components/word-grid-game"
import { GameHeader } from "@/components/game-header"

// Lazy load SEO content (non-critical)
const SEOAccordion = dynamic(() => import("@/components/seo-accordion").then(mod => ({ default: mod.SEOAccordion })), {
  loading: () => <div className="h-32 animate-pulse bg-gray-100 rounded-lg" />
})

export default function Home() {
  return (
    <main className="min-h-screen bg-[#d4dde4] dark:bg-[#2d3748]">
      <div className="max-w-md mx-auto">
        <GameHeader />
        <div className="p-4">
          <WordGridGame />
        </div>
        {/* Lazy-loaded SEO content */}
        <div className="mt-8 p-4">
          <SEOAccordion />
        </div>
      </div>
    </main>
  )
}
