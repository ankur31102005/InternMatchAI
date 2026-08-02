"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, Bookmark } from "lucide-react"
import { useSavedInternships } from "@/lib/useSavedInternships"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { InternshipCard } from "@/components/internships/InternshipCard"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { CardSkeleton } from "@/components/ui/Skeleton"

export default function SavedPage() {
  const [search, setSearch] = useState("")
  const { savedItems, isLoading } = useSavedInternships()

  const filtered = useMemo(() => {
    return savedItems.filter((item) => {
      if (!item.internship) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        item.internship.title.toLowerCase().includes(q) ||
        item.internship.company.toLowerCase().includes(q) ||
        (item.internship.sector && item.internship.sector.toLowerCase().includes(q))
      )
    })
  }, [savedItems, search])

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Saved internships
        </h1>
        <p className="mt-1 text-muted-foreground">
          Quickly access and manage your bookmarked internship opportunities.
        </p>
      </div>

      {/* Search bar */}
      {savedItems.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved internships…"
              aria-label="Search saved internships"
              className="h-12 w-full rounded-xl border border-input bg-surface pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : savedItems.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved internships yet"
          description="Click the bookmark icon on any internship card to save it here for quick access."
          action={
            <Button href="/internships" variant="primary">
              Browse internships
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching saved internships"
          description="Try adjusting your search criteria."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, idx) =>
            item.internship ? (
              <InternshipCard
                key={item.id}
                internship={item.internship}
                index={idx}
              />
            ) : null
          )}
        </div>
      )}
    </DashboardShell>
  )
}
