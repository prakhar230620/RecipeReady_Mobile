import { type NextRequest, NextResponse } from "next/server"
import type { Recipe, RecipeFilters } from "@/lib/types"

export const dynamic = 'force-dynamic'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAADeCP52o554AU2IrQFb9NeDruudFBYdM"

export async function POST(request: NextRequest) {
  try {
    const { ingredients, filters } = await request.json()

    if (!ingredients) {
      return NextResponse.json({ error: "Please tell me what you want to cook!" }, { status: 400 })
    }

    // Get user's selected language
    const userLanguage = request.headers.get("accept-language")?.split(",")[0] || "en"

    // If no Groq API key, return a mock recipe
    if (!GROQ_API_KEY) {
      console.warn("Groq API key not configured, returning mock recipe")
      const mockRecipe = await createMockRecipeWithImage(ingredients, filters, userLanguage)
      return NextResponse.json({ recipe: mockRecipe })
    }

    const prompt = buildNaturalLanguagePrompt(ingredients, filters)

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a world-class chef and nutritionist who understands cooking in all languages and cultures. You create authentic, detailed recipes with accurate nutritional information. You understand natural language requests and can interpret what users want even from casual conversation. Always respond with valid JSON format only, no additional text. Be very specific about ingredients and cooking methods. Calculate accurate nutritional values based on ingredients and portions.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
        top_p: 1,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Groq API error: ${response.status} ${response.statusText}`, errorText)

      // Return mock recipe as fallback
      const mockRecipe = await createMockRecipeWithImage(ingredients, filters, userLanguage)
      return NextResponse.json({ recipe: mockRecipe })
    }

    const data = await response.json()
    const recipeText = data.choices?.[0]?.message?.content

    if (!recipeText) {
      console.error("No recipe content received from Groq API")
      const mockRecipe = await createMockRecipeWithImage(ingredients, filters, userLanguage)
      return NextResponse.json({ recipe: mockRecipe })
    }

    // Clean the response text to extract JSON
    let cleanedText = recipeText.trim()

    // Remove any markdown formatting or extra text
    if (cleanedText.includes("```json")) {
      cleanedText = cleanedText.split("```json")[1].split("```")[0].trim()
    } else if (cleanedText.includes("```")) {
      cleanedText = cleanedText.split("```")[1].split("```")[0].trim()
    }

    // Parse the JSON response
    let recipe: Recipe
    try {
      const parsedRecipe = JSON.parse(cleanedText)

      // Generate accurate image for the recipe using Gemini
      const imageUrl = await generateAccurateRecipeImage(
        parsedRecipe.title,
        parsedRecipe.description,
        parsedRecipe.cuisine,
      )

      recipe = {
        id: generateRecipeId(),
        title: parsedRecipe.title || `Recipe for ${ingredients}`,
        description: parsedRecipe.description || `A delicious recipe created just for you`,
        ingredients: Array.isArray(parsedRecipe.ingredients) ? parsedRecipe.ingredients : [],
        instructions: Array.isArray(parsedRecipe.instructions) ? parsedRecipe.instructions : [],
        prepTime: Number(parsedRecipe.prepTime) || 15,
        cookTime: parseCookTime(parsedRecipe.cookTime) || 30,
        servings: filters.servings || 2,
        difficulty: ["Easy", "Medium", "Hard"].includes(parsedRecipe.difficulty) ? parsedRecipe.difficulty : "Medium",
        cuisine: parsedRecipe.cuisine || (filters.cuisine?.length > 0 ? filters.cuisine[0] : "International"),
        dietary: Array.isArray(parsedRecipe.dietary) ? parsedRecipe.dietary : (filters.dietary?.length > 0 ? filters.dietary : []),
        image: imageUrl,
        nutrition: calculateAccurateNutrition(parsedRecipe, filters),
      }

      // Validate that we have essential data
      if (!recipe.ingredients.length || !recipe.instructions.length) {
        throw new Error("Incomplete recipe data")
      }
    } catch (parseError) {
      console.error("Failed to parse recipe JSON:", parseError)
      console.error("Raw response:", recipeText)
      // Fallback: create a basic recipe structure
      recipe = await createFallbackRecipeWithImage(ingredients, filters, recipeText, userLanguage)
    }

    // Helper function to parse cook time that might be in various formats
    function parseCookTime(cookTime: any): number {
      if (typeof cookTime === 'number') return cookTime;
      if (!cookTime) return 30; // default
      
      // If it's a string, try to extract hours and minutes
      if (typeof cookTime === 'string') {
        let totalMinutes = 0;
        
        // Extract hours
        const hoursMatch = cookTime.match(/(\d+)\s*hours?/i);
        if (hoursMatch) {
          totalMinutes += parseInt(hoursMatch[1], 10) * 60;
        }
        
        // Extract minutes
        const minutesMatch = cookTime.match(/(\d+)\s*minutes?/i);
        if (minutesMatch) {
          totalMinutes += parseInt(minutesMatch[1], 10);
        }
        
        if (totalMinutes > 0) return totalMinutes;
      }
      
      // If all else fails, return default
      return 30;
    }

    console.log("Generated recipe:", recipe)
    console.log("Generated recipe ID:", recipe.id)
    return NextResponse.json({ recipe })
  } catch (error) {
    console.error("Error in Groq API route:", error)

    // Extract ingredients and filters from request for fallback
    try {
      const body = await request.json()
      const { ingredients, filters } = body
      const userLanguage = request.headers.get("accept-language")?.split(",")[0] || "en"
      const mockRecipe = await createMockRecipeWithImage(ingredients, filters, userLanguage)
      return NextResponse.json({ recipe: mockRecipe })
    } catch {
      // If we can't even parse the request, return a generic error
      return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 })
    }
  }
}

function buildNaturalLanguagePrompt(ingredients: string, filters: RecipeFilters): string {
  let prompt = `Create a delicious recipe using the following ingredients: ${ingredients}\n\n`

  const requirements: string[] = []

  if (filters.servings) {
    requirements.push(`Servings: ${filters.servings}`)
  }

  if (filters.dietary && filters.dietary.length > 0 && !filters.dietary.includes("any")) {
    requirements.push(`Dietary preferences: ${filters.dietary.join(", ")}`)
  }

  if (filters.cuisine && filters.cuisine.length > 0 && !filters.cuisine.includes("any")) {
    requirements.push(`Cuisine: ${filters.cuisine.join(", ")}`)
  }

  if (filters.spiceLevel && filters.spiceLevel.length > 0 && !filters.spiceLevel.includes("any")) {
    requirements.push(`Spice level: ${filters.spiceLevel.join(", ")}`)
  }

  if (filters.mealType && filters.mealType.length > 0 && !filters.mealType.includes("any")) {
    requirements.push(`Meal type: ${filters.mealType.join(", ")}`)
  }

  if (filters.cookTime && filters.cookTime.length > 0 && !filters.cookTime.includes("any")) {
    const timeMap = {
      quick: "under 30 minutes total time",
      medium: "30-60 minutes total time",
      long: "over 1 hour total time",
    }
    
    const cookTimes = filters.cookTime.map(time => {
      return timeMap[time as keyof typeof timeMap] || time
    })
    
    requirements.push(`Cooking time: ${cookTimes.join(" or ")}`)
  }

  if (filters.difficulty && filters.difficulty.length > 0 && !filters.difficulty.includes("any")) {
    requirements.push(`Difficulty level: ${filters.difficulty.join(", ")}`)
  }

  if (filters.healthProfile && filters.healthProfile.length > 0 && !filters.healthProfile.includes("any")) {
    requirements.push(`Health focus: ${filters.healthProfile.join(", ")}`)
  }

  if (requirements.length > 1) {
    prompt += `Additional Requirements: ${requirements.join(", ")}\n\n`
  }

  prompt += `INSTRUCTIONS:
- Understand the user's natural language request completely
- If they mentioned specific ingredients, use them as main components
- If they asked for a specific dish, make that dish authentically
- If they asked in another language, you can respond in that language or English
- Be very specific with ingredient quantities (use exact measurements)
- Include detailed cooking instructions with temperatures and timing
- Calculate accurate nutritional information
- Include relevant emojis in instructions for better visual appeal
- Make sure the recipe is practical and delicious
- Ensure all ingredients are listed with proper measurements

Return ONLY a JSON object with this exact structure (no additional text):
{
  "title": "Exact Recipe Name",
  "description": "Brief appetizing description of the dish",
  "ingredients": ["1 cup specific ingredient", "2 tbsp exact ingredient with measurement", "..."],
  "instructions": ["🔪 Step 1 with specific details and emoji", "🔥 Step 2 with temperature/timing and emoji", "..."],
  "prepTime": 15,
  "cookTime": 25,
  "difficulty": "${filters.difficulty?.length > 0 && !filters.difficulty.includes("any") ? filters.difficulty[0] : 'Medium'}",
  "cuisine": "${filters.cuisine?.length > 0 && !filters.cuisine.includes("any") ? filters.cuisine[0] : 'International'}",
  "dietary": [${filters.dietary?.length > 0 && !filters.dietary.includes("any") ? '"' + filters.dietary.join('", "') + '"' : ''}],
  "nutrition": {
    "calories": 350,
    "protein": 25,
    "carbs": 30,
    "fat": 12
  }
}`

  return prompt
}

async function generateAccurateRecipeImage(title: string, description?: string, cuisine?: string): Promise<string> {
  try {
    console.log("Generating accurate image for:", title)

    // Create a very detailed and specific prompt for accurate image generation
    const imagePrompt = `Create a high-quality, photorealistic image of "${title}". ${
      description ? `Description: ${description}.` : ""
    } ${cuisine ? `This is a ${cuisine} dish.` : ""} 

Requirements:
- Professional food photography style
- Beautifully plated and garnished
- Natural lighting, preferably daylight
- Clean, modern presentation
- Show the actual dish as it would be served
- Include appropriate garnishes and sides
- High resolution and sharp focus
- Appetizing and mouth-watering appearance
- Authentic to the cuisine style
- Restaurant-quality presentation

The image should look exactly like what someone would expect when ordering "${title}" at a high-end restaurant.`

    // Direct Gemini API call for image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: imagePrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
            responseModalities: ["TEXT", "IMAGE"],
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE",
            },
          ],
        }),
      },
    )

    if (response.ok) {
      const data = await response.json()

      // Check for inline data (base64 image)
      if (data.candidates && data.candidates[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.mimeType?.includes("image")) {
            const imageBase64 = part.inlineData.data
            const imageUrl = `data:${part.inlineData.mimeType};base64,${imageBase64}`
            console.log("Successfully generated accurate image with Gemini")
            return imageUrl
          }
        }
      }
    } else {
      const errorText = await response.text()
      console.error("Gemini API Error:", response.status, errorText)
    }

    console.warn("Gemini image generation failed, using curated fallback")
    return getCuratedFoodImage(title, cuisine)
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return getCuratedFoodImage(title, cuisine)
  }
}

function calculateAccurateNutrition(parsedRecipe: any, filters: RecipeFilters) {
  // Base nutrition calculation
  let baseCalories = 300
  let baseProtein = 15
  let baseCarbs = 35
  let baseFat = 12

  // Adjust based on dietary preferences
  if (filters.dietary?.length > 0) {
    const dietaryPrefs = filters.dietary;
    
    if (dietaryPrefs.includes("keto") || dietaryPrefs.includes("low-carb")) {
      baseCarbs = Math.max(5, baseCarbs * 0.2)
      baseFat = baseFat * 1.8
      baseCalories = baseCalories * 0.9
    } else if (dietaryPrefs.includes("high-protein")) {
      baseProtein = baseProtein * 1.8
      baseCalories = baseCalories * 1.1
    } else if (dietaryPrefs.includes("vegan") || dietaryPrefs.includes("vegetarian")) {
      baseProtein = baseProtein * 0.8
      baseCarbs = baseCarbs * 1.2
      baseFat = baseFat * 0.9
    } else if (dietaryPrefs.includes("low-calorie")) {
      baseCalories = baseCalories * 0.7
      baseFat = baseFat * 0.6
    }
  }

  // Adjust based on meal type
  if (filters.mealType?.length > 0) {
    const mealTypes = filters.mealType;
    
    if (mealTypes.includes("breakfast")) {
      baseCalories = baseCalories * 0.8
      baseCarbs = baseCarbs * 1.2
    } else if (mealTypes.includes("dinner")) {
      baseCalories = baseCalories * 1.2
      baseProtein = baseProtein * 1.3
    } else if (mealTypes.includes("snack")) {
      baseCalories = baseCalories * 0.5
      baseProtein = baseProtein * 0.6
      baseCarbs = baseCarbs * 0.7
    } else if (mealTypes.includes("dessert")) {
      baseCalories = baseCalories * 1.5
      baseCarbs = baseCarbs * 2
      baseFat = baseFat * 1.3
      baseProtein = baseProtein * 0.3
    }
  }

  // Use parsed nutrition if available, otherwise use calculated values
  return {
    calories: Math.round(parsedRecipe.nutrition?.calories || baseCalories),
    protein: Math.round(parsedRecipe.nutrition?.protein || baseProtein),
    carbs: Math.round(parsedRecipe.nutrition?.carbs || baseCarbs),
    fat: Math.round(parsedRecipe.nutrition?.fat || baseFat),
  }
}

function getCuratedFoodImage(title: string, cuisine?: string): string {
  const searchText = (title + " " + (cuisine || "")).toLowerCase()

  // Enhanced food image library with high-quality Unsplash images
  const foodImages = {
    // Specific dishes
    pasta: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800&h=600&fit=crop&crop=center",
    spaghetti: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800&h=600&fit=crop&crop=center",
    pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop&crop=center",
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&crop=center",
    biryani: "https://images.unsplash.com/photo-1563379091339-03246963d51a?w=800&h=600&fit=crop&crop=center",
    curry: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=600&fit=crop&crop=center",
    ramen: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop&crop=center",
    sushi: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&crop=center",
    tacos: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&crop=center",
    pancakes: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&h=600&fit=crop&crop=center",
    salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&crop=center",
    soup: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=600&fit=crop&crop=center",
    potato: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&h=600&fit=crop&crop=center",
    aloo: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&h=600&fit=crop&crop=center",

    // Proteins
    chicken: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&h=600&fit=crop&crop=center",
    beef: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop&crop=center",
    fish: "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=600&fit=crop&crop=center",
    salmon: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop&crop=center",

    // Cuisines
    italian: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&crop=center",
    mexican: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop&crop=center",
    chinese: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop&crop=center",
    indian: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=600&fit=crop&crop=center",
    thai: "https://images.unsplash.com/photo-1559847844-d721426d6edc?w=800&h=600&fit=crop&crop=center",
    japanese: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&h=600&fit=crop&crop=center",

    // Meal types
    breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&h=600&fit=crop&crop=center",
    lunch: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&crop=center",
    dinner: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&crop=center",
    dessert: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop&crop=center",
  }

  for (const [keyword, imageUrl] of Object.entries(foodImages)) {
    if (searchText.includes(keyword)) {
      return imageUrl
    }
  }

  // Default fallback image
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&crop=center"
}

function generateRecipeId(): string {
  return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function createMockRecipeWithImage(userInput: string, filters: RecipeFilters, language: string): Promise<Recipe> {
  const title = `Recipe for ${userInput}`
  const description = `A delicious recipe created just for you`

  // Generate image using Gemini
  const imageUrl = await generateAccurateRecipeImage(
    title, 
    description, 
    filters.cuisine?.length > 0 ? filters.cuisine[0] : undefined
  )

  return {
    id: generateRecipeId(),
    title,
    description,
    ingredients: ["Main ingredients as needed", "Seasonings to taste", "Cooking oil", "Fresh herbs for garnish"],
    instructions: [
      "🔪 Prepare all ingredients by washing and chopping",
      "🔥 Heat oil in a large pan over medium heat",
      "🥄 Add main ingredients and cook as needed",
      "🧂 Season with salt and pepper to taste",
      "🌿 Garnish with fresh herbs",
      "🍽️ Serve hot and enjoy!",
    ],
    prepTime: 15,
    cookTime: 30,
    servings: filters.servings || 2,
    difficulty: "Medium" as const,
    cuisine: filters.cuisine?.length > 0 ? filters.cuisine[0] : "International",
    dietary: filters.dietary?.length > 0 ? filters.dietary : [],
    image: imageUrl,
    nutrition: calculateAccurateNutrition({}, filters),
  }
}

async function createFallbackRecipeWithImage(
  userInput: string,
  filters: RecipeFilters,
  recipeText: string,
  language: string,
): Promise<Recipe> {
  const title = `Recipe for ${userInput}`

  // Generate image using Gemini
  const imageUrl = await generateAccurateRecipeImage(
    title, 
    "A delicious recipe", 
    filters.cuisine?.length > 0 ? filters.cuisine[0] : undefined
  )

  return {
    id: generateRecipeId(),
    title,
    description: "A delicious recipe created with your request",
    ingredients: ["Main ingredients as needed", "Seasonings to taste", "Cooking oil", "Fresh herbs"],
    instructions: [
      "🔪 Prepare all ingredients",
      "🔥 Cook according to your preference",
      "🧂 Season to taste",
      "🍽️ Serve and enjoy",
    ],
    prepTime: 15,
    cookTime: 30,
    servings: filters.servings || 2,
    difficulty: "Medium" as const,
    cuisine: filters.cuisine?.length > 0 ? filters.cuisine[0] : "International",
    dietary: filters.dietary?.length > 0 ? filters.dietary : [],
    image: imageUrl,
    nutrition: calculateAccurateNutrition({}, filters),
  }
}
