"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  Building2,
  MapPin,
  Globe,
  Briefcase,
  Star,
  Users,
  ShieldCheck,
  Landmark,
} from "lucide-react"
import type { InternshipListResponse } from "@/types"
import { apiFetch } from "@/services/api"
import { PageShell } from "@/components/layout/PageShell"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { InternshipCard } from "@/components/internships/InternshipCard"
import { FullPageSpinner } from "@/components/ui/Spinner"
import { EmptyState } from "@/components/ui/EmptyState"
import { companyAccent, slugify } from "@/lib/format"

const REVIEWS = [
  {
    name: "Ananya R.",
    role: "Former intern",
    rating: 5,
    text: "Structured mentorship and real ownership of projects. A genuinely valuable experience.",
  },
  {
    name: "Karan M.",
    role: "Former intern",
    rating: 4,
    text: "Supportive teams and exposure to large-scale public systems. Would recommend.",
  },
]

export default function CompanyProfilePage() {
  const { slug } = useParams<{ slug: string }>()

  const { data, isLoading } = useQuery<InternshipListResponse>({
    queryKey: ["company-internships"],
    queryFn: () => apiFetch<InternshipListResponse>("/internships/?per_page=100"),
  })

  const { companyName, roles, sectors, locations } = useMemo(() => {
    const all = data?.items ?? []
    const roles = all.filter((i) => slugify(i.company) === slug)
    const companyName = roles[0]?.company ?? slug?.replace(/-/g, " ")
    const sectors = [...new Set(roles.map((r) => r.sector).filter(Boolean))]
    const locations = [
      ...new Set(roles.map((r) => r.location).filter(Boolean)),
    ]
    return { companyName, roles, sectors, locations }
  }, [data, slug])

  if (isLoading) {
    return (
      <PageShell>
        <FullPageSpinner label="Loading organisation…" />
      </PageShell>
    )
  }

  const accent = companyAccent(companyName || "Org")
  const isPmPartner = roles.some((r) => r.is_pm_scheme)

  return (
    <PageShell>
      <div className="container-page py-8">
        <Breadcrumb
          items={[
            { label: "Internships", href: "/internships" },
            { label: companyName || "Organisation" },
          ]}
        />

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="h-24 w-full" style={{ background: accent }} />
          <div className="px-6 pb-6 sm:px-8">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="rounded-2xl border-4 border-card">
                  <Avatar name={companyName} size={80} color={accent} className="rounded-xl" />
                </div>
                <div className="pb-1">
                  <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                    {companyName}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {isPmPartner && (
                      <Badge variant="success">
                        <ShieldCheck className="h-3 w-3" /> PM Scheme partner
                      </Badge>
                    )}
                    {sectors.slice(0, 2).map((s) => (
                      <Badge key={s} variant="neutral">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="outline" className="shrink-0">
                <Globe className="h-4 w-4" /> Visit website
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
              <div>
                <p className="font-heading text-xl font-bold text-primary">
                  {roles.length}
                </p>
                <p className="text-xs text-muted-foreground">Open positions</p>
              </div>
              <div>
                <p className="font-heading text-xl font-bold text-primary">
                  {sectors.length || 1}
                </p>
                <p className="text-xs text-muted-foreground">Sectors</p>
              </div>
              <div>
                <p className="font-heading text-xl font-bold text-primary">
                  {locations.length || 1}
                </p>
                <p className="text-xs text-muted-foreground">Locations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Open positions */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-foreground">
                <Briefcase className="h-5 w-5 text-primary" /> Open positions
              </h2>
              {roles.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="No active positions"
                  description="This organisation has no open internships right now."
                  action={
                    <Button href="/internships" variant="primary">
                      Browse all internships
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {roles.map((internship, i) => (
                    <InternshipCard
                      key={internship.id}
                      internship={internship}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Reviews */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 font-heading text-xl font-bold text-foreground">
                <Star className="h-5 w-5 text-brand-saffron" /> Intern reviews
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {REVIEWS.map((r) => (
                  <div
                    key={r.name}
                    className="rounded-2xl border border-border bg-card p-5 shadow-card"
                  >
                    <div className="mb-3 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={
                            s < r.rating
                              ? "h-4 w-4 fill-current text-brand-saffron"
                              : "h-4 w-4 text-border"
                          }
                        />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-foreground">
                      &ldquo;{r.text}&rdquo;
                    </p>
                    <div className="mt-4 flex items-center gap-2.5 border-t border-border pt-3">
                      <Avatar name={r.name} size={32} color={companyAccent(r.name)} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar: About */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                <Building2 className="h-4 w-4 text-primary" /> About
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {companyName} partners with InternMatch AI to offer internships to
                students across India. Roles focus on real-world impact within the
                public and public-sector ecosystem.
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {sectors.length > 0 && (
                  <li className="flex items-center gap-2.5 text-muted-foreground">
                    <Landmark className="h-4 w-4 text-primary" />
                    {sectors.join(", ")}
                  </li>
                )}
                {locations.length > 0 && (
                  <li className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {locations.slice(0, 3).join(", ")}
                  </li>
                )}
                <li className="flex items-center gap-2.5 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Public-sector organisation
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
