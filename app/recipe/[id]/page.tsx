"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Recipe } from "@/lib/types"
import RecipeCard from "@/components/recipe-card"
import LoadingShimmer from "@/components/loading-shimmer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import { useRecipes } from "@/context/recipe-context"

export default function RecipePage() {
  const params = useParams()
  const router = useRouter()
  const { favoriteRecipes, generatedRecipes } = useRecipes()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const recipeId = params.id as string

    // First check if recipe is in generatedRecipes from context
    const contextRecipe = generatedRecipes.find((r) => r.id === recipeId)
    if (contextRecipe) {
      setRecipe(contextRecipe)
      setLoading(false)
      return
    }

    // Try to get recipe from localStorage as fallback
    const storedRecipes = localStorage.getItem("generated-recipes")
    if (storedRecipes) {
      try {
        const recipes: Recipe[] = JSON.parse(storedRecipes)
        const foundRecipe = recipes.find((r) => r.id === recipeId)
        if (foundRecipe) {
          setRecipe(foundRecipe)
          setLoading(false)
          return
        }
      } catch (error) {
        console.error("Error parsing stored recipes:", error)
      }
    }

    // Check if recipe is in favorites
    const favoriteRecipe = favoriteRecipes.find((r) => r.id === recipeId)
    if (favoriteRecipe) {
      setRecipe(favoriteRecipe)
      setLoading(false)
      return
    }

    // If recipe not found, redirect to home
    setLoading(false)
    router.push("/")
  }, [params.id, favoriteRecipes, generatedRecipes, router])

  const handleCreateNew = () => {
    // Clear current recipe from localStorage if not favorited
    if (recipe && !favoriteRecipes.some((r) => r.id === recipe.id)) {
      const storedRecipes = localStorage.getItem("generated-recipes")
      if (storedRecipes) {
        try {
          const recipes: Recipe[] = JSON.parse(storedRecipes)
          const filteredRecipes = recipes.filter((r) => r.id !== recipe.id)
          localStorage.setItem("generated-recipes", JSON.stringify(filteredRecipes))
        } catch (error) {
          console.error("Error updating stored recipes:", error)
        }
      }
    }

    router.push("/")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingShimmer />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold mb-2">Recipe not found</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          The recipe you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/")} className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Button onClick={handleCreateNew} size="sm" className="rounded-full">
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>

      <RecipeCard recipe={recipe} />
    </div>
  )
}
