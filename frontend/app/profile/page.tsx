"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuthStore } from "@/store/authStore"
import { apiFetch } from "@/services/api"
import Navbar from "@/components/Navbar"
import { User, Phone, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react"

const profileSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { user, token, setAuth, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  })

  // Pre-fill user data when loaded
  useEffect(() => {
    if (user) {
      setValue("full_name", user.full_name)
      setValue("phone", user.phone || "")
    }
  }, [user, setValue])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  const onSubmit = async (data: ProfileFormValues) => {
    setSuccessMsg(null)
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      const updatedUser = await apiFetch<any>("/users/profile", {
        method: "PATCH",
        json: data,
      })

      if (token) {
        setAuth(updatedUser, token)
      }
      setSuccessMsg("Profile details updated successfully.")
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-12 max-w-2xl">
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Student Profile
          </h1>
          <p className="text-muted-foreground">Manage your personal information and contact details.</p>
        </div>

        <div className="glass-card rounded-3xl p-8 animate-fade-in-up">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-xl flex items-center space-x-3 animate-fade-in-up">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex items-center space-x-3 animate-fade-in-up">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address (Unchangeable)
              </label>
              <div className="relative opacity-60">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>

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
                <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phone Number
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center space-x-2 glow-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
