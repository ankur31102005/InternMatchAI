"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Briefcase,
  FileText,
  Sparkles,
  TrendingUp,
  UploadCloud,
  CheckCircle2,
  Clock,
  Bell,
  ArrowRight,
  Building2,
  User,
  Eye,
} from "lucide-react"
import type {
  ApplicationListResponse,
  RecommendationListResponse,
  Resume,
} from "@/types"
import { apiFetch, apiOpenFile } from "@/services/api"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { StatusBadge } from "@/components/internships/StatusBadge"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { matchPercent, companyAccent, timeAgo, formatDate } from "@/lib/format"

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Briefcase
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
          style={{ background: accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 font-heading text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: apps } = useQuery<ApplicationListResponse>({
    queryKey: ["applications"],
    queryFn: () => apiFetch<ApplicationListResponse>("/applications/"),
  })
  const { data: recs } = useQuery<RecommendationListResponse>({
    queryKey: ["recommendations"],
    queryFn: () => apiFetch<RecommendationListResponse>("/recommendations/"),
    retry: false,
  })
  const { data: resumes } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: () => apiFetch<Resume[]>("/resumes/"),
    retry: false,
  })

  const applications = apps?.items ?? []
  const recommendations = recs?.items ?? []
  const activeResume = resumes?.find((r) => r.is_active) ?? resumes?.[0]
  const bestMatch = recommendations.length
    ? Math.max(...recommendations.map((r) => matchPercent(r.match_score)))
    : 0

  // Profile completion heuristic
  const completion = (() => {
    let done = 1 // account exists
    const total = 4
    if (user?.phone) done++
    if (activeResume) done++
    if (recommendations.length > 0) done++
    return Math.round((done / total) * 100)
  })()

  // Derived notifications from real activity
  const notifications = [
    activeResume?.is_processed && {
      icon: CheckCircle2,
      color: "text-success",
      text: "Your resume has been processed and skills extracted.",
      time: timeAgo(activeResume.created_at),
    },
    recommendations.length > 0 && {
      icon: Sparkles,
      color: "text-primary",
      text: `${recommendations.length} new AI matches are ready for you.`,
      time: timeAgo(recommendations[0]?.created_at),
    },
    applications.length > 0 && {
      icon: FileText,
      color: "text-brand-saffron-dark",
      text: `You have ${applications.length} active application${
        applications.length === 1 ? "" : "s"
      }.`,
      time: timeAgo(applications[0]?.created_at),
    },
  ].filter(Boolean) as {
    icon: typeof Bell
    color: string
    text: string
    time: string
  }[]

  return (
    <DashboardShell>
      {/* Greeting */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome back, {user?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here&apos;s an overview of your internship journey.
          </p>
        </div>
        <Button href="/upload" variant="primary">
          <UploadCloud className="h-4 w-4" /> Update resume
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Sparkles}
          label="AI matches"
          value={recommendations.length}
          accent="#0F4C81"
        />
        <StatCard
          icon={FileText}
          label="Applications"
          value={applications.length}
          accent="#138808"
        />
        <StatCard
          icon={TrendingUp}
          label="Best match"
          value={`${bestMatch}%`}
          accent="#E67E00"
        />
        <StatCard
          icon={Briefcase}
          label="Resume"
          value={activeResume ? "Active" : "None"}
          accent="#1B6CB3"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recommended */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Recommended for you
              </h2>
              <Link
                href="/recommendations"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recommendations.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No matches yet"
                description="Upload your resume to get AI-ranked recommendations."
                action={
                  <Button href="/upload" variant="primary">
                    Upload resume
                  </Button>
                }
                className="py-10"
              />
            ) : (
              <div className="space-y-3">
                {recommendations.slice(0, 4).map((rec) => (
                  <Link
                    key={rec.id}
                    href={`/internships/${rec.internship_id}`}
                    className="flex items-center gap-4 rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <Avatar
                      name={rec.internship?.company}
                      size={40}
                      color={companyAccent(rec.internship?.company ?? "")}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {rec.internship?.title}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {rec.internship?.company}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                      {matchPercent(rec.match_score)}%
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent applications */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Recent applications
              </h2>
              <Link
                href="/applications"
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {applications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                You haven&apos;t applied to any internships yet.
              </p>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 4).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-4 rounded-xl border border-border p-3"
                  >
                    <Avatar
                      name={app.internship?.company}
                      size={40}
                      color={companyAccent(app.internship?.company ?? "")}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {app.internship?.title ?? "Internship"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Applied {timeAgo(app.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile completion */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-3 flex items-center gap-3">
              <Avatar name={user?.full_name} size={44} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {user?.full_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile completion</span>
              <span className="font-semibold text-primary">{completion}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <Button href="/profile" variant="outline" size="sm" className="mt-4 w-full">
              <User className="h-4 w-4" /> Complete profile
            </Button>
          </section>

          {/* Resume status */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
              Resume status
            </h2>
            {activeResume ? (
              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {activeResume.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {formatDate(activeResume.created_at)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  {activeResume.is_processed ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Processed —{" "}
                      {activeResume.skills.length} skills
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <Clock className="h-3 w-3" /> Processing…
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await apiOpenFile(`/resumes/${activeResume.id}/file`)
                      } catch (err: any) {
                        toast.error(
                          "Cannot open resume",
                          err.message || "Please try again."
                        )
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                </div>
              </div>
            ) : resumes === undefined ? (
              <Skeleton className="h-20 w-full rounded-xl" />
            ) : (
              <div className="rounded-xl border border-dashed border-border p-4 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  No resume uploaded yet.
                </p>
                <Button href="/upload" variant="primary" size="sm" className="w-full">
                  <UploadCloud className="h-4 w-4" /> Upload resume
                </Button>
              </div>
            )}
          </section>

          {/* Notifications */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
              <Bell className="h-4 w-4 text-primary" /> Notifications
            </h2>
            {notifications.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n, i) => (
                  <li key={i} className="flex gap-3">
                    <n.icon className={`mt-0.5 h-4 w-4 shrink-0 ${n.color}`} />
                    <div>
                      <p className="text-sm text-foreground">{n.text}</p>
                      {n.time && (
                        <p className="text-xs text-muted-foreground">{n.time}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  )
}
