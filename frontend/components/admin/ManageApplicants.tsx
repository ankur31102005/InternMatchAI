"use client"

import { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, Building2, ClipboardList, Loader2 } from "lucide-react"
import type { AdminApplicationListResponse } from "@/types"
import { apiFetch } from "@/services/api"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/ui/Avatar"
import { Select } from "@/components/ui/Select"
import { EmptyState } from "@/components/ui/EmptyState"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { StatusBadge } from "@/components/internships/StatusBadge"
import { companyAccent, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { toast } from "@/store/toastStore"

const STATUS_OPTIONS = [
  { label: "Applied", value: "pending" },
  { label: "Under review", value: "under_review" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
]

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Applied" },
  { key: "under_review", label: "Under review" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
]

export function ManageApplicants() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery<AdminApplicationListResponse>({
    queryKey: ["admin-applications"],
    queryFn: () => apiFetch<AdminApplicationListResponse>("/applications/all?per_page=200"),
  })

  const items = useMemo(() => data?.items ?? [], [data])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    items.forEach((a) => {
      const k = a.status.toLowerCase()
      c[k] = (c[k] ?? 0) + 1
    })
    return c
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((a) => {
      const matchesFilter =
        filter === "all" || a.status.toLowerCase() === filter
      const matchesSearch =
        !q ||
        a.applicant_name.toLowerCase().includes(q) ||
        a.applicant_email.toLowerCase().includes(q) ||
        (a.internship?.title ?? "").toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  }, [items, filter, search])

  const changeStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      await apiFetch(`/applications/${id}/status`, {
        method: "PATCH",
        json: { status },
      })
      toast.success("Status updated")
      await queryClient.invalidateQueries({ queryKey: ["admin-applications"] })
    } catch (err: any) {
      toast.error("Couldn't update status", err.message || "Please try again.")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Search + filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by applicant, email or internship…"
            aria-label="Search applications"
            className="h-11 w-full rounded-xl border border-input bg-surface pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
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
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={ClipboardList}
          title="Couldn't load applications"
          description="Please refresh and try again."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications yet"
          description="Applications from students will appear here for you to review."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching applications"
          description="Try a different search or filter."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="divide-y divide-border">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    name={a.applicant_name}
                    size={40}
                    color={companyAccent(a.applicant_name)}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {a.applicant_name}
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {a.internship?.title ?? "Internship"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applied {formatDate(a.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:shrink-0">
                  <StatusBadge status={a.status} />
                  <div className="w-40">
                    {updatingId === a.id ? (
                      <div className="flex h-11 items-center justify-center rounded-xl border border-input">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Select
                        aria-label="Change status"
                        value={a.status.toLowerCase()}
                        onChange={(e) => changeStatus(a.id, e.target.value)}
                        options={STATUS_OPTIONS}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Changing a status instantly updates the applicant&apos;s tracker under{" "}
        <Badge variant="neutral">My Applications</Badge>.
      </p>
    </div>
  )
}
