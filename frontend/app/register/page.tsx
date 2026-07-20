"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { apiFetch } from "@/services/api"
import Navbar from "@/components/Navbar"
import { Sparkles, Mail, Lock, User, Phone, Loader2, ArrowRight } from "lucide-react"

const registerSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  phone: z.string().optional(),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null)
    setSuccessMsg(null)
    setIsSubmitting(true)

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        json: data,
      })

      setSuccessMsg("Registration successful! Redirecting to login page...")
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: any) {
      setServerError(err.message || "Registration failed. Try using a different email.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-600/10 blur-[80px] pointer-events-none -z-10" />

        <div className="w-full max-w-md glass-card rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="font-outfit text-3xl font-bold tracking-tight mb-2">Create Account</h1>
            <p className="text-muted-foreground text-sm">Join the AI PM Internship Scheme matches</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
                {serverError}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-xl">
                {successMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Priya Sharma"
                  {...register("full_name")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              {errors.full_name && (
                <p className="text-red-400 text-xs">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1">
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
                <p className="text-red-400 text-xs">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="+91-9876543210"
                  {...register("phone")}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
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
                <p className="text-red-400 text-xs">{errors.password.message}</p>
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
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
