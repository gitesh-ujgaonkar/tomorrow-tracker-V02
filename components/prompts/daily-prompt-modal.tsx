"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { saveDailyPromptResponse } from "@/lib/firestore"
import type { Goal } from "@/types"

interface DailyPromptModalProps {
  goals: Goal[]
  isOpen: boolean
  onClose: () => void
}

export function DailyPromptModal({ goals, isOpen, onClose }: DailyPromptModalProps) {
  const { user } = useAuth()
  const [response, setResponse] = useState<"yes" | "no" | "partial">()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user || !response) return

    setIsSubmitting(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      await saveDailyPromptResponse({
        userId: user.uid,
        date: today,
        response,
        goals: goals.map((g) => g.id),
      })

      // Store that we've shown the prompt today
      localStorage.setItem("dailyPromptShown", today)
      onClose()
    } catch (error) {
      console.error("Error saving daily prompt response:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            End of Day Check-in
          </DialogTitle>
          <DialogDescription>How did you do with your goals today?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Today's Goals:</h4>
            <div className="space-y-1">
              {goals.map((goal) => (
                <div key={goal.id} className="text-sm text-muted-foreground">
                  • {goal.title}
                </div>
              ))}
            </div>
          </div>

          <RadioGroup value={response} onValueChange={(value: "yes" | "no" | "partial") => setResponse(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Yes, I achieved all my goals!
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="partial" id="partial" />
              <Label htmlFor="partial" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />I made progress on some goals
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                No, I didn't achieve my goals today
              </Label>
            </div>
          </RadioGroup>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!response || isSubmitting} className="flex-1">
              {isSubmitting ? "Saving..." : "Submit"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
