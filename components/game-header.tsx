"use client"

import { Calendar, User } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { AuthDialog } from "@/components/auth-dialog"
import { GameInstructions } from "@/components/game-instructions"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"
import Image from "next/image"

export function GameHeader() {
  const { user, signOut } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <motion.div
      className="text-center space-y-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex justify-between items-center mb-2">
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        ) : (
          <div /> 
        )}
      </div>

      <motion.div
        className="flex items-center justify-center gap-3"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Image
          src="/Wordgrid.webp"
          alt="WordGrid Logo"
          width={64}
          height={64}
          className="rounded-lg w-12 h-12 sm:w-16 sm:h-16 object-contain"
          priority
        />
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          WordGrid
        </h1>
      </motion.div>

      <motion.div
        className="flex items-center justify-center space-x-2 text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">{today}</span>
      </motion.div>

      <GameInstructions />

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </motion.div>
  )
}
