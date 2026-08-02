"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { SavedInternshipListResponse } from "@/types"
import { apiFetch } from "@/services/api"
import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"

export function useSavedInternships() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()

  const { data, isLoading } = useQuery<SavedInternshipListResponse>({
    queryKey: ["saved-internships"],
    queryFn: () => apiFetch<SavedInternshipListResponse>("/saved/"),
    enabled: isAuthenticated,
  })

  const savedItems = data?.items ?? []
  const savedIds = new Set(savedItems.map((item) => item.internship_id))

  const isSaved = (internshipId: string) => savedIds.has(internshipId)

  const toggleSave = useMutation({
    mutationFn: async (internshipId: string) => {
      if (isSaved(internshipId)) {
        await apiFetch(`/saved/${internshipId}`, { method: "DELETE" })
        return { internshipId, action: "removed" as const }
      } else {
        await apiFetch(`/saved/${internshipId}`, { method: "POST" })
        return { internshipId, action: "saved" as const }
      }
    },
    onSuccess: ({ action }) => {
      queryClient.invalidateQueries({ queryKey: ["saved-internships"] })
      if (action === "saved") {
        toast.success("Bookmark saved", "Internship added to your saved list.")
      } else {
        toast.info("Bookmark removed", "Internship removed from saved list.")
      }
    },
    onError: (err: any) => {
      toast.error("Error updating saved status", err.message || "Please try again.")
    },
  })

  return {
    savedItems,
    savedIds,
    isSaved,
    toggleSave: (internshipId: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      if (!isAuthenticated) {
        toast.info("Please sign in", "Sign in to save internships.")
        return
      }
      toggleSave.mutate(internshipId)
    },
    isLoading,
    isPending: toggleSave.isPending,
  }
}
