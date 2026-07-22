"use client"

import { useQuery } from "@tanstack/react-query"
import { Briefcase } from "lucide-react"
import { apiFetch } from "@/services/api"
import type { InternshipListResponse } from "@/types"
import { InternshipCard } from "@/components/internships/InternshipCard"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/Button"

export function FeaturedInternships() {
  const { data, isLoading, isError } = useQuery<InternshipListResponse>({
    queryKey: ["featured-internships"],
    queryFn: () => apiFetch<InternshipListResponse>("/internships/?page=1&per_page=6"),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (isError || !data || data.items.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No featured internships yet"
        description="New opportunities are added regularly. Browse the full catalogue to explore what's available."
        action={
          <Button href="/internships" variant="primary">
            Browse all internships
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {data.items.map((internship, i) => (
        <InternshipCard key={internship.id} internship={internship} index={i} />
      ))}
    </div>
  )
}
