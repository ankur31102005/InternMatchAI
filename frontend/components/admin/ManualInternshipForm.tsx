"use client"

import { useState } from "react"
import { Plus, RotateCcw } from "lucide-react"
import { apiFetch } from "@/services/api"
import { Input, Textarea, Label, FieldError } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { INTERNSHIP_FIELDS, coerceInternship } from "@/lib/internshipFields"
import { toast } from "@/store/toastStore"

type FormState = Record<string, string | boolean>

const initialState: FormState = INTERNSHIP_FIELDS.reduce((acc, f) => {
  acc[f.key] = f.type === "boolean" ? (f.key === "is_pm_scheme" ? true : false) : ""
  return acc
}, {} as FormState)

export function ManualInternshipForm() {
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const reset = () => {
    setForm(initialState)
    setErrors([])
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { payload, errors: errs } = coerceInternship(form)
    setErrors(errs)
    if (errs.length > 0) {
      toast.error("Missing required fields", errs.join(", "))
      return
    }
    setSubmitting(true)
    try {
      await apiFetch("/internships/", { method: "POST", json: payload })
      toast.success("Internship created", `${payload.title} is now live.`)
      reset()
    } catch (err: any) {
      toast.error("Couldn't create internship", err.message || "Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const textFields = INTERNSHIP_FIELDS.filter(
    (f) => f.type !== "boolean" && f.type !== "text"
  )
  const boolFields = INTERNSHIP_FIELDS.filter((f) => f.type === "boolean")
  const descField = INTERNSHIP_FIELDS.find((f) => f.key === "description")!

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Title + company first, full width each on mobile */}
        {textFields
          .filter((f) => ["title", "company"].includes(f.key))
          .map((f) => (
            <div key={f.key}>
              <Label htmlFor={f.key}>
                {f.label} {f.required && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id={f.key}
                value={String(form[f.key] ?? "")}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
            </div>
          ))}
      </div>

      {/* Description full width */}
      <div className="mt-5">
        <Label htmlFor="description">
          {descField.label} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          rows={4}
          value={String(form.description ?? "")}
          onChange={(e) => set("description", e.target.value)}
          placeholder={descField.placeholder}
        />
      </div>

      {/* Remaining fields */}
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {textFields
          .filter((f) => !["title", "company"].includes(f.key))
          .map((f) => (
            <div key={f.key}>
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input
                id={f.key}
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                step={f.key === "min_gpa" ? "0.1" : undefined}
                value={String(form[f.key] ?? "")}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
              />
              {f.help && (
                <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>
              )}
            </div>
          ))}
      </div>

      {/* Booleans */}
      <div className="mt-6 flex flex-wrap gap-6">
        {boolFields.map((f) => (
          <label
            key={f.key}
            className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground"
          >
            <input
              type="checkbox"
              checked={Boolean(form[f.key])}
              onChange={(e) => set(f.key, e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring/40"
            />
            {f.label}
          </label>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="mt-5">
          <FieldError>{errors.join(", ")}</FieldError>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button type="submit" loading={submitting}>
          {!submitting && <Plus className="h-4 w-4" />} Create internship
        </Button>
        <Button type="button" variant="ghost" onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Clear
        </Button>
      </div>
    </form>
  )
}
