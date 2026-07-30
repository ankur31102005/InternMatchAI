"use client"

import { motion } from "framer-motion"
import { Avatar } from "@/components/ui/Avatar"
import { companyAccent } from "@/lib/format"
import { TOP_COMPANIES } from "@/lib/constants"

function Row({ reverse = false }: { reverse?: boolean }) {
  const items = [...TOP_COMPANIES, ...TOP_COMPANIES]
  return (
    <div className="flex overflow-hidden">
      <motion.div
        className="flex shrink-0 gap-4 pr-4"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      >
        {items.map((company, i) => (
          <div
            key={`${company}-${i}`}
            className="flex w-max items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-soft"
          >
            <Avatar name={company} size={34} color={companyAccent(company)} />
            <span className="whitespace-nowrap text-sm font-medium text-foreground">
              {company}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export function CompanyMarquee() {
  return (
    <div className="relative space-y-4">
      {/* Soft fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent" />
      <Row />
      <Row reverse />
    </div>
  )
}
