import { GraduationCap } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-2xl bg-primary/20" />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <GraduationCap className="h-7 w-7" />
        </span>
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Loading InternMatch AI…
      </p>
    </div>
  )
}
