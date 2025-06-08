"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, TrendingUp, Clock, Utensils } from "lucide-react"
import LoadingShimmer from "@/components/loading-shimmer"
import RecipeCard from "@/components/recipe-card"
import type { Recipe } from "@/lib/types"
import { useGroqRecipe } from "@/hooks/use-groq-recipe"
import { saveRecipe } from "@/lib/indexdb"

const CUISINE_CATEGORIES = [
  { name: "Italian", emoji: "🍝" },
  { name: "Mexican", emoji: "🌮" },
  { name: "Asian", emoji: "🍜" },
  { name: "Indian", emoji: "🍛" },
  { name: "Mediterranean", emoji: "🥙" },
  { name: "American", emoji: "🍔" },
]

const MEAL_TYPES = [
  { name: "Breakfast", emoji: "🍳" },
  { name: "Lunch", emoji: "🥪" },
  { name: "Dinner", emoji: "🍲" },
  { name: "Dessert", emoji: "🍰" },
  { name: "Snack", emoji: "🍿" },
]

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [activeTab, setActiveTab] = useState("trending")
  const { generateRecipe, loading } = useGroqRecipe()

  useEffect(() => {
    // Load trending recipes on initial load
    if (activeTab === "trending" && recipes.length === 0) {
      generateTrendingRecipes()
    }
  }, [])

  const generateTrendingRecipes = async () => {
    try {
      const recipe1 = await generateRecipe("popular pasta dish", {
        servings: 4,
        cuisine: ["italian"],
        mealType: ["dinner"],
        cookTime: [],
        dietary: [],
        healthProfile: [],
        spiceLevel: [],
      })
      const recipe2 = await generateRecipe("healthy breakfast", {
        servings: 2,
        cuisine: [],
        mealType: ["breakfast"],
        cookTime: ["quick"],
        dietary: [],
        healthProfile: ["low-calorie"],
        spiceLevel: [],
      })

      if (recipe1 && recipe2) {
        await saveRecipe(recipe1);
        await saveRecipe(recipe2);
        setRecipes([recipe1, recipe2])
      }
    } catch (error) {
      console.error("Error generating trending recipes:", error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const recipe = await generateRecipe(searchQuery, {
        servings: 4,
        cuisine: [],
        mealType: [],
        cookTime: [],
        dietary: [],
        healthProfile: [],
        spiceLevel: [],
      })
      if (recipe) {
        await saveRecipe(recipe);
        setRecipes((prev) => [recipe, ...prev])
      }
    } catch (error) {
      console.error("Error searching recipes:", error)
    }
  }

  const handleCategoryClick = async (category: string) => {
    try {
      const recipe = await generateRecipe(`${category} recipe`, {
        servings: 4,
        cuisine: [category],
        mealType: [],
        cookTime: [],
        dietary: [],
        healthProfile: [],
        spiceLevel: [],
      })
      if (recipe) {
        await saveRecipe(recipe);
        setRecipes((prev) => [recipe, ...prev])
      }
    } catch (error) {
      console.error(`Error generating ${category} recipe:`, error)
    }
  }

  const handleMealTypeClick = async (mealType: string) => {
    try {
      const recipe = await generateRecipe(`${mealType} recipe`, {
        servings: 4,
        cuisine: [],
        mealType: [mealType.toLowerCase()],
        cookTime: [],
        dietary: [],
        healthProfile: [],
        spiceLevel: [],
      })
      if (recipe) {
        await saveRecipe(recipe);
        setRecipes((prev) => [recipe, ...prev])
      }
    } catch (error) {
      console.error(`Error generating ${mealType} recipe:`, error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-full"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button size="icon" className="rounded-full h-10 w-10" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="trending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="cuisines">
            <Utensils className="h-4 w-4 mr-2" />
            Cuisines
          </TabsTrigger>
          <TabsTrigger value="meals">
            <Clock className="h-4 w-4 mr-2" />
            Meals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <LoadingShimmer key={i} />
              ))}
            </div>
          ) : recipes.length > 0 ? (
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <Card className="mobile-card">
              <CardContent className="py-8 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Discover Trending Recipes</h3>
                <p className="text-sm text-muted-foreground">Popular recipes that everyone is cooking right now.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cuisines" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {CUISINE_CATEGORIES.map((cuisine) => (
              <Button
                key={cuisine.name}
                variant="outline"
                className="h-16 rounded-xl border-2 hover:border-primary"
                onClick={() => handleCategoryClick(cuisine.name)}
                disabled={loading}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{cuisine.emoji}</div>
                  <div className="text-sm font-medium">{cuisine.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {MEAL_TYPES.map((meal) => (
              <Button
                key={meal.name}
                variant="outline"
                className="h-16 rounded-xl border-2 hover:border-primary"
                onClick={() => handleMealTypeClick(meal.name)}
                disabled={loading}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{meal.emoji}</div>
                  <div className="text-sm font-medium">{meal.name}</div>
                </div>
              </Button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="space-y-4">
          <LoadingShimmer />
        </div>
      )}
    </div>
  )
}
