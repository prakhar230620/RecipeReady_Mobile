"use client"

import { useState } from "react"
import type { Recipe } from "@/lib/types"
import { useRecipes } from "@/context/recipe-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Heart, Clock, Users, ChefHat, Printer, Share2, Star, ChevronDown, ChevronUp, Zap } from "lucide-react"
import Image from "next/image"
import { addEmojisToIngredients, addEmojisToInstructions } from "@/lib/emoji-mapper"
import toast from "react-hot-toast"
import { useAuth } from "@/context/auth-context"

interface RecipeCardProps {
  recipe: Recipe
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { user } = useAuth()
  const { addToFavorites, removeFromFavorites, isFavorite } = useRecipes()
  const [expanded, setExpanded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isRecipeFavorite = isFavorite(recipe.id)

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error("Please sign in to save favorites")
      return
    }

    if (isRecipeFavorite) {
      await removeFromFavorites(recipe.id)
    } else {
      await addToFavorites(recipe)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${recipe.title}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
              h2 { color: #666; margin-top: 30px; }
              .meta { display: flex; gap: 20px; margin: 20px 0; }
              .meta span { background: #f0f0f0; padding: 5px 10px; border-radius: 5px; }
              ul, ol { line-height: 1.6; }
              li { margin-bottom: 8px; }
              .ingredients { background: #f9f9f9; padding: 20px; border-radius: 8px; }
              .nutrition { background: #e8f5e8; padding: 15px; border-radius: 8px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>${recipe.title}</h1>
            <p>${recipe.description}</p>
            <div class="meta">
              <span>⏱️ Prep: ${recipe.prepTime} min</span>
              <span>🔥 Cook: ${recipe.cookTime} min</span>
              <span>👥 ${recipe.servings} servings</span>
              <span>📊 ${recipe.difficulty}</span>
            </div>
            <div class="ingredients">
              <h2>Ingredients</h2>
              <ul>
                ${addEmojisToIngredients(recipe.ingredients)
                  .map((ingredient) => `<li>${ingredient}</li>`)
                  .join("")}
              </ul>
            </div>
            <h2>Instructions</h2>
            <ol>
              ${addEmojisToInstructions(recipe.instructions)
                .map((instruction) => `<li>${instruction}</li>`)
                .join("")}
            </ol>
            ${
              recipe.nutrition
                ? `
            <div class="nutrition">
              <h2>Nutrition Information (per serving)</h2>
              <p><strong>Calories:</strong> ${recipe.nutrition.calories} kcal</p>
              <p><strong>Protein:</strong> ${recipe.nutrition.protein}g</p>
              <p><strong>Carbohydrates:</strong> ${recipe.nutrition.carbs}g</p>
              <p><strong>Fat:</strong> ${recipe.nutrition.fat}g</p>
            </div>
            `
                : ""
            }
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Recipe link copied to clipboard! 📋")
    }
  }

  const enhancedIngredients = addEmojisToIngredients(recipe.ingredients)
  const enhancedInstructions = addEmojisToInstructions(recipe.instructions)

  return (
    <Card className="recipe-card fade-in print-friendly overflow-hidden mobile-card">
      <div className="relative h-56 bg-muted">
        {recipe.image && !imageError ? (
          <Image
            src={recipe.image || "/placeholder.svg"}
            alt={recipe.title}
            fill
            className="object-cover"
            crossOrigin="anonymous"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <ChefHat className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2 no-print">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFavoriteToggle}
            className="h-10 w-10 p-0 bg-background/90 backdrop-blur-sm rounded-full shadow-lg"
          >
            <Heart className={`h-5 w-5 ${isRecipeFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="bg-background/90 backdrop-blur-sm rounded-xl p-3">
            <h3 className="text-lg font-bold mb-1 line-clamp-2">{recipe.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2">{recipe.description}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-5">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Prep: {recipe.prepTime}m
            </Badge>
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Cook: {recipe.cookTime}m
            </Badge>
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Users className="h-3 w-3" />
              {recipe.servings} servings
            </Badge>
            <Badge variant="secondary" className="text-xs flex items-center gap-1">
              <Star className="h-3 w-3" />
              {recipe.difficulty}
            </Badge>
            {recipe.cuisine && recipe.cuisine !== "International" && (
              <Badge variant="outline" className="text-xs">
                🌍 {recipe.cuisine}
              </Badge>
            )}
            {recipe.dietary && recipe.dietary.length > 0 && (
              <Badge variant="outline" className="text-xs">
                🥗 {recipe.dietary.join(", ")}
              </Badge>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              🛒 Ingredients ({recipe.ingredients.length})
            </h4>
            <ul className="text-sm space-y-1">
              {enhancedIngredients.slice(0, expanded ? enhancedIngredients.length : 4).map((ingredient, index) => (
                <li key={index} className="text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
              {!expanded && recipe.ingredients.length > 4 && (
                <li className="text-xs text-muted-foreground italic">
                  +{recipe.ingredients.length - 4} more ingredients...
                </li>
              )}
            </ul>
          </div>

          {expanded && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                👨‍🍳 Instructions ({recipe.instructions.length} steps)
              </h4>
              <ol className="text-sm space-y-2">
                {enhancedInstructions.map((instruction, index) => (
                  <li key={index} className="text-muted-foreground flex gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {expanded && recipe.nutrition && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl p-4">
              <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                📊 Nutrition Information (per serving)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">{recipe.nutrition.calories}</div>
                  <div className="text-xs text-muted-foreground">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{recipe.nutrition.protein}g</div>
                  <div className="text-xs text-muted-foreground">Protein</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{recipe.nutrition.carbs}g</div>
                  <div className="text-xs text-muted-foreground">Carbs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{recipe.nutrition.fat}g</div>
                  <div className="text-xs text-muted-foreground">Fat</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex justify-between no-print">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-sm flex items-center rounded-full"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show More
            </>
          )}
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handlePrint} className="h-9 w-9 p-0 rounded-full">
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare} className="h-9 w-9 p-0 rounded-full">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
