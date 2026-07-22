"use client"

import { Suspense, useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Search, SlidersHorizontal, Briefcase, X } from "lucide-react"
import { apiFetch } from "@/services/api"
import type { InternshipListResponse } from "@/types"
import { PageShell } from "@/components/layout/PageShell"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { InternshipCard } from "@/components/internships/InternshipCard"
import {
  FilterPanel,
  DEFAULT_FILTERS,
  type Filters,
} from "@/components/internships/FilterPanel"
import { Select } from "@/components/ui/Select"
import { Pagination } from "@/components/ui/Pagination"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { SORT_OPTIONS } from "@/lib/constants"

const PER_PAGE = 9

function matchesDuration(weeks: number | null | undefined, range: string): boolean {
  if (!range) return true
  if (weeks == null) return false
  const [min, max] = range.split("-").map(Number)
  return weeks >= min && weeks <= max
}

function matchesStipend(amount: number | null | undefined, range: string): boolean {
  if (!range) return true
  const [min, max] = range.split("-").map(Number)
  const value = amount ?? 0
  return value >= min && value <= max
}

function InternshipsBrowser() {
  const params = useSearchParams()
  const initialSearch = params.get("search") ?? ""
  const initialSector = params.get("sector") ?? ""
  const initialLocation = params.get("location") ?? ""

  const [search, setSearch] = useState(initialSearch)
  const [debounced, setDebounced] = useState(initialSearch)
  const [location, setLocation] = useState(initialLocation)
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    sector: initialSector,
  })
  const [sort, setSort] = useState("recent")
  const [page, setPage] = useState(1)
  const [mobileFilters, setMobileFilters] = useState(false)

  // Debounce the free-text search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Reset to first page whenever inputs change
  useEffect(() => {
    setPage(1)
  }, [debounced, location, filters, sort])

  const { data, isLoading, isError } = useQuery<InternshipListResponse>({
    queryKey: ["internships", debounced, filters.sector, filters.mode],
    queryFn: () => {
      const qs = new URLSearchParams({ page: "1", per_page: "100" })
      if (debounced) qs.set("search", debounced)
      if (filters.sector) qs.set("sector", filters.sector)
      if (filters.mode === "remote") qs.set("is_remote", "true")
      if (filters.mode === "onsite") qs.set("is_remote", "false")
      return apiFetch<InternshipListResponse>(`/internships/?${qs}`)
    },
  })

  const filtered = useMemo(() => {
    let items = data?.items ?? []
    if (location.trim()) {
      const loc = location.trim().toLowerCase()
      items = items.filter((i) => (i.location ?? "").toLowerCase().includes(loc))
    }
    items = items.filter(
      (i) =>
        matchesDuration(i.duration_weeks, filters.duration) &&
        matchesStipend(i.stipend_amount, filters.stipend)
    )
    const sorted = [...items]
    switch (sort) {
      case "stipend_desc":
        sorted.sort((a, b) => (b.stipend_amount ?? 0) - (a.stipend_amount ?? 0))
        break
      case "stipend_asc":
        sorted.sort((a, b) => (a.stipend_amount ?? 0) - (b.stipend_amount ?? 0))
        break
      case "duration_asc":
        sorted.sort(
          (a, b) => (a.duration_weeks ?? 999) - (b.duration_weeks ?? 999)
        )
        break
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    }
    return sorted
  }, [data, location, filters.duration, filters.stipend, sort])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const reset = () => {
    setFilters(DEFAULT_FILTERS)
    setLocation("")
    setSearch("")
  }

  const filterPanel = (
    <FilterPanel filters={filters} onChange={setFilters} onReset={reset} />
  )

  return (
    <div className="container-page py-8">
      <Breadcrumb items={[{ label: "Internships" }]} />

      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Explore internships
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse active government, PSU &amp; PM Internship Scheme opportunities.
        </p>
      </div>

      {/* Search + sort bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, company or keyword…"
            aria-label="Search internships"
            className="h-12 w-full rounded-xl border border-input bg-surface pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="flex gap-3">
          <div className="w-44">
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              options={SORT_OPTIONS}
              className="h-12"
            />
          </div>
          <Button
            variant="outline"
            size="lg"
            className="lg:hidden"
            onClick={() => setMobileFilters(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop filters */}
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">{filterPanel}</div>
        </div>

        {/* Results */}
        <div className="min-w-0 flex-1">
          <p className="mb-4 text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : `${filtered.length} internship${filtered.length === 1 ? "" : "s"} found`}
          </p>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={Briefcase}
              title="Couldn't load internships"
              description="Something went wrong fetching opportunities. Please try again."
            />
          ) : pageItems.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No internships match your filters"
              description="Try widening your search or resetting the filters."
              action={
                <Button variant="outline" onClick={reset}>
                  <X className="h-4 w-4" /> Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((internship, i) => (
                  <InternshipCard
                    key={internship.id}
                    internship={internship}
                    index={i}
                  />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile filters modal */}
      <Modal
        open={mobileFilters}
        onOpenChange={setMobileFilters}
        title="Filter internships"
        footer={
          <Button onClick={() => setMobileFilters(false)}>Show results</Button>
        }
      >
        {filterPanel}
      </Modal>
    </div>
  )
}

export default function InternshipsPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="container-page py-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        }
      >
        <InternshipsBrowser />
      </Suspense>
    </PageShell>
  )
}
