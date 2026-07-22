"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Search, FileText, Building2, Trash2 } from "lucide-react"
import type { ApplicationListResponse } from "@/types"
import { apiFetch } from "@/services/api"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { Avatar } from "@/components/ui/Avatar"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { StatusBadge } from "@/components/internships/StatusBadge"
import { ApplicationTimeline } from "@/components/internships/ApplicationTimeline"
import { companyAccent, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { toast } from "@/store/toastStore"

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Applied" },
  { key: "under_review", label: "Under review" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Not selected" },
]

export default function ApplicationsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery<ApplicationListResponse>({
    queryKey: ["applications"],
    queryFn: () => apiFetch<ApplicationListResponse>("/applications/"),
  })

  const items = useMemo(() => data?.items ?? [], [data])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    items.forEach((a) => (c[a.status] = (c[a.status] ?? 0) + 1))
    return c
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((a) => {
      const matchesFilter = filter === "all" || a.status === filter
      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        a.internship?.title?.toLowerCase().includes(q) ||
        a.internship?.company?.toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [items, filter, search])

  const withdraw = async (id: string) => {
    setWithdrawingId(id)
    try {
      await apiFetch(`/applications/${id}`, { method: "DELETE" })
      await queryClient.invalidateQueries({ queryKey: ["applications"] })
      toast.success("Application withdrawn")
    } catch (err: any) {
      toast.error("Couldn't withdraw", err.message || "Please try again.")
    } finally {
      setWithdrawingId(null)
    }
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          My applications
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track the status of every internship you&apos;ve applied to.
        </p>
      </div>

      {/* Search + filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your applications…"
            aria-label="Search applications"
            className="h-12 w-full rounded-xl border border-input bg-surface pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-surface text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {f.label}
              {counts[f.key] ? (
                <span className="ml-1.5 opacity-70">{counts[f.key]}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={FileText}
          title="Couldn't load applications"
          description="Something went wrong. Please refresh and try again."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications yet"
          description="Browse internships and apply to start tracking your applications here."
          action={
            <Button href="/internships" variant="primary">
              Browse internships
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching applications"
          description="Try a different search term or filter."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((app, idx) => {
            const canWithdraw = !["withdrawn", "rejected", "accepted"].includes(
              app.status
            )
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.25) }}
                className="rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <Avatar
                      name={app.internship?.company}
                      size={48}
                      color={companyAccent(app.internship?.company ?? "")}
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/internships/${app.internship_id}`}
                        className="block truncate font-heading text-base font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {app.internship?.title ?? "Internship"}
                      </Link>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />
                        {app.internship?.company}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Applied on {formatDate(app.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    {canWithdraw && (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={withdrawingId === app.id}
                        onClick={() => withdraw(app.id)}
                      >
                        {withdrawingId !== app.id && <Trash2 className="h-4 w-4" />}
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-5">
                  <ApplicationTimeline status={app.status} />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
