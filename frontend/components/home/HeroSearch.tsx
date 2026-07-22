"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin } from "lucide-react"

export function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set("search", query.trim())
    if (location.trim()) params.set("location", location.trim())
    router.push(`/internships${params.toString() ? `?${params}` : ""}`)
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-card sm:flex-row"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Role, skill or organisation"
          aria-label="Search internships"
          className="h-12 w-full rounded-xl bg-transparent pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      <div className="relative sm:w-44">
        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          aria-label="Location"
          className="h-12 w-full rounded-xl bg-transparent pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-blue-dark active:scale-[0.98]"
      >
        <Search className="h-4 w-4" />
        Search
      </button>
    </form>
  )
}
