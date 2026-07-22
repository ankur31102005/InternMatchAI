import { initials as toInitials } from "@/lib/format"
import { cn } from "@/lib/utils"

export function Avatar({
  name,
  size = 40,
  className,
  color,
}: {
  name?: string | null
  size?: number
  className?: string
  color?: string
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-heading font-semibold text-white",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: color ?? "hsl(var(--primary))",
      }}
      aria-hidden
    >
      {toInitials(name)}
    </div>
  )
}
