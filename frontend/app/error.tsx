"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          An unexpected error occurred. You can try again or head back to safety.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={reset} variant="primary">
            <RotateCcw className="h-4 w-4" /> Try again
          </Button>
          <Button href="/" variant="outline">
            <Home className="h-4 w-4" /> Go home
          </Button>
        </div>
      </div>
    </div>
  )
}
