import { type NextRequest, NextResponse } from "next/server"

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    if (!UNSPLASH_ACCESS_KEY) {
      // Return a placeholder if no API key is configured
      return NextResponse.json({
        imageUrl: `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(query)}`,
      })
    }

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + " food recipe")}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch from Unsplash")
    }

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

    // Fallback to placeholder if no image found
    return NextResponse.json({
      imageUrl: `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(query)}`,
    })
  } catch (error) {
    console.error("Error fetching image:", error)
    return NextResponse.json({
      imageUrl: `/placeholder.svg?height=300&width=400&text=Recipe`,
    })
  }
}
