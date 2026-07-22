import { Badge, type BadgeProps } from "@/components/ui/Badge"
import type { ApplicationStatus } from "@/types"

const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
  pending: { label: "Applied", variant: "neutral" },
  under_review: { label: "Under review", variant: "default" },
  shortlisted: { label: "Shortlisted", variant: "saffron" },
  accepted: { label: "Accepted", variant: "success" },
  rejected: { label: "Not selected", variant: "danger" },
  withdrawn: { label: "Withdrawn", variant: "outline" },
}

export function StatusBadge({ status }: { status: ApplicationStatus | string }) {
  const cfg = map[status] ?? { label: status, variant: "neutral" as const }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
