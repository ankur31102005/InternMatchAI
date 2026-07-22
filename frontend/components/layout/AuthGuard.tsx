"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { FullPageSpinner } from "@/components/ui/Spinner"

/** Client-side guard for authenticated pages. Preserves existing auth flow. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return <FullPageSpinner label="Loading your workspace…" />
  }

  return <>{children}</>
}
