"use client"

import { useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, ShieldCheck, ShieldOff, Users as UsersIcon, BadgeCheck } from "lucide-react"
import type { User } from "@/types"
import { apiFetch } from "@/services/api"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Avatar } from "@/components/ui/Avatar"
import { EmptyState } from "@/components/ui/EmptyState"
import { CardSkeleton } from "@/components/ui/Skeleton"
import { formatDate } from "@/lib/format"
import { toast } from "@/store/toastStore"

export function ManageUsers() {
  const queryClient = useQueryClient()
  const { user: me } = useAuthStore()
  const [search, setSearch] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery<User[]>({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch<User[]>("/users/"),
  })

  const users = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
  }, [users, search])

  const toggleAdmin = async (u: User) => {
    setUpdatingId(u.id)
    try {
      await apiFetch(`/users/${u.id}/role`, {
        method: "PATCH",
        json: { is_admin: !u.is_admin },
      })
      toast.success(
        !u.is_admin ? "Promoted to admin" : "Admin access removed",
        u.full_name
      )
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch (err: any) {
      toast.error("Couldn't update", err.message || "Please try again.")
    } finally {
      setUpdatingId(null)
    }
  }

  const adminCount = users.filter((u) => u.is_admin).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email…"
            aria-label="Search users"
            className="h-11 w-full rounded-xl border border-input bg-surface pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="neutral">{users.length} users</Badge>
          <Badge variant="default">{adminCount} admins</Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={UsersIcon}
          title="Couldn't load users"
          description="Please refresh and try again."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Try a different search term."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="divide-y divide-border">
            {filtered.map((u) => {
              const isSelf = u.id === me?.id
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40"
                >
                  <Avatar name={u.full_name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-foreground">
                      {u.full_name}
                      {isSelf && (
                        <span className="text-xs font-normal text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground md:block">
                    Joined {formatDate(u.created_at)}
                  </span>
                  {u.is_admin ? (
                    <Badge variant="default">
                      <BadgeCheck className="h-3 w-3" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="neutral">Student</Badge>
                  )}
                  <Button
                    variant={u.is_admin ? "ghost" : "outline"}
                    size="sm"
                    loading={updatingId === u.id}
                    disabled={isSelf && u.is_admin}
                    onClick={() => toggleAdmin(u)}
                    title={
                      isSelf && u.is_admin
                        ? "You can't remove your own admin access"
                        : undefined
                    }
                  >
                    {updatingId !== u.id &&
                      (u.is_admin ? (
                        <ShieldOff className="h-4 w-4" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      ))}
                    {u.is_admin ? "Remove admin" : "Make admin"}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
