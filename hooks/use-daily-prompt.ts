"use client"

import { useState, useEffect } from "react"
import type { Goal } from "@/types"

export function useDailyPrompt(goals: Goal[]) {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const checkDailyPrompt = () => {
      const now = new Date()
      const today = now.toISOString().split("T")[0]
      const currentHour = now.getHours()

      // Show prompt at 9 PM (21:00) or later
      const shouldShowPrompt = currentHour >= 21

      // Check if we've already shown the prompt today
      const lastShown = localStorage.getItem("dailyPromptShown")
      const alreadyShownToday = lastShown === today

      // Only show if we have goals, it's after 9 PM, and we haven't shown it today
      if (goals.length > 0 && shouldShowPrompt && !alreadyShownToday) {
        setShowPrompt(true)
      }
    }

    // Check immediately
    checkDailyPrompt()

    // Check every minute
    const interval = setInterval(checkDailyPrompt, 60000)

    return () => clearInterval(interval)
  }, [goals])

  return {
    showPrompt,
    setShowPrompt,
  }
}
