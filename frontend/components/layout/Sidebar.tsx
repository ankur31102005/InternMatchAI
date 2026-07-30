"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Sparkles,
  Briefcase,
  FileText,
  User,
  UploadCloud,
  Shield,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/internships", label: "Browse Internships", icon: Briefcase },
  { href: "/recommendations", label: "AI Matches", icon: Sparkles },
  { href: "/applications", label: "My Applications", icon: FileText },
  { href: "/upload", label: "Upload Resume", icon: UploadCloud },
  { href: "/profile", label: "Profile", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const navItems = user?.is_admin
    ? [...items, { href: "/admin", label: "Admin Panel", icon: Shield }]
    : items

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <nav className="sticky top-24 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
