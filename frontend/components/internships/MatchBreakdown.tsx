"use client"

import { motion } from "framer-motion"
import { BrainCircuit, Target, ShieldCheck } from "lucide-react"
import { matchPercent } from "@/lib/format"

interface MatchBreakdownProps {
  semantic?: number | null
  skill?: number | null
  eligibility?: number | null
  className?: string
}

/**
 * Explainable-AI (XAI) breakdown: shows the three transparent signals that
 * produce the overall match score, so users understand *why* a role matched.
 */
export function MatchBreakdown({
  semantic,
  skill,
  eligibility,
  className,
}: MatchBreakdownProps) {
  const rows = [
    {
      label: "Semantic fit",
      value: matchPercent(semantic),
      icon: BrainCircuit,
      bar: "bg-primary",
      hint: "How closely the role's meaning matches your resume",
    },
    {
      label: "Skill match",
      value: matchPercent(skill),
      icon: Target,
      bar: "bg-success",
      hint: "Overlap between your skills and the role's requirements",
    },
    {
      label: "Eligibility",
      value: matchPercent(eligibility),
      icon: ShieldCheck,
      bar: "bg-saffron",
      hint: "GPA and degree fit against the role's criteria",
    },
  ]

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Why this match
      </p>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span
                className="flex items-center gap-1.5 font-medium text-foreground"
                title={r.hint}
              >
                <r.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {r.label}
              </span>
              <span className="font-semibold text-foreground">{r.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full rounded-full ${r.bar}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${r.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
