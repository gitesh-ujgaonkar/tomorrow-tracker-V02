import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Goal, GoalCompletion, DailyPromptResponse } from "@/types"

// Goals CRUD operations
export const createGoal = async (goalData: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
  const now = new Date()
  const docRef = await addDoc(collection(db, "goals"), {
    ...goalData,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  })
  return docRef.id
}

export const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
  const goalRef = doc(db, "goals", goalId)
  await updateDoc(goalRef, {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date()),
  })
}

export const deleteGoal = async (goalId: string) => {
  await deleteDoc(doc(db, "goals", goalId))
}

export const getUserGoals = async (userId: string): Promise<Goal[]> => {
  const q = query(
    collection(db, "goals"),
    where("userId", "==", userId),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as Goal[]
}

// Goal completion operations
export const markGoalComplete = async (goalId: string, userId: string, date: string) => {
  await addDoc(collection(db, "goalCompletions"), {
    goalId,
    userId,
    date,
    completedAt: Timestamp.fromDate(new Date()),
  })
}

export const unmarkGoalComplete = async (goalId: string, userId: string, date: string) => {
  const q = query(
    collection(db, "goalCompletions"),
    where("goalId", "==", goalId),
    where("userId", "==", userId),
    where("date", "==", date),
  )
  const querySnapshot = await getDocs(q)
  querySnapshot.docs.forEach(async (doc) => {
    await deleteDoc(doc.ref)
  })
}

export const getGoalCompletions = async (userId: string, date: string): Promise<GoalCompletion[]> => {
  const q = query(collection(db, "goalCompletions"), where("userId", "==", userId), where("date", "==", date))
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    completedAt: doc.data().completedAt.toDate(),
  })) as GoalCompletion[]
}

// Daily prompt operations
export const saveDailyPromptResponse = async (response: Omit<DailyPromptResponse, "id" | "createdAt">) => {
  await addDoc(collection(db, "dailyPrompts"), {
    ...response,
    createdAt: Timestamp.fromDate(new Date()),
  })
}
