"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context"
import { useRecipes } from "@/context/recipe-context"
import RecipeCard from "@/components/recipe-card"
import { getAllRecipes } from "@/lib/indexdb";
import LoadingShimmer from "@/components/loading-shimmer"
import { Heart, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function FavoritesPage() {
  const { user, status } = useAuth()
  const { favoriteRecipes } = useRecipes()
  const [generatedRecipes, setGeneratedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGeneratedRecipes = async () => {
      setLoading(true);
      try {
        const recipes = await getAllRecipes();
        setGeneratedRecipes(recipes);
      } catch (error) {
        console.error("Error loading generated recipes from IndexDB:", error);
      } finally {
        setLoading(false);
      }
    };
    loadGeneratedRecipes();
  }, []);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <LoadingShimmer key={i} />
        ))}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-3">Sign In Required</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">Please sign in to view your favorite recipes.</p>
        <Button asChild className="rounded-full">
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <LoadingShimmer key={i} />
          ))}
        </div>
      ) : favoriteRecipes.length > 0 || generatedRecipes.length > 0 ? (
        <div className="space-y-4">
          {favoriteRecipes.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Your Favorite Recipes</h2>
              {favoriteRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}

          {generatedRecipes.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Your Generated Recipes</h2>
              {generatedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No recipes yet</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            Start generating recipes to see them here.
          </p>
          <Button asChild className="rounded-full">
            <Link href="/">Generate Recipes</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
