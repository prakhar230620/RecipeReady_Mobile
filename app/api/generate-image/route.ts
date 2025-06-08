import { type NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAADeCP52o554AU2IrQFb9NeDruudFBYdM"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

export async function POST(request: NextRequest) {
  try {
    const { recipeTitle, description } = await request.json()

    if (!recipeTitle) {
      return NextResponse.json({ error: "Recipe title is required" }, { status: 400 })
    }

    // Create a prompt for Gemini to generate an image of the recipe
    const imagePrompt = `Generate a photorealistic, appetizing image of a dish titled: "${recipeTitle}". ${
      description ? `Description: ${description}.` : ""
    } Ensure it looks delicious and well-presented, with good lighting and styling.`

    try {
      // Call Gemini API for image generation
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
            responseMediaType: "image/png",
            responseFormat: "base64",
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Gemini API error: ${response.status} ${response.statusText}`, errorText)
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()

      // Extract the base64 image from the response
      if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts.length > 0) {
        const imagePart = data.candidates[0].content.parts.find((part: any) =>
          part.inlineData?.mimeType?.includes("image"),
        )

        if (imagePart && imagePart.inlineData) {
          const imageBase64 = imagePart.inlineData.data
          const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imageBase64}`
          return NextResponse.json({ imageUrl })
        }
      }

      // If we couldn't extract the image, fall back to Unsplash
      throw new Error("No image data in Gemini response")
    } catch (error) {
      console.error("Error generating image with Gemini:", error)

      // Fall back to Unsplash if Gemini fails
      const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY
      if (UNSPLASH_ACCESS_KEY) {
        try {
          const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(recipeTitle + " food dish")}&per_page=1&orientation=landscape`,
            {
              headers: {
                Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
              },
            },
          )

          if (response.ok) {
            const data = await response.json()
            if (data.results && data.results.length > 0) {
              return NextResponse.json({
                imageUrl: data.results[0].urls.regular,
                attribution: {
                  photographer: data.results[0].user.name,
                  photographerUrl: data.results[0].user.links.html,
                  unsplashUrl: data.results[0].links.html,
                },
              })
            }
          }
        } catch (unsplashError) {
          console.error("Error fetching from Unsplash:", unsplashError)
        }
      }
    }

    // Final fallback to a food placeholder
    return NextResponse.json({
      imageUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop&crop=center`,
    })
  } catch (error) {
    console.error("Error in image generation route:", error)
    return NextResponse.json({
      imageUrl: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop&crop=center`,
    })
  }
}
