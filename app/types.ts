export interface QuestObjective {
  id: string
  text: string
  completed: boolean
}

export interface Quest {
  id: string
  text: string
  completed: boolean
  xp: number // Keep field, but decouple logic
  dueDate?: Date | null
  difficulty: number // 0-4 in 0.5 increments
  value: number // Added value field (0-4)
  questType: "main" | "side" | "extra"
  objectives: QuestObjective[]
  chainId?: string
  createdAt: Date; // Added creation timestamp
  completedAt?: Date | null; // Added completion timestamp
}

export interface QuestChain {
  id: string
  name: string
  difficulty?: number // Added: 0-4, 0.5 increments, similar to Quest
  value?: number      // Added: 0-4, integer, similar to Quest
  createdAt?: Date;    // ADDED: Creation timestamp
  dueDate?: Date | null; // ADDED: Optional due date for the chain
}

export interface Character {
  level: number
  title: string
  avatar: string // URL or identifier for avatar image
  progress: number // Add this line - progress from 0 to 100
  createdAt: Date | null; // Allow null again for error handling
}

export type ViewType = "list" | "grid" | "ideas"

export type SortOption = "difficulty" | "dueDate" | "questType" | "createdAt" | "completedAt" | "updatedAt"
export type FilterOption = "all" | "completed" | "active" | "chained" | "side" | "extra"

export interface Idea {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}
