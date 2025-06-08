export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
  prepTime: number
  cookTime: number
  servings: number
  difficulty: "Easy" | "Medium" | "Hard"
  cuisine: string
  dietary: string[]
  image?: string
  nutrition?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export interface RecipeFilters {
  servings: number
  dietary: string[]
  cuisine: string[]
  spiceLevel: string[]
  mealType: string[]
  cookTime: string[]
  healthProfile: string[]
  difficulty?: string[]
}

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}
