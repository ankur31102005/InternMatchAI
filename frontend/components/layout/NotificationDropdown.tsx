"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, CheckCheck, Inbox, Clock } from "lucide-react"
import type { NotificationListResponse, UnreadCountResponse } from "@/types"
import { apiFetch } from "@/services/api"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

export function NotificationDropdown({ isAuthenticated }: { isAuthenticated: boolean }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Unread count query
  const { data: unreadData } = useQuery<UnreadCountResponse>({
    queryKey: ["notifications-unread-count"],
    queryFn: () => apiFetch<UnreadCountResponse>("/notifications/unread-count"),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })

  // Full notifications list query
  const { data: listData, isLoading } = useQuery<NotificationListResponse>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<NotificationListResponse>("/notifications/"),
    enabled: isAuthenticated && open,
  })

  const unreadCount = unreadData?.count ?? 0
  const notifications = listData?.items ?? []

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
    } catch {
      // ignore
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-surface text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-white shadow-sm animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card p-4 shadow-card-hover"
          >
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-sm font-semibold text-foreground">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {unreadCount} new
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Loading notifications…
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id, n.is_read)}
                    className={cn(
                      "group flex cursor-pointer gap-3 rounded-xl p-3 transition-colors",
                      n.is_read
                        ? "bg-transparent hover:bg-muted/50"
                        : "bg-accent/40 hover:bg-accent/60"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 flex h-2 w-2 shrink-0 rounded-full",
                        n.is_read ? "bg-transparent" : "bg-primary"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {n.title}
                        </p>
                        <span className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 leading-relaxed text-xs text-muted-foreground">
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
