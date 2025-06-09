"use client"

import React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home as HomeIcon, Heart as HeartIcon, User as UserIcon, Mail as MailIcon } from "lucide-react"
import { cn } from "../lib/utils"
import { useAuth } from "../context/auth-context"
import { setCookie } from "cookies-next"

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = user?.isAdmin

  // Define the type for route items
  type RouteItem = {
    href: string;
    label: string;
    active: boolean;
    icon: React.ComponentType<any>;
    onClick?: () => void;
  };

  const routes: RouteItem[] = [
    {
      href: "/",
      label: "Home",
      active: pathname === "/",
      icon: HomeIcon,
    },
    {
      href: "/favorites",
      label: "Favorites",
      active: pathname === "/favorites",
      icon: HeartIcon,
    },
    {
      href: "/profile",
      label: "Profile",
      active: pathname === "/profile",
      icon: UserIcon,
    },
  ]

  // Add admin route if user is admin
  if (isAdmin) {
    routes.push({
      // Direct link to admin page without query parameters
      href: "/admin",
      label: "Admin",
      active: pathname === "/admin",
      icon: MailIcon
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t flex justify-around items-center h-16 no-print">
      {routes.map((item) => {
        const isActive = pathname === item.href || (item.href === "/" && pathname.startsWith("/recipe/"))
        return (
          <Link 
            key={item.label} 
            href={item.href} 
            onClick={item.onClick} 
            className={cn("flex flex-col items-center justify-center w-full py-2", isActive && "text-primary")}
          >
            <item.icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-xs", isActive ? "font-medium text-primary" : "text-muted-foreground")}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}