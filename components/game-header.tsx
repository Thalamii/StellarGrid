"use client"

import dynamic from "next/dynamic"
import { HelpCircle, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"
import Image from "next/image"

// Lazy load popup components (not needed for initial render)
const AuthDialog = dynamic(() => import("@/components/auth-dialog").then(mod => ({ default: mod.AuthDialog })))
const GameInstructions = dynamic(() => import("@/components/game-instructions").then(mod => ({ default: mod.GameInstructions })))
const DailyStats = dynamic(() => import("@/components/daily-stats").then(mod => ({ default: mod.DailyStats })))
const SettingsPopup = dynamic(() => import("@/components/settings-popup").then(mod => ({ default: mod.SettingsPopup })))

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
            src="/Wordgridsm.webp"
            alt="WordGrid Logo"
            width={40}
            height={40}
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
            <SettingsPopup />
            
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
