"use client"

import { SlidersHorizontal, RotateCcw } from "lucide-react"
import { Select } from "@/components/ui/Select"
import { SECTORS, DURATIONS, STIPEND_RANGES } from "@/lib/constants"

export interface Filters {
  sector: string
  mode: string
  duration: string
  stipend: string
}

export const DEFAULT_FILTERS: Filters = {
  sector: "",
  mode: "all",
  duration: "",
  stipend: "",
}

interface FilterPanelProps {
  filters: Filters
  onChange: (next: Filters) => void
  onReset: () => void
  /** Sectors actually present in the data. When provided, replaces the
   *  static list so users only see sectors that yield results. */
  sectors?: string[]
}

export function FilterPanel({
  filters,
  onChange,
  onReset,
  sectors,
}: FilterPanelProps) {
  const set = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value })

  const sectorList = sectors ?? [...SECTORS]

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filters
        </h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sector
          </label>
          <Select
            value={filters.sector}
            onChange={(e) => set("sector", e.target.value)}
            options={[
              { label: "All sectors", value: "" },
              ...sectorList.map((s) => ({ label: s, value: s })),
            ]}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Work mode
          </label>
          <Select
            value={filters.mode}
            onChange={(e) => set("mode", e.target.value)}
            options={[
              { label: "Any mode", value: "all" },
              { label: "Remote", value: "remote" },
              { label: "On-site", value: "onsite" },
            ]}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Duration
          </label>
          <Select
            value={filters.duration}
            onChange={(e) => set("duration", e.target.value)}
            options={DURATIONS}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Stipend
          </label>
          <Select
            value={filters.stipend}
            onChange={(e) => set("stipend", e.target.value)}
            options={STIPEND_RANGES}
          />
        </div>
      </div>
    </div>
  )
}
