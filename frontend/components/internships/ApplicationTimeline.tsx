import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const STAGES = [
  { key: "pending", label: "Applied" },
  { key: "under_review", label: "Under review" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "accepted", label: "Decision" },
]

const ORDER: Record<string, number> = {
  pending: 0,
  under_review: 1,
  shortlisted: 2,
  accepted: 3,
  rejected: 3,
}

export function ApplicationTimeline({ status }: { status: string }) {
  const rejected = status === "rejected"
  const withdrawn = status === "withdrawn"
  const current = ORDER[status] ?? 0

  if (withdrawn) {
    return (
      <p className="text-xs font-medium text-muted-foreground">
        Application withdrawn
      </p>
    )
  }

  return (
    <div className="flex items-center">
      {STAGES.map((stage, i) => {
        const reached = i <= current
        const isLast = i === STAGES.length - 1
        const done = reached && !(isLast && rejected)
        return (
          <div key={stage.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors",
                  isLast && rejected
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : done
                      ? "border-success bg-success text-success-foreground"
                      : "border-border bg-surface text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  "mt-1 hidden text-[10px] font-medium sm:block",
                  reached ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {isLast && rejected ? "Not selected" : stage.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1 rounded-full",
                  i < current ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
