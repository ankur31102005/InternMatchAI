"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { apiFetch } from "@/services/api"
import Navbar from "@/components/Navbar"
import { UploadCloud, File, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

export default function ResumeUploadPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    setSuccessMsg(null)
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate size (10 MB limit)
    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setErrorMsg("File size exceeds 10MB limit.")
      return
    }

    // Validate format
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ]
    const ext = selectedFile.name.split(".").pop()?.toLowerCase()
    if (!allowedTypes.includes(selectedFile.type) && ext !== "docx" && ext !== "pdf" && ext !== "doc") {
      setErrorMsg("Invalid file type. Only PDF and DOCX documents are supported.")
      return
    }

    setFile(selectedFile)
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setErrorMsg(null)
    setSuccessMsg(null)
    setIsUploading(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      await apiFetch("/resumes/upload", {
        method: "POST",
        body: formData,
      })

      setSuccessMsg("Resume uploaded successfully! System processing has begun.")
      setFile(null)
      setTimeout(() => {
        router.push("/recommendations")
      }, 2000)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload file.")
    } finally {
      setIsUploading(false)
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

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-12 max-w-2xl">
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Upload Your Resume
          </h1>
          <p className="text-muted-foreground">
            Our AI engine will parse your skills and recommend the best government internship roles.
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 animate-fade-in-up">
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-xl flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative bg-black/20">
              <input
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="font-medium text-white mb-1">Click to select or drag & drop</p>
              <p className="text-muted-foreground text-xs">PDF or DOCX format up to 10MB</p>
            </div>

            {file && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-violet-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-white line-clamp-1">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center space-x-2 glow-primary disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Analyze Resume with AI</span>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
