"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  GraduationCap,
  MapPin,
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  X,
  Plus,
  BookOpen,
} from "lucide-react"
import type { StudentProfileData, Resume } from "@/types"
import { useAuthStore } from "@/store/authStore"
import { apiFetch, apiUpload } from "@/services/api"
import { AuthGuard } from "@/components/layout/AuthGuard"
import { Input, Label } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { toast } from "@/store/toastStore"
import { fileSize } from "@/lib/format"

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingFlow />
    </AuthGuard>
  )
}

function OnboardingFlow() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1 Form state
  const [location, setLocation] = useState("")
  const [university, setUniversity] = useState("")
  const [degree, setDegree] = useState("")
  const [major, setMajor] = useState("")
  const [gpa, setGpa] = useState("")
  const [bio, setBio] = useState("")

  // Step 2 Skills state
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")

  // Step 3 Resume Upload state
  const inputRef = useRef<HTMLInputElement>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeSuccess, setResumeSuccess] = useState(false)

  // Fetch current profile
  const { data: profile } = useQuery<StudentProfileData>({
    queryKey: ["profile-me"],
    queryFn: () => apiFetch<StudentProfileData>("/profile/me"),
  })

  // If user already completed onboarding, redirect to dashboard
  useEffect(() => {
    if (profile && profile.is_onboarding_completed) {
      router.replace("/dashboard")
    }
  }, [profile, router])

  // Populate initial values from DB profile
  useEffect(() => {
    if (profile) {
      if (profile.location) setLocation(profile.location)
      if (profile.university) setUniversity(profile.university)
      if (profile.degree) setDegree(profile.degree)
      if (profile.major) setMajor(String(profile.major))
      if (profile.gpa) setGpa(profile.gpa)
      if (profile.bio) setBio(profile.bio)
      if (profile.skills && profile.skills.length > 0) setSkills(profile.skills)
    }
  }, [profile])

  // Mutation to update profile in backend
  const updateProfileMutation = useMutation({
    mutationFn: (payload: Partial<StudentProfileData>) =>
      apiFetch<StudentProfileData>("/profile/me", {
        method: "PUT",
        json: payload,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["profile-me"], updated)
    },
  })

  // Complete Onboarding and redirect
  const finishOnboarding = async (finalSkills?: string[]) => {
    setSubmitting(true)
    try {
      await updateProfileMutation.mutateAsync({
        location,
        university,
        degree,
        major,
        gpa,
        bio,
        skills: finalSkills ?? skills,
        is_onboarding_completed: true,
      })
      queryClient.invalidateQueries({ queryKey: ["profile-me"] })
      toast.success("Setup complete!", "Welcome to InternMatch AI.")
      router.push("/dashboard")
    } catch (err: any) {
      toast.error("Could not complete setup", err.message || "Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Step 1 Next
  const handleStep1Next = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        location,
        university,
        degree,
        major,
        gpa,
        bio,
      })
    } catch {
      // ignore
    }
    setStep(2)
  }

  // Handle Step 2 Next
  const handleStep2Next = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        skills,
      })
    } catch {
      // ignore
    }
    setStep(3)
  }

  // Add skill
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const name = skillInput.trim()
    if (!name || skills.includes(name)) return
    const updated = [...skills, name]
    setSkills(updated)
    setSkillInput("")
  }

  const handleRemoveSkill = (name: string) => {
    setSkills(skills.filter((s) => s !== name))
  }

  // Resume upload handler
  const handleResumeUpload = async () => {
    if (!resumeFile) return
    setUploadingResume(true)
    const formData = new FormData()
    formData.append("file", resumeFile)
    try {
      await apiUpload("/resumes/upload", formData)
      setResumeSuccess(true)
      queryClient.invalidateQueries({ queryKey: ["resumes"] })
      toast.success("Resume uploaded", "Extracted skills added.")
    } catch (err: any) {
      toast.error("Upload failed", err.message || "Please try again.")
    } finally {
      setUploadingResume(false)
    }
  }

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header bar */}
      <div className="mx-auto w-full max-w-2xl text-center mb-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Welcome, {user?.full_name?.split(" ")[0] || "User"}
        </span>
        <h1 className="mt-3 font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Let&apos;s set up your profile
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Step {step} of 3 — {step === 1 ? "Basic Info" : step === 2 ? "Skills" : "Resume Upload"}
        </p>

        {/* Progress Bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Card Content */}
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="border-b border-border pb-4">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Step 1: Academic &amp; Personal Info
                </h2>
                <p className="text-xs text-muted-foreground">
                  Help employers know where you study and what you&apos;re pursuing.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="university">University / College</Label>
                  <Input
                    id="university"
                    icon={GraduationCap}
                    placeholder="IIT Delhi / Delhi University"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="degree">Degree / Programme</Label>
                  <Input
                    id="degree"
                    icon={BookOpen}
                    placeholder="B.Tech Computer Science"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="major">Major / Specialisation</Label>
                  <Input
                    id="major"
                    placeholder="Computer Science"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location / City</Label>
                  <Input
                    id="location"
                    icon={MapPin}
                    placeholder="New Delhi, India"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="gpa">GPA / Marks</Label>
                  <Input
                    id="gpa"
                    placeholder="8.5 / 10"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio / Career Objective</Label>
                <Input
                  id="bio"
                  placeholder="Passionate CS undergraduate eager to work on impactful projects..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between border-t border-border pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(2)}
                >
                  <SkipForward className="h-4 w-4" /> Skip this step
                </Button>
                <Button type="button" variant="primary" onClick={handleStep1Next}>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="border-b border-border pb-4">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Step 2: Add Your Skills
                </h2>
                <p className="text-xs text-muted-foreground">
                  Enter key technical &amp; soft skills to power AI internship matching.
                </p>
              </div>

              <div>
                <form onSubmit={handleAddSkill} className="flex gap-2">
                  <Input
                    placeholder="Type a skill (e.g. Python, React, SQL, Financial Analysis)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!skillInput.trim()}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </form>
              </div>

              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 min-h-[80px] rounded-xl border border-border p-4 bg-muted/30">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm font-semibold text-foreground shadow-xs"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="rounded-full text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No skills added yet. Type a skill above or click Skip.
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(3)}
                  >
                    <SkipForward className="h-4 w-4" /> Skip
                  </Button>
                  <Button type="button" variant="primary" onClick={handleStep2Next}>
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="border-b border-border pb-4">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  Step 3: Upload Resume
                </h2>
                <p className="text-xs text-muted-foreground">
                  Upload your CV for automated skill extraction and instant ranking.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="rounded-xl border border-dashed border-border p-6 text-center bg-muted/20">
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
                {resumeSuccess ? (
                  <div className="space-y-2 py-2">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
                    <p className="text-sm font-semibold text-foreground">
                      Resume uploaded successfully!
                    </p>
                  </div>
                ) : resumeFile ? (
                  <div className="space-y-3">
                    <FileText className="mx-auto h-8 w-8 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      {resumeFile.name} ({fileSize(resumeFile.size)})
                    </p>
                    <Button
                      type="button"
                      loading={uploadingResume}
                      onClick={handleResumeUpload}
                      size="sm"
                    >
                      <UploadCloud className="h-4 w-4" /> Upload Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => inputRef.current?.click()}
                      >
                        Select Resume (PDF/DOCX)
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 10 MB
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    loading={submitting}
                    onClick={() => finishOnboarding()}
                  >
                    Skip &amp; Finish
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    loading={submitting}
                    onClick={() => finishOnboarding()}
                  >
                    Finish Onboarding <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
