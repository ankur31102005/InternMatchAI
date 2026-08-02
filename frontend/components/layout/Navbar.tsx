"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Briefcase,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  GraduationCap,
  Shield,
  Home,
  Bookmark,
} from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { useTheme } from "@/lib/useTheme"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { NotificationDropdown } from "@/components/layout/NotificationDropdown"
import { cn } from "@/lib/utils"

const publicLinks = [
  { href: "/internships", label: "Internships" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#companies", label: "Organisations" },
  { href: "/#faq", label: "FAQ" },
]

const authedLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/internships", label: "Internships", icon: Briefcase },
  { href: "/recommendations", label: "AI Matches", icon: Sparkles },
  { href: "/applications", label: "Applications", icon: FileText },
  { href: "/saved", label: "Saved", icon: Bookmark },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth, isAuthenticated } = useAuthStore()
  const { theme, toggle, mounted } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    setMobileOpen(false)
    router.push("/login")
  }

  const links = isAuthenticated
    ? user?.is_admin
      ? [...authedLinks, { href: "/admin", label: "Admin", icon: Shield }]
      : authedLinks
    : publicLinks

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="tricolor-bar h-1 w-full" />
      <div className="border-b border-border bg-surface/85 backdrop-blur-md">
        <nav className="container-page flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight text-foreground">
              InternMatch<span className="text-primary"> AI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-surface text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <NotificationDropdown isAuthenticated={isAuthenticated} />

            {isAuthenticated ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl border border-input bg-surface py-1.5 pl-1.5 pr-3 transition-colors hover:border-primary"
                >
                  <Avatar name={user?.full_name} size={30} />
                  <span className="max-w-[120px] truncate text-sm font-medium text-foreground">
                    {user?.full_name?.split(" ")[0]}
                  </span>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Button href="/login" variant="ghost" size="sm">
                  Sign in
                </Button>
                <Button href="/register" variant="primary" size="sm">
                  Register
                </Button>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-surface text-foreground md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border bg-surface md:hidden"
          >
            <div className="container-page flex flex-col gap-1 py-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                {isAuthenticated ? (
                  <>
                    <Button href="/profile" variant="outline" size="md">
                      <User className="h-4 w-4" /> My Profile
                    </Button>
                    <Button variant="ghost" size="md" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" /> Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button href="/login" variant="outline" size="md">
                      Sign in
                    </Button>
                    <Button href="/register" variant="primary" size="md">
                      Register
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
