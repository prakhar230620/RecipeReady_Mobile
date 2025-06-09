"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Heart, User, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"

export default function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  console.log("User object in MobileNav:", user)

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Favorites",
      href: "/favorites",
      icon: Heart,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
    ...(user?.isAdmin
      ? [
          {
            name: "Admin",
            href: "/admin",
            icon: Mail,
          },
        ]
      : []),
  ]
  console.log("Final navItems array:", navItems)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t flex justify-around items-center h-16 no-print">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href === "/" && pathname.startsWith("/recipe/"))
        return (
          <Link key={item.name} href={item.href} className={cn("flex flex-col items-center justify-center w-full py-2", isActive && "text-primary")}>
            <item.icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-xs", isActive ? "font-medium text-primary" : "text-muted-foreground")}>
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}