"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  MapPin,
  Clock,
  Wallet,
  Building2,
  Calendar,
  GraduationCap,
  Users,
  CheckCircle2,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  Share2,
} from "lucide-react"
import type {
  Internship,
  InternshipListResponse,
  RecommendationListResponse,
  ApplicationListResponse,
} from "@/types"
import { apiFetch } from "@/services/api"
import { useAuthStore } from "@/store/authStore"
import { useSavedInternships } from "@/lib/useSavedInternships"
import { PageShell } from "@/components/layout/PageShell"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { ProgressRing } from "@/components/ui/ProgressRing"
import { InternshipCard } from "@/components/internships/InternshipCard"
import { MatchBreakdown } from "@/components/internships/MatchBreakdown"
import { CardSkeleton, ListSkeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import {
  formatStipend,
  formatDate,
  companyAccent,
  matchPercent,
  parseSkillList,
  slugify,
} from "@/lib/format"
import { toast } from "@/store/toastStore"

const BENEFITS = [
  { icon: Award, label: "Completion certificate" },
  { icon: BookOpen, label: "Mentorship & training" },
  { icon: ShieldCheck, label: "Verified opportunity" },
  { icon: Users, label: "Networking access" },
]

export default function InternshipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const { isSaved, toggleSave } = useSavedInternships()
  const saved = isSaved(id)

  const [appliedJustNow, setAppliedJustNow] = useState(false)
  const [applying, setApplying] = useState(false)

  // Fetch internship detail
  const { data: internship, isLoading, isError } = useQuery<Internship>({
    queryKey: ["internship", id],
    queryFn: () => apiFetch<Internship>(`/internships/${id}`),
    enabled: !!id,
  })

  // Fetch user applications to detect already-applied state
  const { data: userApps } = useQuery<ApplicationListResponse>({
    queryKey: ["applications"],
    queryFn: () => apiFetch<ApplicationListResponse>("/applications/"),
    enabled: isAuthenticated,
  })

  const existingApp = userApps?.items.find((a) => a.internship_id === id)
  const hasApplied = appliedJustNow || !!existingApp

  // Fetch similar internships from backend API
  const { data: similarData, isLoading: isLoadingSimilar } = useQuery<InternshipListResponse>({
    queryKey: ["similar-internships", id],
    queryFn: () => apiFetch<InternshipListResponse>(`/internships/${id}/similar?limit=3`),
    enabled: !!id && !!internship,
  })

  // Fetch recommendations for AI match score
  const { data: recs } = useQuery<RecommendationListResponse>({
    queryKey: ["recommendations"],
    queryFn: () => apiFetch<RecommendationListResponse>("/recommendations/"),
    enabled: isAuthenticated,
  })

  const rec = recs?.items.find((r) => r.internship_id === id)
  const matched = parseSkillList(rec?.matched_skills)
  const missing = parseSkillList(rec?.missing_skills)

  // Apply Handler
  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.info("Please sign in", "Create an account to apply for internships.")
      return
    }
    if (hasApplied) return

    setApplying(true)
    try {
      await apiFetch("/applications/", {
        method: "POST",
        json: {
          internship_id: id,
          cover_letter: "Applying via InternMatch AI.",
        },
      })
      setAppliedJustNow(true)
      queryClient.invalidateQueries({ queryKey: ["applications"] })
      toast.success("Application submitted", "Track it under My Applications.")
    } catch (err: any) {
      toast.error("Couldn't apply", err.message || "Please try again.")
    } finally {
      setApplying(false)
    }
  }

  // Share Handler
  const handleShare = async () => {
    if (!internship) return
    const shareData = {
      title: internship.title,
      text: `Check out this internship: ${internship.title} at ${internship.company} on InternMatch AI!`,
      url: typeof window !== "undefined" ? window.location.href : "",
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or share dismissed
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("Link copied", "Internship URL copied to clipboard.")
      } catch {
        toast.error("Could not copy link", "Please copy the address bar URL manually.")
      }
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="container-page py-10 space-y-6">
          <CardSkeleton />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <CardSkeleton />
          </div>
        </div>
      </PageShell>
    )
  }

  if (isError || !internship) {
    return (
      <PageShell>
        <div className="container-page py-16">
          <EmptyState
            icon={Briefcase}
            title="Internship not found"
            description="This opportunity may have been removed or is no longer active."
            action={
              <Button href="/internships" variant="primary">
                Browse internships
              </Button>
            }
          />
        </div>
      </PageShell>
    )
  }

  const accent = companyAccent(internship.company)
  const requiredSkills = internship.skills.filter((s) => s.is_required)
  const optionalSkills = internship.skills.filter((s) => !s.is_required)
  const similarItems =
    similarData?.items.filter((i) => i.id !== internship.id).slice(0, 3) ?? []

  return (
    <PageShell>
      <div className="container-page py-8 pb-28 md:pb-12">
        <Breadcrumb
          items={[
            { label: "Internships", href: "/internships" },
            { label: internship.title },
          ]}
        />

        {/* Header card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="tricolor-bar h-1.5 w-full" />
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
            <div className="flex gap-4 min-w-0">
              <Avatar name={internship.company} size={64} color={accent} className="shrink-0" />
              <div className="min-w-0">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl truncate">
                  {internship.title}
                </h1>
                <Link
                  href={`/companies/${slugify(internship.company)}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary truncate"
                >
                  <Building2 className="h-4 w-4 shrink-0" />
                  {internship.company}
                </Link>
                <div className="mt-4 flex flex-wrap gap-2">
                  {internship.is_pm_scheme && (
                    <Badge variant="success">PM Internship Scheme</Badge>
                  )}
                  {internship.sector && (
                    <Badge variant="neutral">{internship.sector}</Badge>
                  )}
                  {internship.is_remote && <Badge variant="saffron">Remote</Badge>}
                  {internship.ministry && (
                    <Badge variant="default">{internship.ministry}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <div className="flex items-center gap-2">
                {/* Share Button */}
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="lg"
                  aria-label="Share internship"
                >
                  <Share2 className="h-4 w-4" /> Share
                </Button>

                {/* Bookmark Button */}
                <Button
                  onClick={(e) => toggleSave(internship.id, e)}
                  variant="outline"
                  size="lg"
                  className={saved ? "border-primary text-primary bg-primary/5" : ""}
                  aria-label={saved ? "Remove bookmark" : "Save internship"}
                >
                  {saved ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 fill-primary/20 text-primary" /> Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" /> Save
                    </>
                  )}
                </Button>

                {/* Apply Button */}
                <Button
                  onClick={handleApply}
                  loading={applying}
                  variant={hasApplied ? "success" : "primary"}
                  size="lg"
                  disabled={hasApplied}
                >
                  {hasApplied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Applied
                    </>
                  ) : (
                    <>
                      Apply now <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
              {internship.application_deadline && (
                <p className="text-xs text-muted-foreground">
                  Apply by {formatDate(internship.application_deadline)}
                </p>
              )}
            </div>
          </div>

          {/* Quick facts */}
          <div className="grid grid-cols-2 gap-px border-t border-border bg-border md:grid-cols-4">
            {[
              {
                icon: MapPin,
                label: "Location",
                value: internship.is_remote
                  ? "Remote"
                  : internship.location || "India",
              },
              {
                icon: Clock,
                label: "Duration",
                value: internship.duration_weeks
                  ? `${internship.duration_weeks} weeks`
                  : "Flexible",
              },
              {
                icon: Wallet,
                label: "Stipend",
                value: formatStipend(
                  internship.stipend_amount,
                  internship.stipend_currency
                ),
              },
              {
                icon: Users,
                label: "Seats",
                value: internship.total_seats
                  ? `${internship.seats_filled}/${internship.total_seats}`
                  : "Open",
              },
            ].map((f) => (
              <div key={f.label} className="bg-card p-4">
                <f.icon className="mb-1.5 h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Description */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
                About this internship
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {internship.description}
              </p>
            </section>

            {/* Skills required */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
                Skills required
              </h2>
              {internship.skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No specific skills listed — a strong general profile is welcome.
                </p>
              ) : (
                <div className="space-y-4">
                  {requiredSkills.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Must-have
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {requiredSkills.map((s) => (
                          <Badge key={s.skill_id} variant="default">
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {optionalSkills.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Good to have
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {optionalSkills.map((s) => (
                          <Badge key={s.skill_id} variant="neutral">
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Eligibility */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
                Eligibility
              </h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    Minimum degree:{" "}
                    <span className="font-medium text-foreground">
                      {internship.required_degree || "Any graduate"}
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    Minimum GPA:{" "}
                    <span className="font-medium text-foreground">
                      {internship.min_gpa != null ? internship.min_gpa : "Not specified"}
                    </span>
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">
                    Starts:{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(internship.start_date)}
                    </span>
                  </span>
                </li>
              </ul>
            </section>

            {/* Benefits */}
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">
                Benefits &amp; perks
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {BENEFITS.map((b) => (
                  <div
                    key={b.label}
                    className="flex items-center gap-3 rounded-xl bg-muted/50 p-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary shrink-0">
                      <b.icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar: AI match */}
          <aside className="space-y-6">
            <div className="sticky top-24 space-y-6">
              <section className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
                <h2 className="mb-1 flex items-center justify-center gap-2 font-heading text-base font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI match score
                </h2>
                {rec ? (
                  <>
                    <div className="my-4 flex justify-center">
                      <ProgressRing value={matchPercent(rec.match_score)} />
                    </div>
                    <MatchBreakdown
                      semantic={rec.semantic_score}
                      skill={rec.skill_match_score}
                      eligibility={rec.eligibility_score}
                      className="mb-4 text-left"
                    />
                    {matched.length > 0 && (
                      <div className="mb-3 text-left">
                        <p className="mb-1.5 text-xs font-semibold text-success">
                          Matched skills ({matched.length})
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
                      <div className="text-left">
                        <p className="mb-1.5 text-xs font-semibold text-brand-saffron-dark">
                          Skills to build ({missing.length})
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
                  </>
                ) : (
                  <div className="py-4">
                    <p className="mb-4 text-sm text-muted-foreground">
                      Upload your resume to see how well you match this role.
                    </p>
                    <Button href="/upload" variant="primary" className="w-full">
                      <Sparkles className="h-4 w-4" /> Get my match score
                    </Button>
                  </div>
                )}
              </section>

              <Button
                onClick={handleApply}
                loading={applying}
                variant={hasApplied ? "success" : "primary"}
                size="lg"
                disabled={hasApplied}
                className="w-full hidden md:inline-flex"
              >
                {hasApplied ? "Application submitted" : "Apply now"}
              </Button>
            </div>
          </aside>
        </div>

        {/* Similar internships */}
        <section className="mt-14">
          <h2 className="mb-6 font-heading text-xl font-bold text-foreground">
            Similar internships
          </h2>

          {isLoadingSimilar ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : similarItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {similarItems.map((i, idx) => (
                <InternshipCard key={i.id} internship={i} index={idx} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No similar internships found"
              description="Explore other categories to discover relevant opportunities."
              action={
                <Button href="/internships" variant="outline" size="sm">
                  Browse all internships
                </Button>
              }
            />
          )}
        </section>
      </div>

      {/* Floating Sticky Mobile Action Bar (Positioned above Task 8 MobileNav bottom-0) */}
      <div className="fixed bottom-16 left-0 right-0 z-30 flex items-center justify-between border-t border-border bg-card/95 p-3 px-4 backdrop-blur-md md:hidden shadow-lg">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            aria-label="Share internship"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={(e) => toggleSave(internship.id, e)}
            variant="outline"
            size="sm"
            className={saved ? "border-primary text-primary bg-primary/5" : ""}
            aria-label={saved ? "Remove bookmark" : "Save internship"}
          >
            {saved ? (
              <BookmarkCheck className="h-4 w-4 fill-primary/20 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button
          onClick={handleApply}
          loading={applying}
          variant={hasApplied ? "success" : "primary"}
          size="sm"
          disabled={hasApplied}
        >
          {hasApplied ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Applied
            </>
          ) : (
            <>
              Apply now <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </PageShell>
  )
}
