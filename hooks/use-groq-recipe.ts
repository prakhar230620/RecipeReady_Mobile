"use client"

import { useState } from "react"
import type { Recipe, RecipeFilters } from "@/lib/types"
import toast from "react-hot-toast"

export function useGroqRecipe() {
  const [loading, setLoading] = useState(false)

  const generateRecipe = async (ingredients: string, filters: RecipeFilters): Promise<Recipe | null> => {
    setLoading(true)

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients,
          filters,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate recipe")
      }

      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.recipe) {
        throw new Error("No recipe received")
      }

      toast.success("Recipe generated successfully!")
      return data.recipe
    } catch (error) {
      console.error("Error generating recipe:", error)
      toast.error("Failed to generate recipe. Please try again.")
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    generateRecipe,
    loading,
  }
}
