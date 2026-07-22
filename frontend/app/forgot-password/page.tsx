"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Input, Label, FieldError } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"

const schema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
})
type Values = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = async () => {
    // No password-reset endpoint on the backend yet — simulate the UX.
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 900))
    setSubmitting(false)
    setSent(true)
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {sent ? (
        <div className="rounded-2xl border border-success/20 bg-success/10 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Check your inbox
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{getValues("email")}</span>,
            a password reset link is on its way.
          </p>
          <Button href="/login" variant="outline" className="mt-6">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full"
          >
            {!submitting && "Send reset link"}
          </Button>
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
