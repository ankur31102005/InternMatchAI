"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Mail, User, Phone, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"
import { apiFetch } from "@/services/api"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { GoogleButton } from "@/components/auth/GoogleButton"
import { PasswordInput } from "@/components/auth/PasswordInput"
import { Input, Label, FieldError } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { toast } from "@/store/toastStore"

const registerSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Include at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Include at least one number" }),
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
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const passwordValue = watch("password") || ""
  const checks = [
    { label: "8+ characters", ok: passwordValue.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(passwordValue) },
    { label: "A number", ok: /[0-9]/.test(passwordValue) },
  ]

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null)
    setSuccessMsg(null)
    setIsSubmitting(true)
    try {
      await apiFetch("/auth/register", { method: "POST", json: data })
      setSuccessMsg("Account created! Redirecting to sign in…")
      toast.success("Account created", "You can now sign in.")
      setTimeout(() => router.push("/login"), 1800)
    } catch (err: any) {
      setServerError(err.message || "Registration failed. Try a different email.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start matching with government & PSU internships in minutes."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-success/20 bg-success/10 p-3.5 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            icon={User}
            placeholder="Priya Sharma"
            error={!!errors.full_name}
            {...register("full_name")}
          />
          <FieldError>{errors.full_name?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            icon={Mail}
            placeholder="name@university.edu"
            error={!!errors.email}
            {...register("email")}
          />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="phone">Phone number (optional)</Label>
          <Input
            id="phone"
            icon={Phone}
            placeholder="+91 98765 43210"
            {...register("phone")}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            error={!!errors.password}
            {...register("password")}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {checks.map((c) => (
              <span
                key={c.label}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.ok
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                {c.label}
              </span>
            ))}
          </div>
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="w-full"
        >
          {!isSubmitting && (
            <>
              Create account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          or sign up with
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
