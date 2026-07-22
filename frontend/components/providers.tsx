"use client"

import { useState, useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { apiFetch } from "@/services/api"
import { Toaster } from "@/components/ui/Toaster"

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
      <Toaster />
    </QueryClientProvider>
  )
}
