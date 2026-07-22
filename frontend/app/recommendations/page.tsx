"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"
import { apiFetch } from "@/services/api"
import Navbar from "@/components/Navbar"
import { Sparkles, Check, HelpCircle, ArrowRight, BookOpen, User, Building, Landmark, Loader2 } from "lucide-react"

interface Recommendation {
  id: string
  internship_id: string
  match_score: number
  skill_match_score?: number
  semantic_score?: number
  eligibility_score?: number
  explanation?: string
  matched_skills?: string
  missing_skills?: string
  internship?: {
    id: string
    title: string
    company: string
    description: string
    location?: string
    is_remote: boolean
    stipend_amount?: number
    sector?: string
    ministry?: string
  }
}

interface RecommendationListResponse {
  total: number
  items: Recommendation[]
}

export default function RecommendationsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  // Fetch AI recommendations
  const { data, isLoading, error } = useQuery<RecommendationListResponse>({
    queryKey: ["recommendations"],
    queryFn: () => apiFetch<RecommendationListResponse>("/recommendations/"),
    enabled: isAuthenticated,
  })

  const handleApply = async (internshipId: string) => {
    setApplyingId(internshipId)
    try {
      await apiFetch("/applications/", {
        method: "POST",
        json: {
          internship_id: internshipId,
          cover_letter: "Applying via InternMatch AI Recommendations.",
        },
      })
      setApplySuccess((prev) => ({ ...prev, [internshipId]: true }))
    } catch (err: any) {
      alert(err.message || "Failed to submit application.")
    } finally {
      setApplyingId(null)
    }
  }

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

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-10 max-w-4xl">
        {/* Header Title */}
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI compatibility engine online</span>
          </div>
          <h1 className="font-outfit text-3xl sm:text-5xl font-bold tracking-tight mb-2">
            Your Personalised Recommendations
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            These opportunities match the skills extracted from your resume.
          </p>
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-10">
            Failed to load recommendations. Make sure you have uploaded a resume first!
          </div>
        ) : data?.items.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 flex flex-col items-center space-y-4 glass-card rounded-3xl p-8">
            <p className="text-base text-white">No recommendations available yet.</p>
            <p className="text-sm text-muted-foreground max-w-md">Please upload your resume to allow our AI engine to parse your skills and match you with internships.</p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-xl text-sm transition-all glow-primary"
            >
              Upload Resume Now
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {data?.items.map((rec) => {
              const parsedMatched = typeof rec.matched_skills === "string" ? (JSON.parse(rec.matched_skills || "[]") as string[]) : (Array.isArray(rec.matched_skills) ? rec.matched_skills : [])
              const parsedMissing = typeof rec.missing_skills === "string" ? (JSON.parse(rec.missing_skills || "[]") as string[]) : (Array.isArray(rec.missing_skills) ? rec.missing_skills : [])
              const percentage = Math.round((rec.match_score || 0) * 100)

              return (
                <div
                  key={rec.id}
                  className="glass-card rounded-3xl p-6 sm:p-8 animate-fade-in-up relative overflow-hidden flex flex-col md:flex-row gap-6 justify-between items-start"
                >
                  {/* Matching Indicator Glows */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />

                  {/* Left content block */}
                  <div className="flex-1 space-y-6">
                    {/* Role & Company Header */}
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        {rec.internship?.ministry && (
                          <span className="inline-flex items-center space-x-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs px-2.5 py-1 rounded-full font-medium">
                            <Landmark className="w-3.5 h-3.5" />
                            <span>{rec.internship.ministry}</span>
                          </span>
                        )}
                        {rec.internship?.sector && (
                          <span className="bg-white/5 border border-white/10 text-muted-foreground text-xs px-2.5 py-1 rounded-full font-medium">
                            {rec.internship.sector}
                          </span>
                        )}
                      </div>

                      <h2 className="font-outfit text-2xl font-bold text-white mb-2">
                        {rec.internship?.title}
                      </h2>
                      <p className="text-muted-foreground text-sm">{rec.internship?.company}</p>
                    </div>

                    {/* Score explanations */}
                    {rec.explanation && (
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                          AI Recommendation Logic
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{rec.explanation}</p>
                      </div>
                    )}

                    {/* Overlaps & Missing Skills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {parsedMatched.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                            <Check className="w-4 h-4" />
                            <span>Matched Skills ({parsedMatched.length})</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {parsedMatched.map((skill) => (
                              <span
                                key={skill}
                                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedMissing.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs text-orange-400 font-semibold flex items-center space-x-1">
                            <HelpCircle className="w-4 h-4" />
                            <span>Missing Skills ({parsedMissing.length})</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {parsedMissing.map((skill) => (
                              <span
                                key={skill}
                                className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Score & Action items */}
                  <div className="w-full md:w-48 flex flex-col items-center justify-between gap-6 md:self-stretch border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full border-4 border-violet-500/20 flex items-center justify-center mb-2 mx-auto relative">
                        <div
                          className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin-slow"
                          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
                        />
                        <span className="font-outfit text-xl font-extrabold text-white">
                          {percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Match Score
                      </p>
                    </div>

                    <div className="w-full space-y-2.5">
                      {applySuccess[rec.internship_id] ? (
                        <button
                          disabled
                          className="w-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-3 rounded-xl text-sm font-medium flex items-center justify-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Applied</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApply(rec.internship_id)}
                          disabled={applyingId !== null}
                          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 glow-primary"
                        >
                          {applyingId === rec.internship_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Apply Now</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
