"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/layout/navbar"
import { GoalList } from "@/components/goals/goal-list"
import { GoalStats } from "@/components/goals/goal-stats"
import { DailyPromptModal } from "@/components/prompts/daily-prompt-modal"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { useDailyPrompt } from "@/hooks/use-daily-prompt"
import { getUserGoals } from "@/lib/firestore"
import type { Goal } from "@/types"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const { showPrompt, setShowPrompt } = useDailyPrompt(goals)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadGoals()
    }
  }, [user])

  const loadGoals = async () => {
    if (!user) return
    try {
      const userGoals = await getUserGoals(user.uid)
      setGoals(userGoals)
    } catch (error) {
      console.error("Error loading goals:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground">Track your goals and build better habits every day.</p>
          </div>
          <GoalStats goals={goals} />
          <GoalList />
          <DailyPromptModal goals={goals} isOpen={showPrompt} onClose={() => setShowPrompt(false)} />
          <InstallPrompt />
        </div>
      </main>
    </div>
  )
}
