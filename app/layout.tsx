import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WordGrid - Daily Word Puzzle Game | Find Words in Letter Grid",
  description:
    "Play WordGrid, the addictive daily word puzzle game! Find words by connecting adjacent letters in a 4x4 grid. New puzzle every day with unlimited rotations.",
  keywords: "word game, puzzle, daily puzzle, word search, boggle, letter grid, brain game, vocabulary, word puzzle game, daily challenge, brain training, vocabulary builder",
  authors: [{ name: "WordGrid Team" }],
  creator: "WordGrid",
  publisher: "WordGrid",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://wordgrid.game"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WordGrid - Daily Word Puzzle Game",
    description: "Find words by connecting letters in a 4x4 grid. New daily puzzles with unlimited rotations!",
    url: "https://wordgrid.game",
    siteName: "WordGrid",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WordGrid - Daily Word Puzzle Game",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WordGrid - Daily Word Puzzle Game",
    description: "Find words by connecting letters in a 4x4 grid. New daily puzzles!",
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
  generator: "v0.dev",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "WordGrid",
              description:
                "Daily word puzzle game where players find words by connecting adjacent letters in a 4x4 grid",
              url: "https://wordgrid.game",
              applicationCategory: "Game",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1250",
              },
            }),
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
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
