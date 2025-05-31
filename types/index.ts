export interface User {
  uid: string
  email: string
  displayName?: string
}

export interface Goal {
  id: string
  userId: string
  title: string
  description: string
  goalType: "daily" | "specific-days"
  specificDays?: string[] // ['monday', 'tuesday', etc.]
  category?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface GoalCompletion {
  id: string
  goalId: string
  userId: string
  completedAt: Date
  date: string // YYYY-MM-DD format
}

export interface DailyPromptResponse {
  id: string
  userId: string
  date: string // YYYY-MM-DD format
  response: "yes" | "no" | "partial"
  goals: string[] // goal IDs
  createdAt: Date
}

export interface ProgressStats {
  userId: string
  period: "weekly" | "monthly"
  startDate: string
  endDate: string
  totalGoals: number
  completedGoals: number
  completionRate: number
  streak: number
  mostConsistentDays: string[]
}
