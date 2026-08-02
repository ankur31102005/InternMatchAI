"use client"

import { useEffect, useState } from "react"
import { useTheme as useNextTheme } from "next-themes"

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggle = () => {
    const current = resolvedTheme || theme || "light"
    setTheme(current === "dark" ? "light" : "dark")
  }

  const currentTheme = (resolvedTheme || theme || "light") as "light" | "dark"

  return {
    theme: currentTheme,
    toggle,
    mounted,
    setTheme,
  }
}
