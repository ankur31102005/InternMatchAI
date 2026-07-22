"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { GraduationCap, ShieldCheck, BrainCircuit, Target } from "lucide-react"

const highlights = [
  { icon: BrainCircuit, text: "AI extracts skills from your resume automatically" },
  { icon: Target, text: "See matched & missing skills for every role" },
  { icon: ShieldCheck, text: "Eligibility verified against official criteria" },
]

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="tricolor-bar absolute inset-x-0 top-0 h-1.5" />
        <div className="grid-backdrop absolute inset-0 opacity-30" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
            <GraduationCap className="h-6 w-6" />
          </span>
          <span className="font-heading text-xl font-bold text-white">
            InternMatch AI
          </span>
        </Link>

        <div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md font-heading text-3xl font-bold leading-tight text-white"
          >
            Your career, matched by intelligence.
          </motion.h2>
          <p className="mt-4 max-w-md text-white/70">
            Join thousands of students discovering government and PSU internships
            tailored to their skills.
          </p>
          <ul className="mt-8 space-y-4">
            {highlights.map((h, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3 text-white/90"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <h.icon className="h-4 w-4" />
                </span>
                <span className="text-sm">{h.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} InternMatch AI
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2.5 lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-heading text-lg font-bold text-foreground">
              InternMatch<span className="text-primary"> AI</span>
            </span>
          </Link>

          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
