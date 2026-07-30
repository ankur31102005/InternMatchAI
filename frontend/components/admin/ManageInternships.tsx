"use client"

import { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2, Search, Building2, AlertTriangle, Loader2, Briefcase } from "lucide-react"
import type { InternshipListResponse } from "@/types"
import { apiFetch } from "@/services/api"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/ui/Avatar"
import { Modal } from "@/components/ui/Modal"
import { EmptyState } from "@/components/ui/EmptyState"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { companyAccent, formatStipend } from "@/lib/format"
import { toast } from "@/store/toastStore"

export function ManageInternships() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)

  const { data, isLoading, isError } = useQuery<InternshipListResponse>({
    queryKey: ["admin-internships"],
    queryFn: () => apiFetch<InternshipListResponse>("/internships/?per_page=100"),
  })

  const items = useMemo(() => data?.items ?? [], [data])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) || i.company.toLowerCase().includes(q)
    )
  }, [items, search])

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-internships"] })

  const deleteOne = async (id: string, title: string) => {
    setDeletingId(id)
    try {
      await apiFetch(`/internships/${id}`, { method: "DELETE" })
      toast.success("Deleted", `${title} was removed.`)
      await refresh()
    } catch (err: any) {
      toast.error("Couldn't delete", err.message || "Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const deleteAll = async () => {
    setConfirmAll(false)
    setBulkDeleting(true)
    setBulkProgress(0)
    let failed = 0
    for (let i = 0; i < items.length; i++) {
      try {
        await apiFetch(`/internships/${items[i].id}`, { method: "DELETE" })
      } catch {
        failed++
      }
      setBulkProgress(Math.round(((i + 1) / items.length) * 100))
    }
    setBulkDeleting(false)
    await refresh()
    if (failed === 0) toast.success("All internships deleted")
    else toast.error(`${failed} could not be deleted`, "See remaining list.")
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search internships…"
            aria-label="Search internships"
            className="h-11 w-full rounded-xl border border-input bg-surface pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <Button
          variant="destructive"
          onClick={() => setConfirmAll(true)}
          disabled={items.length === 0 || bulkDeleting}
        >
          <Trash2 className="h-4 w-4" /> Delete all ({items.length})
        </Button>
      </div>

      {bulkDeleting && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Deleting all internships…
            </span>
            <span>{bulkProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-destructive transition-all"
              style={{ width: `${bulkProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={Briefcase}
          title="Couldn't load internships"
          description="Please refresh and try again."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={items.length === 0 ? "No internships yet" : "No matches"}
          description={
            items.length === 0
              ? "Add internships from the Bulk Import or Add Manually tabs."
              : "Try a different search term."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="divide-y divide-border">
            {filtered.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40"
              >
                <Avatar name={it.company} size={40} color={companyAccent(it.company)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {it.title}
                  </p>
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {it.company}
                    {it.sector ? ` · ${it.sector}` : ""}
                  </p>
                </div>
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {formatStipend(it.stipend_amount, it.stipend_currency)}
                </span>
                {!it.is_active && <Badge variant="neutral">Inactive</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  loading={deletingId === it.id}
                  onClick={() => deleteOne(it.id, it.title)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  {deletingId !== it.id && <Trash2 className="h-4 w-4" />}
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete-all confirmation */}
      <Modal
        open={confirmAll}
        onOpenChange={setConfirmAll}
        title="Delete all internships?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmAll(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteAll}>
              <Trash2 className="h-4 w-4" /> Yes, delete all {items.length}
            </Button>
          </>
        }
      >
        <div className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-muted-foreground">
            This will permanently delete <strong>all {items.length} internships</strong>{" "}
            and their related applications &amp; recommendations. This action{" "}
            <strong>cannot be undone</strong>.
          </p>
        </div>
      </Modal>
    </div>
  )
}
