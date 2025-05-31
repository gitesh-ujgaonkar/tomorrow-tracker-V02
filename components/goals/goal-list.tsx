"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Plus } from "lucide-react"
import type { Goal, GoalCompletion } from "@/types"
import { getUserGoals, deleteGoal, getGoalCompletions, markGoalComplete, unmarkGoalComplete } from "@/lib/firestore"
import { useAuth } from "@/lib/auth-context"
import { GoalForm } from "./goal-form"

interface GoalListProps {
  onGoalsChange?: () => void
}

export function GoalList({ onGoalsChange }: GoalListProps = {}) {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [completions, setCompletions] = useState<GoalCompletion[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>()
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split("T")[0]
  const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()

  useEffect(() => {
    if (user) {
      loadGoals()
      loadCompletions()
    }
  }, [user])

  const loadGoals = async () => {
    if (!user) return
    try {
      const userGoals = await getUserGoals(user.uid)
      setGoals(userGoals)
    } catch (error) {
      console.error("Error loading goals:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCompletions = async () => {
    if (!user) return
    try {
      const todayCompletions = await getGoalCompletions(user.uid, today)
      setCompletions(todayCompletions)
    } catch (error) {
      console.error("Error loading completions:", error)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingGoal(undefined)
    loadGoals()
    onGoalsChange?.()
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId)
      setGoals(goals.filter((goal) => goal.id !== goalId))
      onGoalsChange?.()
    } catch (error) {
      console.error("Error deleting goal:", error)
    }
  }

  const handleToggleCompletion = async (goal: Goal) => {
    if (!user) return

    const isCompleted = completions.some((c) => c.goalId === goal.id)

    try {
      if (isCompleted) {
        await unmarkGoalComplete(goal.id, user.uid, today)
        setCompletions(completions.filter((c) => c.goalId !== goal.id))
      } else {
        await markGoalComplete(goal.id, user.uid, today)
        setCompletions([
          ...completions,
          {
            id: `temp-${Date.now()}`,
            goalId: goal.id,
            userId: user.uid,
            date: today,
            completedAt: new Date(),
          },
        ])
      }
    } catch (error) {
      console.error("Error toggling completion:", error)
    }
  }

  const isGoalActiveToday = (goal: Goal) => {
    if (goal.goalType === "daily") return true
    return goal.specificDays?.includes(currentDay) || false
  }

  const todaysGoals = goals.filter(isGoalActiveToday)

  if (loading) {
    return <div className="text-center">Loading goals...</div>
  }

  if (showForm) {
    return (
      <GoalForm
        goal={editingGoal}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false)
          setEditingGoal(undefined)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Today's Goals</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {todaysGoals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No goals for today. Create your first goal!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todaysGoals.map((goal) => {
            const isCompleted = completions.some((c) => c.goalId === goal.id)

            return (
              <Card key={goal.id} className={isCompleted ? "bg-green-50 dark:bg-green-950" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleToggleCompletion(goal)}
                      className="mt-1"
                    />

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {goal.title}
                        </h3>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingGoal(goal)
                                setShowForm(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteGoal(goal.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {goal.description && (
                        <p className={`text-sm text-muted-foreground ${isCompleted ? "line-through" : ""}`}>
                          {goal.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{goal.goalType === "daily" ? "Daily" : "Specific Days"}</Badge>
                        {goal.category && <Badge variant="outline">{goal.category}</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
