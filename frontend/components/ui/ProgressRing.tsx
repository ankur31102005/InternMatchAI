"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  value: number // 0 - 100
  size?: number
  strokeWidth?: number
  className?: string
  label?: string
  animate?: boolean
}

function ringColor(value: number): string {
  if (value >= 75) return "hsl(var(--success))"
  if (value >= 50) return "hsl(var(--primary))"
  if (value >= 25) return "hsl(var(--saffron))"
  return "hsl(var(--destructive))"
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  className,
  label = "Match",
  animate = true,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference
  const color = ringColor(clamped)

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: animate ? circumference : offset }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-heading font-extrabold leading-none"
          style={{ fontSize: size * 0.24, color }}
        >
          {Math.round(clamped)}%
        </span>
        {label && (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
