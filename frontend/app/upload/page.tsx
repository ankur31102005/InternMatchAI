"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ShieldCheck,
  Cpu,
} from "lucide-react"
import { apiUpload } from "@/services/api"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { Button } from "@/components/ui/Button"
import { fileSize } from "@/lib/format"
import { toast } from "@/store/toastStore"

const ACCEPTED = [".pdf", ".docx", ".doc"]
const MAX_SIZE = 10 * 1024 * 1024

export default function UploadPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const validate = (f: File): string | null => {
    const ext = "." + (f.name.split(".").pop()?.toLowerCase() ?? "")
    if (!ACCEPTED.includes(ext)) return "Only PDF and DOCX files are supported."
    if (f.size > MAX_SIZE) return "File exceeds the 10 MB size limit."
    return null
  }

  const selectFile = (f?: File | null) => {
    setError(null)
    setSuccess(false)
    if (!f) return
    const err = validate(f)
    if (err) {
      setError(err)
      return
    }
    setFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    selectFile(e.dataTransfer.files?.[0])
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append("file", file)
    try {
      await apiUpload("/resumes/upload", formData)
      setSuccess(true)
      setFile(null)
      queryClient.invalidateQueries({ queryKey: ["resumes"] })
      queryClient.invalidateQueries({ queryKey: ["recommendations"] })
      toast.success("Resume uploaded", "Analysing your skills now…")
      setTimeout(() => router.push("/recommendations"), 2000)
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI resume analysis
          </span>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Upload your resume
          </h1>
          <p className="mt-2 text-muted-foreground">
            Our AI extracts your skills and instantly ranks matching internships.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Resume uploaded successfully
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Redirecting you to your AI recommendations…
              </p>
            </motion.div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
                }
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                  dragging
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/50 hover:bg-muted/40"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED.join(",")}
                  className="hidden"
                  onChange={(e) => selectFile(e.target.files?.[0])}
                />
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
                  <UploadCloud className="h-7 w-7" />
                </span>
                <p className="font-medium text-foreground">
                  Drag &amp; drop your resume here
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or click to browse — PDF or DOCX, up to 10 MB
                </p>
              </div>

              {file && (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-border p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file}
                loading={uploading}
                size="lg"
                className="mt-6 w-full"
              >
                {!uploading && <Sparkles className="h-4 w-4" />}
                {uploading ? "Analysing…" : "Analyse with AI"}
              </Button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" /> Private &amp;
                  secure
                </span>
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-primary" /> AI skill extraction
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
