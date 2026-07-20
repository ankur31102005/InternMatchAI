"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuthStore } from "@/store/authStore"
import { apiFetch } from "@/services/api"
import Navbar from "@/components/Navbar"
import { Sparkles, Mail, Lock, Loader2, ArrowRight } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null)
    setIsSubmitting(true)

    try {
      // 1. Authenticate login API
      const res = await apiFetch<{ access_token: string }>("/auth/login", {
        method: "POST",
        json: data,
      })

      // 2. Fetch current profile data
      const token = res.access_token
      const user = await apiFetch<any>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      // 3. Save auth details inside store
      setAuth(user, token)
      router.push("/dashboard")
    } catch (err: any) {
      setServerError(err.message || "Invalid credentials. Please check and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/10 blur-[80px] pointer-events-none -z-10" />

        <div className="w-full max-w-md glass-card rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="font-outfit text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">Sign in to find your perfect internship match</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="name@university.edu"
                  {...register("email")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center space-x-2 glow-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-violet-400 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
