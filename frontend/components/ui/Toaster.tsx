"use client"

import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react"
import { useToastStore, type ToastVariant } from "@/store/toastStore"

const config: Record<
  ToastVariant,
  { icon: typeof Info; ring: string; text: string }
> = {
  success: { icon: CheckCircle2, ring: "border-success/30", text: "text-success" },
  error: { icon: XCircle, ring: "border-destructive/30", text: "text-destructive" },
  info: { icon: Info, ring: "border-primary/30", text: "text-primary" },
  warning: { icon: AlertTriangle, ring: "border-amber-300", text: "text-amber-600" },
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { icon: Icon, ring, text } = config[t.variant]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border ${ring} bg-card p-4 shadow-card-hover`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${text}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
