"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { Recipe } from "@/lib/types"
import RecipeCard from "@/components/recipe-card"
import LoadingShimmer from "@/components/loading-shimmer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import { useRecipes } from "@/context/recipe-context"
import { getRecipe, deleteRecipe } from "@/lib/indexdb"

export default function RecipePage() {
  const params = useParams()
  const router = useRouter()
  const { favoriteRecipes, generatedRecipes } = useRecipes()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecipe = async () => {
    const recipeId = params.id as string

    // First check if recipe is in generatedRecipes from context
    const contextRecipe = generatedRecipes.find((r) => r.id === recipeId)
    if (contextRecipe) {
      setRecipe(contextRecipe)
      setLoading(false)
      return
    }

    // Try to get recipe from IndexDB as fallback
    const storedRecipe = await getRecipe(recipeId);
    if (storedRecipe) {
      setRecipe(storedRecipe);
      setLoading(false);
      return;
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
    };
    fetchRecipe();
  }, [params.id, favoriteRecipes, generatedRecipes, router])

  const handleCreateNew = async () => {
    // Clear current recipe from IndexDB if not favorited
    if (recipe && !favoriteRecipes.some((r) => r.id === recipe.id)) {
      await deleteRecipe(recipe.id);
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
