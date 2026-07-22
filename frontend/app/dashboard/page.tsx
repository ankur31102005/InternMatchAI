"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { apiFetch } from "@/services/api"
import Navbar from "@/components/Navbar"
import { Search, MapPin, Building2, Calendar, Award, ExternalLink, Loader2 } from "lucide-react"

interface Internship {
  id: string
  title: string
  company: string
  description: string
  location?: string
  is_remote: boolean
  duration_weeks?: number
  stipend_amount?: number
  is_pm_scheme: boolean
  sector?: string
  ministry?: string
}

interface InternshipListResponse {
  total: number
  items: Internship[]
}

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [sectorFilter, setSectorFilter] = useState("")
  const [remoteFilter, setRemoteFilter] = useState("all")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  // Fetch Internships
  const { data, isLoading, error } = useQuery<InternshipListResponse>({
    queryKey: ["internships", searchTerm, sectorFilter, remoteFilter],
    queryFn: () => {
      let url = `/internships/?page=1&per_page=20`
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`
      if (sectorFilter) url += `&sector=${encodeURIComponent(sectorFilter)}`
      if (remoteFilter !== "all") {
        url += `&is_remote=${remoteFilter === "remote"}`
      }
      return apiFetch<InternshipListResponse>(url)
    },
    enabled: isAuthenticated,
  })

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="mb-10 animate-fade-in-up">
          <h1 className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Available Internships
          </h1>
          <p className="text-muted-foreground">
            Explore listings under the PM Internship Scheme, filter sectors, or find remote configurations.
          </p>
        </div>

        {/* Filter Section */}
        <div className="glass-card rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by role, company or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-black/40 border border-white/10 text-sm text-muted-foreground rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-colors w-full md:w-44"
            >
              <option value="">All Sectors</option>
              <option value="Finance">Finance</option>
              <option value="Technology">Technology</option>
              <option value="Policy">Policy</option>
            </select>

            <select
              value={remoteFilter}
              onChange={(e) => setRemoteFilter(e.target.value)}
              className="bg-black/40 border border-white/10 text-sm text-muted-foreground rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-colors w-full md:w-44"
            >
              <option value="all">All Styles</option>
              <option value="remote">Remote Only</option>
              <option value="on-site">On-site Only</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-10">
            Failed to load internship openings.
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            No internships matched your search criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.items.map((internship) => (
              <div
                key={internship.id}
                className="glass-card rounded-2xl p-6 glass-card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-outfit text-xl font-bold text-white mb-1">
                        {internship.title}
                      </h3>
                      <div className="flex items-center text-muted-foreground text-sm space-x-2">
                        <Building2 className="w-4 h-4" />
                        <span>{internship.company}</span>
                      </div>
                    </div>

                    {internship.is_pm_scheme && (
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium">
                        PM Scheme
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
                    {internship.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-y-2 text-sm text-muted-foreground border-t border-white/5 pt-4">
                    <div className="flex items-center space-x-2 w-1/2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{internship.is_remote ? "Remote" : internship.location || "N/A"}</span>
                    </div>

                    {internship.duration_weeks && (
                      <div className="flex items-center space-x-2 w-1/2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{internship.duration_weeks} Weeks</span>
                      </div>
                    )}

                    {internship.stipend_amount && (
                      <div className="flex items-center space-x-2 w-1/2">
                        <Award className="w-4 h-4 text-primary" />
                        <span>₹{internship.stipend_amount}/Mo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/recommendations`)}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-xl text-sm transition-all text-center glow-primary"
                    >
                      Check AI Match
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
