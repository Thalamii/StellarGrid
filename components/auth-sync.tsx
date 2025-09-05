"use client"

import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useGameStore } from '@/stores/gameStore'

/**
 * Component to sync auth state with Zustand store
 * This should be placed high in the component tree
 */
export function AuthSync() {
  const { user } = useAuth()
  const setUser = useGameStore((state) => state.setUser)
  
  useEffect(() => {
    setUser(user)
  }, [user, setUser])
  
  return null // This component doesn't render anything
}
