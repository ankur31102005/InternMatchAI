"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { apiFetch } from "@/services/api"
import { toast } from "@/store/toastStore"

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

// Minimal typings for the Google Identity Services global.
declare global {
  interface Window {
    google?: any
  }
}

export function GoogleButton() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) return
      try {
        const res = await apiFetch<{ access_token: string }>("/auth/google", {
          method: "POST",
          json: { credential: response.credential },
        })
        const token = res.access_token
        const user = await apiFetch<any>("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        setAuth(user, token)
        toast.success("Signed in with Google", `Welcome, ${user.full_name}`)
        router.push("/dashboard")
      } catch (err: any) {
        toast.error("Google sign-in failed", err.message || "Please try again.")
      }
    },
    [router, setAuth]
  )

  useEffect(() => {
    if (!CLIENT_ID) return

    const render = () => {
      const el = containerRef.current
      if (!window.google || !el) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      })
      window.google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: el.offsetWidth || 320,
      })
    }

    const existing = document.getElementById("google-gsi-script")
    if (existing) {
      render()
      return
    }
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.id = "google-gsi-script"
    script.async = true
    script.defer = true
    script.onload = render
    document.body.appendChild(script)
  }, [handleCredential])

  if (!CLIENT_ID) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Google sign-in isn&apos;t configured yet.
      </p>
    )
  }

  return <div ref={containerRef} className="flex w-full justify-center" />
}
