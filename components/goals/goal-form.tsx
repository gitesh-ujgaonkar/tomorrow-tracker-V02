"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Goal } from "@/types"
import { createGoal, updateGoal } from "@/lib/firestore"
import { useAuth } from "@/lib/auth-context"

interface GoalFormProps {
  goal?: Goal
  onSuccess: () => void
  onCancel: () => void
}

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export function GoalForm({ goal, onSuccess, onCancel }: GoalFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState(goal?.title || "")
  const [description, setDescription] = useState(goal?.description || "")
  const [goalType, setGoalType] = useState<"daily" | "specific-days">(goal?.goalType || "daily")
  const [specificDays, setSpecificDays] = useState<string[]>(goal?.specificDays || [])
  const [category, setCategory] = useState(goal?.category || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleDayToggle = (day: string) => {
    setSpecificDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      const goalData = {
        title,
        description,
        goalType,
        specificDays: goalType === "specific-days" ? specificDays : [],
        category: category || undefined,
        userId: user.uid,
        isActive: true,
      }

      if (goal) {
        await updateGoal(goal.id, goalData)
      } else {
        await createGoal(goalData)
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving goal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{goal ? "Edit Goal" : "Create New Goal"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter goal title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your goal"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Health, Work, Personal"
            />
          </div>

          <div className="space-y-2">
            <Label>Goal Type</Label>
            <Select value={goalType} onValueChange={(value: "daily" | "specific-days") => setGoalType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="specific-days">Specific Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {goalType === "specific-days" && (
            <div className="space-y-2">
              <Label>Select Days</Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={specificDays.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <Label htmlFor={day} className="capitalize">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
