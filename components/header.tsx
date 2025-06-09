"use client"

import { useAuth } from "@/context/auth-context"
import ThemeToggle from "./theme-toggle"
import { ChefHat, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const { user } = useAuth()
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {isHomePage ? (
          <Link href="/" className="flex items-center space-x-2">
            <img src="/icon-192x192.png" alt="RecipeReady Logo" className="h-9 w-9" />
            <span className="font-bold text-xl">RecipeReady</span>
          </Link>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/" className="p-2 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-semibold text-lg">
              {pathname === "/favorites"
                ? "Favorites"
                : pathname === "/profile"
                  ? "Profile"
                  : pathname.startsWith("/recipe/")
                    ? "Recipe"
                    : "RecipeReady"}
            </h1>
          </div>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}