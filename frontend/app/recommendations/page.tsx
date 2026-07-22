"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Sparkles,
  Check,
  TrendingUp,
  Building2,
  ArrowRight,
  CheckCircle2,
  UploadCloud,
  Lightbulb,
  Target,
} from "lucide-react"
import type { RecommendationListResponse } from "@/types"
import { apiFetch } from "@/services/api"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { ProgressRing } from "@/components/ui/ProgressRing"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { CardSkeleton } from "@/components/ui/Skeleton"
import {
  matchPercent,
  parseSkillList,
  companyAccent,
  formatStipend,
} from "@/lib/format"
import { toast } from "@/store/toastStore"

export default function RecommendationsPage() {
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({})

  const { data, isLoading, isError } = useQuery<RecommendationListResponse>({
    queryKey: ["recommendations"],
    queryFn: () => apiFetch<RecommendationListResponse>("/recommendations/"),
  })

  const items = useMemo(() => data?.items ?? [], [data])

  const summary = useMemo(() => {
    if (items.length === 0)
      return { avg: 0, topSkills: [] as string[], gaps: [] as string[] }
    const avg = Math.round(
      items.reduce((sum, r) => sum + matchPercent(r.match_score), 0) / items.length
    )
    const gapCounts = new Map<string, number>()
    items.forEach((r) =>
      parseSkillList(r.missing_skills).forEach((s) =>
        gapCounts.set(s, (gapCounts.get(s) ?? 0) + 1)
      )
    )
    const matchedSet = new Set<string>()
    items.forEach((r) =>
      parseSkillList(r.matched_skills).forEach((s) => matchedSet.add(s))
    )
    const gaps = [...gapCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([s]) => s)
    return { avg, topSkills: [...matchedSet].slice(0, 8), gaps }
  }, [items])

  const handleApply = async (internshipId: string) => {
    setApplyingId(internshipId)
    try {
      await apiFetch("/applications/", {
        method: "POST",
        json: {
          internship_id: internshipId,
          cover_letter: "Applying via InternMatch AI Recommendations.",
        },
      })
      setAppliedIds((prev) => ({ ...prev, [internshipId]: true }))
      toast.success("Application submitted", "Track it under My Applications.")
    } catch (err: any) {
      toast.error("Couldn't apply", err.message || "Please try again.")
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" /> AI recommendation engine
        </span>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Your personalised matches
        </h1>
        <p className="mt-2 text-muted-foreground">
          Internships ranked by how well they fit the skills in your resume.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={UploadCloud}
          title="No recommendations yet"
          description="Upload your resume so our AI can analyse your skills and rank matching internships."
          action={
            <Button href="/upload" variant="primary">
              <UploadCloud className="h-4 w-4" /> Upload resume
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Let's find your matches"
          description="Upload your resume to generate AI-ranked internship recommendations tailored to you."
          action={
            <Button href="/upload" variant="primary">
              <UploadCloud className="h-4 w-4" /> Upload resume
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-6 shadow-card">
              <ProgressRing value={summary.avg} label="Avg fit" size={104} />
              <div>
                <p className="font-heading text-lg font-semibold text-foreground">
                  {items.length} strong matches
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Based on your uploaded resume and skill profile.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Target className="h-4 w-4 text-success" /> Your strengths
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {summary.topSkills.length ? (
                  summary.topSkills.map((s) => (
                    <Badge key={s} variant="success">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Skills will appear here after processing.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Lightbulb className="h-4 w-4 text-brand-saffron-dark" /> Skills to
                build
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {summary.gaps.length ? (
                  summary.gaps.map((s) => (
                    <Badge key={s} variant="saffron">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You&apos;re a great fit across the board!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Recommendation list */}
          <div className="space-y-5">
            {items.map((rec, idx) => {
              const matched = parseSkillList(rec.matched_skills)
              const missing = parseSkillList(rec.missing_skills)
              const pct = matchPercent(rec.match_score)
              const it = rec.internship
              const isApplied = appliedIds[rec.internship_id]

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                  className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-card md:flex-row"
                >
                  {/* Score */}
                  <div className="flex shrink-0 flex-row items-center gap-4 md:w-40 md:flex-col md:justify-center md:border-r md:border-border md:pr-6">
                    <ProgressRing value={pct} size={104} />
                    {typeof rec.rank === "number" && (
                      <Badge variant="neutral">Rank #{rec.rank}</Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <Avatar
                          name={it?.company}
                          size={44}
                          color={companyAccent(it?.company ?? "")}
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/internships/${rec.internship_id}`}
                            className="block truncate font-heading text-lg font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {it?.title ?? "Internship"}
                          </Link>
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {it?.company}
                          </p>
                        </div>
                      </div>
                      {it?.stipend_amount != null && (
                        <span className="hidden shrink-0 text-sm font-semibold text-success sm:block">
                          {formatStipend(it.stipend_amount, it.stipend_currency)}
                        </span>
                      )}
                    </div>

                    {rec.explanation && (
                      <div className="mb-4 rounded-xl bg-accent/60 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                          <Sparkles className="h-3.5 w-3.5" /> Why this matches
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {rec.explanation}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {matched.length > 0 && (
                        <div>
                          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-success">
                            <Check className="h-3.5 w-3.5" /> Matched ({matched.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {matched.map((s) => (
                              <Badge key={s} variant="success">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {missing.length > 0 && (
                        <div>
                          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-saffron-dark">
                            <TrendingUp className="h-3.5 w-3.5" /> To build (
                            {missing.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {missing.map((s) => (
                              <Badge key={s} variant="saffron">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex gap-3">
                      {isApplied ? (
                        <Button variant="success" disabled className="flex-1 sm:flex-none">
                          <CheckCircle2 className="h-4 w-4" /> Applied
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleApply(rec.internship_id)}
                          loading={applyingId === rec.internship_id}
                          disabled={applyingId !== null}
                          className="flex-1 sm:flex-none"
                        >
                          {applyingId !== rec.internship_id && (
                            <>
                              Apply now <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        href={`/internships/${rec.internship_id}`}
                        variant="outline"
                        className="flex-1 sm:flex-none"
                      >
                        View details
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
