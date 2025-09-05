"use client"

import { HelpCircle, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { AuthDialog } from "@/components/auth-dialog"
import { GameInstructions } from "@/components/game-instructions"
import { DailyStats } from "@/components/daily-stats"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"
import Image from "next/image"

export function GameHeader() {
  const { user, signOut } = useAuth()
  const [showAuthDialog, setShowAuthDialog] = useState(false)


  return (
    <motion.div
      className="text-center space-y-4 pt-6 pb-6 mb-6 px-4 neomorphic-large"
      style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Logo, title and icons row */}
      <div className="flex justify-between items-center mb-2">
        <motion.div
          className="flex items-center gap-3"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Image
            src="/Wordgrid.webp"
            alt="WordGrid Logo"
            width={64}
            height={64}
            className="rounded-lg w-10 h-10 sm:w-12 sm:h-12 object-contain"
            priority
          />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            WordGrid
          </h1>
          
          {/* Control icons next to logo */}
          <motion.div
            className="flex items-center gap-2 ml-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <ThemeToggle />
            
            {/* How to Play Popup */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-2">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>How to Play WordGrid</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <GameInstructions isPopup={true} />
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Stats Popup */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground p-2">
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Your Statistics</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <DailyStats isPopup={true} />
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </motion.div>
        
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

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </motion.div>
  )
}
