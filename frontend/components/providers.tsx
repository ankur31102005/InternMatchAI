"use client"

import { useState, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { apiFetch } from "@/services/api"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  const { setAuth, clearAuth, setLoading } = useAuthStore()

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark"
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    } else {
      document.documentElement.classList.remove("light")
      document.documentElement.classList.add("dark")
    }
  }, [])

  useEffect(() => {
    async function verifyUser() {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const user = await apiFetch<any>("/auth/me")
        setAuth(user, token)
      } catch (err) {
        console.error("Token verification failed:", err)
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    verifyUser()
  }, [setAuth, clearAuth, setLoading])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
