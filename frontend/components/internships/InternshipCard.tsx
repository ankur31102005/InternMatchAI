"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Clock, Wallet, Building2, ArrowRight, Sparkles, Bookmark, BookmarkCheck } from "lucide-react"
import type { Internship } from "@/types"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/ui/Avatar"
import { formatStipend, companyAccent } from "@/lib/format"
import { useSavedInternships } from "@/lib/useSavedInternships"
import { cn } from "@/lib/utils"

interface InternshipCardProps {
  internship: Internship
  matchPercent?: number
  index?: number
}

export function InternshipCard({
  internship,
  matchPercent,
  index = 0,
}: InternshipCardProps) {
  const accent = companyAccent(internship.company)
  const { isSaved, toggleSave } = useSavedInternships()
  const saved = isSaved(internship.id)

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={internship.company} size={44} color={accent} />
          <div className="min-w-0">
            <h3 className="truncate font-heading text-base font-semibold leading-tight text-foreground">
              {internship.title}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {internship.company}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {typeof matchPercent === "number" && (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
              <Sparkles className="h-3 w-3" />
              {matchPercent}%
            </span>
          )}
          <button
            type="button"
            onClick={(e) => toggleSave(internship.id, e)}
            aria-label={saved ? "Remove bookmark" : "Bookmark internship"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl border transition-colors",
              saved
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-input bg-surface text-muted-foreground hover:border-primary hover:text-primary"
            )}
          >
            {saved ? (
              <BookmarkCheck className="h-4 w-4 fill-primary/20" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {internship.description}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {internship.is_pm_scheme && <Badge variant="success">PM Scheme</Badge>}
        {internship.sector && <Badge variant="neutral">{internship.sector}</Badge>}
        {internship.is_remote && <Badge variant="saffron">Remote</Badge>}
      </div>

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            {internship.is_remote ? "Remote" : internship.location || "India"}
          </span>
          {internship.duration_weeks != null && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              {internship.duration_weeks} weeks
            </span>
          )}
          <span className="col-span-2 flex items-center gap-1.5 font-medium text-foreground">
            <Wallet className="h-4 w-4 text-success" />
            {formatStipend(internship.stipend_amount, internship.stipend_currency)}
          </span>
        </div>

        <Link
          href={`/internships/${internship.id}`}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          View details
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.article>
  )
}
