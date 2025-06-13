import { type NextRequest, NextResponse } from "next/server"
import type { Recipe, RecipeFilters } from "@/lib/types"
import { getGroqApiKey, markKeyAsRateLimited, getAllGroqApiKeys } from "@/lib/groq-api-keys"
import { getGeminiApiKey, markGeminiKeyAsRateLimited } from "@/lib/gemini-api-keys"

export const dynamic = 'force-dynamic'

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

export async function POST(request: NextRequest) {
  try {
    const { ingredients, filters } = await request.json()

    if (!ingredients) {
      return NextResponse.json({ error: "Please tell me what you want to cook!" }, { status: 400 })
    }

    // Get user's selected language
    const userLanguage = request.headers.get("accept-language")?.split(",")[0] || "en"
    
    // Get the next available API key from the rotation system
    const currentApiKey = getGroqApiKey()
    
    // Check if we have a valid API key
    if (!currentApiKey || currentApiKey.trim() === '') {
      console.error("No valid Groq API key available. Falling back to mock recipe.")
      const mockRecipe = await createMockRecipeWithImage(ingredients, filters, userLanguage)
      return NextResponse.json({ recipe: mockRecipe })
    }

    console.log(`Making API call with ingredients: ${ingredients} and key: ${currentApiKey.substring(0, 10)}...`)
    const prompt = buildNaturalLanguagePrompt(ingredients, filters)

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are a world-class chef and nutritionist who understands cooking in all languages and cultures. You create authentic, detailed recipes with accurate nutritional information. You understand natural language requests and can interpret what users want even from casual conversation. Always respond with valid JSON format only, no additional text. Be very specific about ingredients and cooking methods. Calculate accurate nutritional values based on ingredients and portions.

IMPORTANT RULES:
1. ONLY use the ingredients provided by the user - do not add any additional ingredients that weren't mentioned exept some home spices and common ingredients(e.g. salt, pepper, olive oil, etc.)
2. If the user specifies a recipe name or describes a dish in natural language, create that exact dish
3. Include relevant emojis for each ingredient in the ingredients list(e.g. tomato 🍅, potato 🥔, onion 🧅, carrot 🥕, garlic 🧄, mushroom 🍄, egg 🥚, rice 🍚 etc.)
4. Include emojis for cooking instruments and flow in the instructions(e.g. 🔪, 🍲, 🍴, etc.)
5. Calculate accurate nutritional information based on the exact ingredients and portions
6. Provide extremely detailed ingredient list with exact measurements (e.g. "2 medium ripe tomatoes 🍅 (about 200g)", "3 cloves of fresh garlic 🧄 (15g)") and comprehensive step-by-step cooking instructions including precise temperatures (e.g. "preheat oven to 180°C/350°F"), timing (e.g. "sauté for exactly 5-7 minutes until golden brown"), and visual cues for doneness. Each step should be numbered and include detailed guidance on technique, temperature, timing and visual indicators. At the end of cooking, provide a cheerful completion message like "🎉 Congratulations! Your delicious [recipe name] is ready to enjoy! The aroma is amazing and it looks perfect. Time to dig in and savor your homemade creation! Bon appétit! 🍽️"
7. Strictly adhere to any dietary restrictions or preferences mentioned
8. If the user provides specific customization options (meal type, cuisine, etc.), follow them exactly`,

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
        console.error(`Request body:`, JSON.stringify({
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
        }))
        
        // Mark the current key as rate limited if we get a 429 error
        if (response.status === 429) {
          console.warn(`API key rate limited: ${currentApiKey.substring(0, 10)}...`)
          markKeyAsRateLimited(currentApiKey)
        } else if (response.status === 401) {
          // Mark the key as rate limited if it's unauthorized (invalid key)
          console.warn(`API key unauthorized (invalid): ${currentApiKey.substring(0, 10)}...`)
          markKeyAsRateLimited(currentApiKey)
        }

        throw new Error(`API call failed with status ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      const recipeText = data.choices?.[0]?.message?.content

      if (!recipeText) {
        console.error("No recipe content received from Groq API")
        throw new Error("Empty response from API")
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
        // Try to parse the JSON, handling potential errors
        let parsedRecipe;
        try {
          parsedRecipe = JSON.parse(cleanedText);
          console.log("Successfully parsed recipe JSON");
        } catch (jsonError) {
          console.error("Initial JSON parse error:", jsonError);
          
          // Try to fix common JSON formatting issues
          const fixedJson = cleanedText
            .replace(/\'|\'/g, '"') // Replace single quotes with double quotes
            .replace(/\,\s*\}/g, '}') // Remove trailing commas in objects
            .replace(/\,\s*\]/g, ']'); // Remove trailing commas in arrays
            
          try {
            parsedRecipe = JSON.parse(fixedJson);
            console.log("Successfully parsed recipe JSON after fixing format");
          } catch (fixedJsonError) {
            console.error("Failed to parse even after fixing format:", fixedJsonError);
            throw fixedJsonError;
          }
        }

        // Generate accurate image for the recipe using Gemini
        const imageUrl = await generateAccurateRecipeImage(
          parsedRecipe.title || `Recipe for ${ingredients}`,
          parsedRecipe.description || `A delicious recipe with ${ingredients}`,
          parsedRecipe.cuisine || (filters.cuisine?.length > 0 ? filters.cuisine[0] : "International"),
        )

        recipe = {
          id: generateRecipeId(),
          title: parsedRecipe.title || `Recipe for ${ingredients}`,
          description: parsedRecipe.description || `A delicious recipe created just for you`,
          ingredients: Array.isArray(parsedRecipe.ingredients) ? parsedRecipe.ingredients : [],
          instructions: Array.isArray(parsedRecipe.instructions) ? parsedRecipe.instructions : [],
          prepTime: Number(parsedRecipe.prepTime) || 15,
          cookTime: typeof parsedRecipe.cookTime === 'number' ? parsedRecipe.cookTime : 30,
          servings: filters.servings || 2,
          difficulty: ["Easy", "Medium", "Hard"].includes(parsedRecipe.difficulty) ? parsedRecipe.difficulty : "Medium",
          cuisine: parsedRecipe.cuisine || (filters.cuisine?.length > 0 ? filters.cuisine[0] : "International"),
          dietary: Array.isArray(parsedRecipe.dietary) ? parsedRecipe.dietary : (filters.dietary?.length > 0 ? filters.dietary : []),
          image: imageUrl,
          nutrition: calculateAccurateNutrition(parsedRecipe, filters),
        }

        // Validate that we have essential data
        if (!recipe.ingredients.length || !recipe.instructions.length) {
          console.error("Recipe validation failed: missing ingredients or instructions");
          throw new Error("Incomplete recipe data")
        }
        
        console.log("Successfully created recipe object with all required fields");
        return NextResponse.json({ recipe })
      } catch (parseError) {
        console.error("Failed to parse recipe JSON:", parseError)
        console.error("Raw response:", recipeText)
        // Fallback: create a basic recipe structure
        const fallbackRecipe = await createFallbackRecipeWithImage(ingredients, filters, recipeText, userLanguage)
        return NextResponse.json({ recipe: fallbackRecipe })
      }
    } catch (apiError) {
      console.error("API call error:", apiError)
      
      // Try with all available API keys before falling back to mock recipe
      console.log("Attempting to retry with different API keys...")
      const allKeys = getAllGroqApiKeys();
      
      for (const apiKey of allKeys) {
        if (apiKey === currentApiKey || !apiKey || apiKey.trim() === '') continue; // Skip keys we already tried or empty keys
        
        console.log(`Trying with another API key: ${apiKey.substring(0, 10)}...`)
        try {
          const retryResponse = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "system",
                  content: `You are a world-class chef and nutritionist who understands cooking in all languages and cultures. You create authentic, detailed recipes with accurate nutritional information. You understand natural language requests and can interpret what users want even from casual conversation. Always respond with valid JSON format only, no additional text. Be very specific about ingredients and cooking methods. Calculate accurate nutritional values based on ingredients and portions.

IMPORTANT RULES:
1. ONLY use the ingredients provided by the user - do not add any additional ingredients that weren't mentioned
2. If the user specifies a recipe name or describes a dish in natural language, create that exact dish
3. Respond in the same language the user used for their request
4. Include relevant emojis for each ingredient in the ingredients list
5. Include emojis for cooking instruments and flow in the instructions
6. Calculate accurate nutritional information based on the exact ingredients and portions
7. Provide detailed, step-by-step instructions with precise measurements, temperatures, and timing
8. Strictly adhere to any dietary restrictions or preferences mentioned
9. If the user provides specific customization options (meal type, cuisine, etc.), follow them exactly`,
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
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            const retryRecipeText = retryData.choices?.[0]?.message?.content;
            
            if (retryRecipeText) {
              // Process the successful retry response
              let cleanedText = retryRecipeText.trim();
              if (cleanedText.includes("```json")) {
                cleanedText = cleanedText.split("```json")[1].split("```")[0].trim();
              } else if (cleanedText.includes("```")) {
                cleanedText = cleanedText.split("```")[1].split("```")[0].trim();
              }
              
              try {
                const recipe = JSON.parse(cleanedText);
                recipe.id = generateRecipeId();
                
                // Generate accurate image for the recipe
                const imageUrl = await generateAccurateRecipeImage(
                  recipe.title,
                  recipe.description,
                  recipe.cuisine,
                );
                
                const fullRecipe = {
                  ...recipe,
                  image: imageUrl,
                  nutrition: calculateAccurateNutrition(recipe, filters),
                };
                
                if (!fullRecipe.ingredients.length || !fullRecipe.instructions.length) {
                  throw new Error("Incomplete recipe data");
                }
                
                console.log("Generated recipe with retry:", fullRecipe);
                return NextResponse.json({ recipe: fullRecipe });
              } catch (parseError) {
                console.error("Failed to parse recipe JSON from retry:", parseError);
              }
            }
          } else if (retryResponse.status === 429 || retryResponse.status === 401) {
            // Mark this key as rate limited
            markKeyAsRateLimited(apiKey);
          }
        } catch (retryError) {
          console.error(`Error with retry using key ${apiKey.substring(0, 10)}...`, retryError);
        }
      }
      
      // Return mock recipe as fallback if all retries failed
      console.log("All API calls failed, using mock recipe");
      const mockRecipe = await createMockRecipeWithImage(ingredients, filters, userLanguage)
      return NextResponse.json({ recipe: mockRecipe })
    }
  } catch (error) {
    console.error("Error in Groq API route:", error)

    // Extract ingredients and filters from request for fallback
    try {
      const body = await request.json()
      const { ingredients, filters } = body
      const userLanguage = request.headers.get("accept-language")?.split(",")[0] || "en"
      console.log("Creating mock recipe after error")
      const mockRecipe = await createMockRecipeWithImage(ingredients, filters, userLanguage)
      return NextResponse.json({ recipe: mockRecipe })
    } catch (fallbackError) {
      // If we can't even parse the request, return a generic error
      console.error("Failed to create fallback recipe:", fallbackError)
      return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 })
    }
  }
}

function buildNaturalLanguagePrompt(ingredients: string, filters: RecipeFilters): string {
  let prompt = `Create a delicious recipe using ONLY these ingredients: ${ingredients}\n\n`

  const requirements: string[] = []

  if (filters.servings) {
    requirements.push(`Servings: ${filters.servings}`)
  }

  if (filters.dietary && filters.dietary.length > 0 && !filters.dietary.includes("any")) {
    requirements.push(`Dietary preferences: ${filters.dietary.join(", ")}. STRICTLY follow these dietary restrictions.`)
  }

  if (filters.cuisine && filters.cuisine.length > 0 && !filters.cuisine.includes("any")) {
    requirements.push(`Cuisine: ${filters.cuisine.join(", ")}. Make an authentic dish from this cuisine.`)
  }

  if (filters.spiceLevel && filters.spiceLevel.length > 0 && !filters.spiceLevel.includes("any")) {
    requirements.push(`Spice level: ${filters.spiceLevel.join(", ")}. Adjust spiciness accordingly.`)
  }

  if (filters.mealType && filters.mealType.length > 0 && !filters.mealType.includes("any")) {
    requirements.push(`Meal type: ${filters.mealType.join(", ")}. Create a recipe appropriate for this meal.`)
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
    
    requirements.push(`Cooking time: ${cookTimes.join(" or ")}. Ensure the recipe can be completed within this timeframe.`)
  }

  if (filters.difficulty && filters.difficulty.length > 0 && !filters.difficulty.includes("any")) {
    requirements.push(`Difficulty level: ${filters.difficulty.join(", ")}. Adjust complexity accordingly.`)
  }

  if (filters.healthProfile && filters.healthProfile.length > 0 && !filters.healthProfile.includes("any")) {
    requirements.push(`Health focus: ${filters.healthProfile.join(", ")}. Optimize recipe for these health goals.`)
  }

  if (requirements.length > 0) {
    prompt += `IMPORTANT REQUIREMENTS (MUST FOLLOW):\n- ${requirements.join("\n- ")}\n\n`
  }

  prompt += `INSTRUCTIONS:\n- Understand my request completely - I may be asking for a specific dish or providing ingredients for you to create something with
- ONLY use the ingredients I've listed - do not add any additional ingredients
- If I mentioned a specific dish name, make that dish authentically
- If I asked in another language, respond in that same language
- Be very specific with ingredient quantities (use exact measurements)
- Include detailed cooking instructions with temperatures and timing
- Calculate accurate nutritional information based on the exact ingredients and portions
- Add relevant emojis for each ingredient in the ingredients list (e.g., 🍎 Apple, 🧅 Onion)
- Add emojis for cooking instruments and flow in the instructions (e.g., 🔪 for cutting, 🍳 for frying)
- Make sure the recipe is practical and delicious
- Ensure all ingredients are listed with proper measurements

Return ONLY a JSON object with this exact structure (no additional text):
{
  "title": "Exact Recipe Name",
  "description": "Brief appetizing description of the dish",
  "ingredients": ["🍎 1 cup specific ingredient", "🧅 2 tbsp exact ingredient with measurement", "..."],
  "instructions": ["🔪 Step 1 with specific details and emoji", "🍳 Step 2 with temperature/timing and emoji", "..."],
  "prepTime": 15,
  "cookTime": 25,
  "difficulty": "${(filters.difficulty && filters.difficulty.length > 0 && !filters.difficulty.includes("any")) ? filters.difficulty[0] : 'Medium'}",
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

    // Get an available Gemini API key from the rotation system
    const geminiApiKey = getGeminiApiKey()
    
    // Direct Gemini API call for image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${geminiApiKey}`,
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
      
      // Mark the key as rate limited if we get a 429 Too Many Requests error
      if (response.status === 429) {
        markGeminiKeyAsRateLimited(geminiApiKey)
      }
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
    ingredients: [
      "🥘 Main ingredients as needed", 
      "🧂 Seasonings to taste", 
      "🫒 Cooking oil", 
      "🌿 Fresh herbs for garnish"
    ],
    instructions: [
      "🔪 Prepare all ingredients by washing and chopping",
      "🍳 Heat oil in a large pan over medium heat",
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
    ingredients: [
      "🥘 Main ingredients as needed", 
      "🧂 Seasonings to taste", 
      "🫒 Cooking oil", 
      "🌿 Fresh herbs for garnish"
    ],
    instructions: [
      "🔪 Prepare all ingredients by washing and chopping",
      "🍳 Heat oil in a pan over medium heat",
      "🥄 Add ingredients in the correct order",
      "🧂 Season with salt, pepper, and spices to taste",
      "⏲️ Cook until done, monitoring temperature and time",
      "🌿 Garnish with fresh herbs if desired",
      "🍽️ Serve and enjoy your meal!",
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
