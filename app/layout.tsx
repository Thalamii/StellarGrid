import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WordGrid - Daily Square Word Search Game",
  description:
    "WordGrid is a Boggle-like word connect game. Glide or tap to connect letters and create words. Fresh words board daily.",
  keywords: "Squardle, daily squardle, daily boggle, 4x4 boggle game, boogle word game, word search game, square words game, word squares, word squares game, square words, word grid game, boggle game, word connect, letter grid, daily puzzle, word game, puzzle, word search, brain game, vocabulary, word puzzle game, daily challenge, brain training, vocabulary builder, vocabulary game",
  authors: [{ name: "WordGrid Team" }],
  creator: "WordGrid",
  publisher: "WordGrid",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://wordgrid.fun"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WordGrid - Daily Square Word Search Game",
    description: "WordGrid is a Boggle-like word connect game. Glide or tap to connect letters and create words. Fresh words board daily.",
    url: "https://wordgrid.fun",
    siteName: "WordGrid",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WordGrid - Daily Square Word Search Game",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WordGrid - Daily Square Word Search Game",
    description: "WordGrid is a Boggle-like word connect game. Glide or tap to connect letters and create words. Fresh words board daily.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  generator: "WordGrid",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/Wordgrid.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/Wordgrid.webp" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="application-name" content="WordGrid" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WordGrid" />
        
        {/* Game-specific meta tags */}
        <meta name="game-type" content="word-puzzle" />
        <meta name="game-genre" content="puzzle,word search,brain-training" />
        <meta name="game-platform" content="web" />
        <meta name="content-language" content="en" />
        
        {/* Additional keyword targeting */}
        <meta name="subject" content="Daily Square Word Search Game - Squardle Alternative" />
        <meta name="abstract" content="Play WordGrid, the best alternative to Squardle and daily boggle games. Connect letters in a 4x4 grid to find words." />
        <meta name="topic" content="word games, puzzle games, daily games" />
        <meta name="summary" content="WordGrid: Daily word puzzle game similar to Squardle and Boggle" />
        <meta name="classification" content="Games" />
        <meta name="category" content="Word Games" />
        <meta name="coverage" content="Worldwide" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="General" />
                <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "WordGrid - Daily Square Word Search Game",
                alternateName: ["WordGrid", "Square Word Search Game", "Daily Squardle"],
                description:
                  "WordGrid is a Boggle-like word connect game. Glide or tap to connect letters and create words. Fresh words board daily. Similar to Squardle and daily boggle games.",
                url: "https://wordgrid.fun",
                applicationCategory: "GameApplication",
                genre: ["Word Game", "Word Search", "Puzzle Game", "Brain Game"],
                operatingSystem: "Web Browser",
                browserRequirements: "Requires JavaScript. Compatible with all modern browsers.",
                softwareVersion: "1.0",
                datePublished: "2024-01-01",
                dateModified: new Date().toISOString().split('T')[0],
                publisher: {
                  "@type": "Organization",
                  name: "WordGrid",
                  url: "https://wordgrid.fun"
                },
                creator: {
                  "@type": "Organization",
                  name: "WordGrid Team"
                },
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                  category: "Free Game"
                },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.8",
                  ratingCount: "1250",
                  bestRating: "5",
                  worstRating: "1"
                },
                featureList: [
                  "Daily word search puzzles",
                  "4x4 letter grid",
                  "Unlimited board rotations",
                  "Drag and connect gameplay",
                  "Progress tracking",
                  "Mobile and desktop compatible"
                ],
                screenshot: "https://wordgrid.fun/og-image.png",
                gamePlatform: "Web Browser",
                playMode: "SinglePlayer",
                keywords: "Squardle, daily squardle, daily boggle, 4x4 boggle game, square words game, word squares, word grid game, boggle game, word connect"
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "What is WordGrid?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "WordGrid is a captivating daily word search game that follows the Boggle and Squardle format. Connect letters in a 4x4 grid to discover hidden words, with a new puzzle delivered every day."
                    }
                  },
                  {
                    "@type": "Question",
                    name: "How do I play WordGrid?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Drag or tap to connect adjacent letters in the 4x4 grid to form words. Words must be at least 4 letters long. You can rotate the board for different perspectives and find up to 50 target words daily."
                    }
                  },
                  {
                    "@type": "Question",
                    name: "Is WordGrid free to play?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes, WordGrid is completely free to play. No downloads, registrations, or payments required. Just visit the website and start playing immediately."
                    }
                  },
                  {
                    "@type": "Question",
                    name: "Is WordGrid similar to Squardle?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes, WordGrid offers a similar experience to Squardle and other daily word games. Like Squardle, it features a 4x4 grid where you connect letters to form words, with a new puzzle each day."
                    }
                  },
                  {
                    "@type": "Question",
                    name: "How many words can I find in each puzzle?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Each daily WordGrid puzzle contains at least 50 target words to discover. You may find bonus words beyond the target count for extra points."
                    }
                  },
                  {
                    "@type": "Question",
                    name: "Can I play on mobile devices?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes, WordGrid is fully optimized for mobile devices with touch-friendly drag and tap controls. It works seamlessly on smartphones, tablets, and desktop computers."
                    }
                  }
                ]
              }
            ]),
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        <ServiceWorkerRegistration />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <main className="min-h-screen bg-background">{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
