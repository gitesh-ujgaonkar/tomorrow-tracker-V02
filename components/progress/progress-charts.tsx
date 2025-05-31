"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, TrendingUp, Target, Flame } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { GoalCompletion, DailyPromptResponse } from "@/types"

interface ProgressData {
  weeklyCompletion: number
  monthlyCompletion: number
  currentStreak: number
  longestStreak: number
  totalGoalsCompleted: number
  mostConsistentDay: string
  recentResponses: DailyPromptResponse[]
}

export function ProgressCharts() {
  const { user } = useAuth()
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadProgressData()
    }
  }, [user])

  const loadProgressData = async () => {
    if (!user) return

    try {
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Get goal completions for the last month
      const completionsQuery = query(
        collection(db, "goalCompletions"),
        where("userId", "==", user.uid),
        where("completedAt", ">=", oneMonthAgo),
        orderBy("completedAt", "desc"),
      )
      const completionsSnapshot = await getDocs(completionsQuery)
      const completions = completionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt.toDate(),
      })) as GoalCompletion[]

      // Get daily prompt responses
      const promptsQuery = query(
        collection(db, "dailyPrompts"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
      )
      const promptsSnapshot = await getDocs(promptsQuery)
      const responses = promptsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as DailyPromptResponse[]

      // Calculate weekly completion rate
      const weeklyCompletions = completions.filter((c) => c.completedAt >= oneWeekAgo)
      const weeklyCompletion = calculateCompletionRate(weeklyCompletions, 7)

      // Calculate monthly completion rate
      const monthlyCompletion = calculateCompletionRate(completions, 30)

      // Calculate streaks
      const { currentStreak, longestStreak } = calculateStreaks(responses)

      // Find most consistent day
      const mostConsistentDay = findMostConsistentDay(completions)

      setProgressData({
        weeklyCompletion,
        monthlyCompletion,
        currentStreak,
        longestStreak,
        totalGoalsCompleted: completions.length,
        mostConsistentDay,
        recentResponses: responses.slice(0, 7),
      })
    } catch (error) {
      console.error("Error loading progress data:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateCompletionRate = (completions: GoalCompletion[], days: number): number => {
    if (completions.length === 0) return 0

    // Group completions by date
    const completionsByDate = completions.reduce(
      (acc, completion) => {
        const date = completion.date
        acc[date] = (acc[date] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate average completions per day
    const totalDays = Object.keys(completionsByDate).length
    const avgCompletionsPerDay = completions.length / Math.max(totalDays, 1)

    // Assume 3 goals per day as target (this could be made dynamic)
    return Math.min(100, (avgCompletionsPerDay / 3) * 100)
  }

  const calculateStreaks = (responses: DailyPromptResponse[]) => {
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Sort responses by date
    const sortedResponses = responses
      .filter((r) => r.response === "yes" || r.response === "partial")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    for (let i = 0; i < sortedResponses.length; i++) {
      const currentDate = new Date(sortedResponses[i].date)
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)

      if (currentDate.toDateString() === expectedDate.toDateString()) {
        tempStreak++
        if (i === 0) currentStreak = tempStreak
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 0
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak)
    return { currentStreak, longestStreak }
  }

  const findMostConsistentDay = (completions: GoalCompletion[]): string => {
    const dayCount = completions.reduce(
      (acc, completion) => {
        const day = new Date(completion.completedAt).toLocaleDateString("en-US", { weekday: "long" })
        acc[day] = (acc[day] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(dayCount).reduce((a, b) => (dayCount[a[0]] > dayCount[b[0]] ? a : b))[0] || "Monday"
  }

  if (loading) {
    return <div className="text-center">Loading progress data...</div>
  }

  if (!progressData) {
    return <div className="text-center">No progress data available yet.</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(progressData.weeklyCompletion)}%</div>
            <p className="text-xs text-muted-foreground">Goal completion rate</p>
            <Progress value={progressData.weeklyCompletion} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.currentStreak}</div>
            <p className="text-xs text-muted-foreground">{progressData.currentStreak === 1 ? "day" : "days"}</p>
            <Badge variant={progressData.currentStreak >= 7 ? "default" : "secondary"} className="mt-2">
              {progressData.currentStreak >= 7 ? "🔥 On fire!" : "Keep going!"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.mostConsistentDay}</div>
            <p className="text-xs text-muted-foreground">Most consistent day</p>
            <Badge variant="outline" className="mt-2">
              Top performer
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.totalGoalsCompleted}</div>
            <p className="text-xs text-muted-foreground">Goals completed this month</p>
            <Badge variant="secondary" className="mt-2">
              {progressData.longestStreak} day best streak
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {progressData.recentResponses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No check-ins yet. Complete your first daily prompt to see your progress!
            </p>
          ) : (
            <div className="space-y-2">
              {progressData.recentResponses.map((response) => (
                <div key={response.id} className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm">{new Date(response.date).toLocaleDateString()}</span>
                  <Badge
                    variant={
                      response.response === "yes"
                        ? "default"
                        : response.response === "partial"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {response.response === "yes"
                      ? "All goals achieved"
                      : response.response === "partial"
                        ? "Some progress"
                        : "No progress"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
