"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Target } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getGoalCompletions } from "@/lib/firestore"
import type { Goal, GoalCompletion } from "@/types"

interface GoalStatsProps {
  goals: Goal[]
}

export function GoalStats({ goals }: GoalStatsProps) {
  const { user } = useAuth()
  const [completions, setCompletions] = useState<GoalCompletion[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split("T")[0]
  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

  useEffect(() => {
    if (user) {
      loadTodayCompletions()
    }
  }, [user, goals])

  const loadTodayCompletions = async () => {
    if (!user) return
    try {
      const todayCompletions = await getGoalCompletions(user.uid, today)
      setCompletions(todayCompletions)
    } catch (error) {
      console.error("Error loading completions:", error)
    } finally {
      setLoading(false)
    }
  }

  const todaysGoals = goals.filter((goal) => {
    if (goal.goalType === "daily") return true
    return goal.specificDays?.includes(currentDay) || false
  })

  const completedGoals = todaysGoals.filter((goal) => completions.some((c) => c.goalId === goal.id))

  const completionRate = todaysGoals.length > 0 ? (completedGoals.length / todaysGoals.length) * 100 : 0

  if (loading) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Goals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todaysGoals.length}</div>
          <p className="text-xs text-muted-foreground">{todaysGoals.length === 1 ? "goal" : "goals"} scheduled</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedGoals.length}</div>
          <p className="text-xs text-muted-foreground">
            out of {todaysGoals.length} {todaysGoals.length === 1 ? "goal" : "goals"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
          <Badge
            variant={completionRate === 100 ? "default" : completionRate >= 50 ? "secondary" : "destructive"}
            className="mt-1"
          >
            {completionRate === 100 ? "Perfect!" : completionRate >= 50 ? "Good progress" : "Keep going"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
