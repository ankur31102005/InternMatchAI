"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  FileText,
  User,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (pathname: string) =>
      pathname === "/dashboard" || pathname === "/",
  },
  {
    label: "Internships",
    href: "/internships",
    icon: Briefcase,
    isActive: (pathname: string) => pathname.startsWith("/internships"),
  },
  {
    label: "Saved",
    href: "/saved",
    icon: Bookmark,
    isActive: (pathname: string) => pathname.startsWith("/saved"),
  },
  {
    label: "Applications",
    href: "/applications",
    icon: FileText,
    isActive: (pathname: string) => pathname.startsWith("/applications"),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
    isActive: (pathname: string) => pathname.startsWith("/profile"),
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()

  // Hide mobile nav when unauthenticated or on auth/onboarding pages
  if (
    !isAuthenticated ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/onboarding")
  ) {
    return null
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 block border-t border-border bg-card/95 backdrop-blur-md md:hidden"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const active = item.isActive(pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-1 transition-colors min-h-[44px]",
                active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110 transition-transform")} />
              <span className="mt-1 text-[11px] leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
