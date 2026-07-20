"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import { Sparkles, LayoutDashboard, FileUp, User, LogOut, Briefcase, Sun, Moon } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth, isAuthenticated } = useAuthStore()
  const [theme, setTheme] = useState<"light" | "dark">("dark")

  useEffect(() => {
    const currentTheme = document.documentElement.classList.contains("light") ? "light" : "dark"
    setTheme(currentTheme)
  }, [])

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
      localStorage.setItem("theme", "light")
      setTheme("light")
    } else {
      document.documentElement.classList.remove("light")
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
      setTheme("dark")
    }
  }

  const handleLogout = () => {
    clearAuth()
    router.push("/login")
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/recommendations", label: "AI Matches", icon: Sparkles },
    { href: "/upload", label: "Upload Resume", icon: FileUp },
    { href: "/profile", label: "Profile", icon: User },
  ]

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-white/10 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center space-x-2 font-outfit text-xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent">
            InternMatch AI
          </span>
        </Link>

        {isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-white glow-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>
        )}

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-300",
              theme === "dark"
                ? "bg-white/10 border-white/20 text-yellow-300 hover:bg-white/20"
                : "bg-slate-800 border-slate-600 text-yellow-400 hover:bg-slate-700"
            )}
          >
            {theme === "dark" ? (
              <><Sun className="w-4 h-4" /><span className="hidden sm:inline">Light</span></>
            ) : (
              <><Moon className="w-4 h-4" /><span className="hidden sm:inline">Dark</span></>
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <span className="hidden sm:inline text-sm text-muted-foreground">
                Hi, <span className="font-semibold text-white">{user?.full_name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-red-950/20 hover:border-red-900/50 hover:text-red-400 text-sm font-medium transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-white transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-full text-sm font-medium transition-all glow-primary"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
