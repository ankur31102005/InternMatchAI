"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  User,
  Phone,
  Mail,
  Save,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  BadgeCheck,
  Sparkles,
  Eye,
  X,
} from "lucide-react"
import type { Resume } from "@/types"
import { useAuthStore } from "@/store/authStore"
import { apiFetch, apiOpenFile } from "@/services/api"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { Input, Label, FieldError } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/ui/Avatar"
import { Modal } from "@/components/ui/Modal"
import { formatDate } from "@/lib/format"
import { toast } from "@/store/toastStore"

const profileSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z.string().optional(),
})
type ProfileFormValues = z.infer<typeof profileSchema>

interface EduItem {
  id: string
  institution: string
  degree: string
  year: string
}
interface ExpItem {
  id: string
  role: string
  org: string
  period: string
}
interface CertItem {
  id: string
  name: string
  issuer: string
}
interface ProfileDetails {
  education: EduItem[]
  experience: ExpItem[]
  certificates: CertItem[]
}

interface SkillItem {
  id: string
  name: string
}

function newId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.round(Math.random() * 1e6)}`
  }
}

export default function ProfilePage() {
  const { user, token, setAuth } = useAuthStore()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema) })

  useEffect(() => {
    if (user) {
      setValue("full_name", user.full_name)
      setValue("phone", user.phone || "")
    }
  }, [user, setValue])

  const { data: resumes } = useQuery<Resume[]>({
    queryKey: ["resumes"],
    queryFn: () => apiFetch<Resume[]>("/resumes/"),
    retry: false,
  })
  const activeResume = resumes?.find((r) => r.is_active) ?? resumes?.[0]
  const resumeSkills = (activeResume?.skills ?? []) as SkillItem[]

  // Backend-persisted profile details
  const { data: details } = useQuery<ProfileDetails>({
    queryKey: ["profile-details"],
    queryFn: () => apiFetch<ProfileDetails>("/users/profile/details"),
    retry: false,
  })

  const saveDetails = useMutation({
    mutationFn: (d: ProfileDetails) =>
      apiFetch<ProfileDetails>("/users/profile/details", {
        method: "PUT",
        json: d,
      }),
    onSuccess: (saved) => queryClient.setQueryData(["profile-details"], saved),
    onError: (err: any) =>
      toast.error("Save failed", err.message || "Please try again."),
  })

  const current: ProfileDetails = {
    education: details?.education ?? [],
    experience: details?.experience ?? [],
    certificates: details?.certificates ?? [],
  }

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true)
    try {
      const updated = await apiFetch<any>("/users/profile", {
        method: "PATCH",
        json: data,
      })
      if (token) setAuth(updated, token)
      toast.success("Profile updated", "Your details have been saved.")
    } catch (err: any) {
      toast.error("Update failed", err.message || "Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const viewResume = async () => {
    if (!activeResume) return
    try {
      await apiOpenFile(`/resumes/${activeResume.id}/file`)
    } catch (err: any) {
      toast.error("Cannot open resume", err.message || "Please try again.")
    }
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          My profile
        </h1>
        <p className="mt-1 text-muted-foreground">
          Keep your information up to date to improve match quality.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
            <Avatar
              name={user?.full_name}
              size={80}
              className="mx-auto rounded-2xl"
            />
            <h2 className="mt-4 font-heading text-lg font-semibold text-foreground">
              {user?.full_name}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-3 flex justify-center gap-2">
              {user?.is_verified ? (
                <Badge variant="success">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </Badge>
              ) : (
                <Badge variant="warning">Unverified</Badge>
              )}
            </div>
            <div className="mt-5 border-t border-border pt-4 text-left text-sm">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium text-foreground">
                  {formatDate(user?.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Skills on file</span>
                <span className="font-medium text-foreground">
                  {resumeSkills.length}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Sections */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal info */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
              <User className="h-5 w-5 text-primary" /> Personal information
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  icon={Mail}
                  value={user?.email || ""}
                  disabled
                  className="opacity-70"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Email cannot be changed.
                </p>
              </div>
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  icon={User}
                  error={!!errors.full_name}
                  {...register("full_name")}
                />
                <FieldError>{errors.full_name?.message}</FieldError>
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  icon={Phone}
                  placeholder="+91 98765 43210"
                  {...register("phone")}
                />
              </div>
              <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                {!isSubmitting && <Save className="h-4 w-4" />}
                Save changes
              </Button>
            </form>
          </section>

          {/* Skills */}
          <SkillsSection
            skills={resumeSkills}
            hasResume={!!activeResume}
          />

          <EducationSection
            items={current.education}
            onAdd={(item) => {
              saveDetails.mutate({
                ...current,
                education: [...current.education, { ...item, id: newId() }],
              })
              toast.success("Education added")
            }}
            onRemove={(id) =>
              saveDetails.mutate({
                ...current,
                education: current.education.filter((e) => e.id !== id),
              })
            }
          />
          <ExperienceSection
            items={current.experience}
            onAdd={(item) => {
              saveDetails.mutate({
                ...current,
                experience: [...current.experience, { ...item, id: newId() }],
              })
              toast.success("Experience added")
            }}
            onRemove={(id) =>
              saveDetails.mutate({
                ...current,
                experience: current.experience.filter((e) => e.id !== id),
              })
            }
          />
          <CertificatesSection
            items={current.certificates}
            onAdd={(item) => {
              saveDetails.mutate({
                ...current,
                certificates: [...current.certificates, { ...item, id: newId() }],
              })
              toast.success("Certificate added")
            }}
            onRemove={(id) =>
              saveDetails.mutate({
                ...current,
                certificates: current.certificates.filter((c) => c.id !== id),
              })
            }
          />

          {/* Resume */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
              <FileText className="h-5 w-5 text-primary" /> Resume
            </h3>
            {activeResume ? (
              <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {activeResume.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {formatDate(activeResume.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeResume.is_processed && (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Processed
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={viewResume}>
                    <Eye className="h-4 w-4" /> View
                  </Button>
                  <Button href="/upload" variant="ghost" size="sm">
                    Replace
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <p className="mb-3 text-sm text-muted-foreground">
                  No resume on file yet.
                </p>
                <Button href="/upload" variant="primary" size="sm">
                  <UploadCloud className="h-4 w-4" /> Upload resume
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  )
}

/* ── Skills (resume skills + manual add) ── */
function SkillsSection({
  skills,
  hasResume,
}: {
  skills: SkillItem[]
  hasResume: boolean
}) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState("")

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["resumes"] })

  const addSkill = useMutation({
    mutationFn: (name: string) =>
      apiFetch<SkillItem[]>("/resumes/skills", {
        method: "POST",
        json: { name },
      }),
    onSuccess: () => {
      setValue("")
      invalidate()
    },
    onError: (err: any) =>
      toast.error("Could not add skill", err.message || "Please try again."),
  })

  const removeSkill = useMutation({
    mutationFn: (id: string) =>
      apiFetch<SkillItem[]>(`/resumes/skills/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = value.trim()
    if (!name) return
    addSkill.mutate(name)
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <h3 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
        <Sparkles className="h-5 w-5 text-primary" /> Skills
      </h3>

      {skills.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {skills.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-foreground"
            >
              {s.name}
              <button
                type="button"
                onClick={() => removeSkill.mutate(s.id)}
                className="rounded-full text-muted-foreground transition-colors hover:text-destructive"
                aria-label={`Remove ${s.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mb-4 rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {hasResume
            ? "No skills yet. Add them below or re-upload your resume."
            : "Upload a resume to auto-extract skills, or add them manually below."}
        </p>
      )}

      {hasResume ? (
        <form onSubmit={submit} className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Add a skill (e.g. Python, Excel)"
            className="flex-1"
          />
          <Button type="submit" loading={addSkill.isPending} disabled={!value.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
      ) : (
        <Button href="/upload" variant="outline" size="sm">
          <UploadCloud className="h-4 w-4" /> Upload resume
        </Button>
      )}
    </section>
  )
}

/* ── Education ── */
function EducationSection({
  items,
  onAdd,
  onRemove,
}: {
  items: EduItem[]
  onAdd: (item: Omit<EduItem, "id">) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ institution: "", degree: "", year: "" })

  const save = () => {
    if (!form.institution.trim() || !form.degree.trim()) return
    onAdd(form)
    setForm({ institution: "", degree: "", year: "" })
    setOpen(false)
  }

  return (
    <ProfileListSection
      icon={GraduationCap}
      title="Education"
      onAdd={() => setOpen(true)}
      empty={items.length === 0}
      emptyText="Add your degrees and institutions."
    >
      {items.map((e) => (
        <ListRow
          key={e.id}
          title={e.degree}
          subtitle={e.institution}
          meta={e.year}
          onRemove={() => onRemove(e.id)}
        />
      ))}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add education"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Add</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Degree / Programme</Label>
            <Input
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value })}
              placeholder="B.Tech Computer Science"
            />
          </div>
          <div>
            <Label>Institution</Label>
            <Input
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              placeholder="IIIT Delhi"
            />
          </div>
          <div>
            <Label>Year</Label>
            <Input
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="2022 – 2026"
            />
          </div>
        </div>
      </Modal>
    </ProfileListSection>
  )
}

/* ── Experience ── */
function ExperienceSection({
  items,
  onAdd,
  onRemove,
}: {
  items: ExpItem[]
  onAdd: (item: Omit<ExpItem, "id">) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ role: "", org: "", period: "" })

  const save = () => {
    if (!form.role.trim() || !form.org.trim()) return
    onAdd(form)
    setForm({ role: "", org: "", period: "" })
    setOpen(false)
  }

  return (
    <ProfileListSection
      icon={Briefcase}
      title="Experience"
      onAdd={() => setOpen(true)}
      empty={items.length === 0}
      emptyText="Add internships, projects or work experience."
    >
      {items.map((e) => (
        <ListRow
          key={e.id}
          title={e.role}
          subtitle={e.org}
          meta={e.period}
          onRemove={() => onRemove(e.id)}
        />
      ))}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add experience"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Add</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Role / Title</Label>
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="Data Analyst Intern"
            />
          </div>
          <div>
            <Label>Organisation</Label>
            <Input
              value={form.org}
              onChange={(e) => setForm({ ...form, org: e.target.value })}
              placeholder="NITI Aayog"
            />
          </div>
          <div>
            <Label>Period</Label>
            <Input
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              placeholder="Jun 2024 – Aug 2024"
            />
          </div>
        </div>
      </Modal>
    </ProfileListSection>
  )
}

/* ── Certificates ── */
function CertificatesSection({
  items,
  onAdd,
  onRemove,
}: {
  items: CertItem[]
  onAdd: (item: Omit<CertItem, "id">) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", issuer: "" })

  const save = () => {
    if (!form.name.trim()) return
    onAdd(form)
    setForm({ name: "", issuer: "" })
    setOpen(false)
  }

  return (
    <ProfileListSection
      icon={Award}
      title="Certificates"
      onAdd={() => setOpen(true)}
      empty={items.length === 0}
      emptyText="Add certifications and credentials."
    >
      {items.map((c) => (
        <ListRow
          key={c.id}
          title={c.name}
          subtitle={c.issuer}
          onRemove={() => onRemove(c.id)}
        />
      ))}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add certificate"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Add</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Certificate name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Google Data Analytics"
            />
          </div>
          <div>
            <Label>Issuer</Label>
            <Input
              value={form.issuer}
              onChange={(e) => setForm({ ...form, issuer: e.target.value })}
              placeholder="Coursera"
            />
          </div>
        </div>
      </Modal>
    </ProfileListSection>
  )
}

/* ── Shared building blocks ── */
function ProfileListSection({
  icon: Icon,
  title,
  onAdd,
  empty,
  emptyText,
  children,
}: {
  icon: typeof Award
  title: string
  onAdd: () => void
  empty: boolean
  emptyText: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </h3>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      {empty ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <div className="space-y-2.5">{children}</div>
      )}
    </section>
  )
}

function ListRow({
  title,
  subtitle,
  meta,
  onRemove,
}: {
  title: string
  subtitle: string
  meta?: string
  onRemove: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {subtitle}
          {meta ? ` · ${meta}` : ""}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remove"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
