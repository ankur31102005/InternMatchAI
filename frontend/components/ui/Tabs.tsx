"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Tab {
  key: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-muted p-1">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-surface text-primary shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
