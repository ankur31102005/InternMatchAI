"use client"

import { useEffect, useRef, useState } from "react"
import { animate, useInView } from "framer-motion"

/**
 * Animates a numeric value up from 0 when scrolled into view. Accepts display
 * strings like "12,400+", "2.1L+", "94%" — it animates the leading number and
 * preserves the suffix.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const [display, setDisplay] = useState("0")

  const match = value.match(/^([\d.,]+)(.*)$/)
  const target = match ? parseFloat(match[1].replace(/,/g, "")) : NaN
  const suffix = match ? match[2] : value
  const decimals = match && match[1].includes(".") ? 1 : 0

  useEffect(() => {
    if (!inView || Number.isNaN(target)) {
      if (Number.isNaN(target)) setDisplay(value)
      return
    }
    const controls = animate(0, target, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => {
        const formatted =
          decimals > 0
            ? v.toFixed(1)
            : Math.round(v).toLocaleString("en-IN")
        setDisplay(formatted)
      },
    })
    return () => controls.stop()
  }, [inView, target, decimals, value])

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  )
}
