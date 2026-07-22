// Small, dependency-free formatting helpers used across the UI.

export function formatCurrency(
  amount?: number | null,
  currency = "INR"
): string {
  if (amount == null) return "Unpaid"
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`
  }
}

export function formatStipend(amount?: number | null, currency = "INR"): string {
  if (amount == null) return "Unpaid"
  return `${formatCurrency(amount, currency)}/mo`
}

export function formatDate(value?: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function timeAgo(value?: string | null): string {
  if (!value) return ""
  const d = new Date(value)
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (Number.isNaN(seconds)) return ""
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.34524, "week"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ]
  let unitValue = seconds
  let unitName = "second"
  let divisor = 1
  for (const [amount, name] of units) {
    if (Math.abs(unitValue) < amount) {
      unitName = name
      break
    }
    divisor = amount
    unitValue = unitValue / amount
    unitName = name
  }
  void divisor
  const rounded = Math.floor(unitValue)
  if (rounded <= 0) return "just now"
  return `${rounded} ${unitName}${rounded > 1 ? "s" : ""} ago`
}

export function initials(name?: string | null): string {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/** Safely parse the JSON-string skill arrays the recommendation API returns. */
export function parseSkillList(raw?: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : []
  } catch {
    return []
  }
}

export function matchPercent(score?: number | null): number {
  if (score == null) return 0
  const pct = score <= 1 ? score * 100 : score
  return Math.max(0, Math.min(100, Math.round(pct)))
}

/** Deterministic color for a company badge based on its name. */
export function companyAccent(name: string): string {
  const palette = [
    "#0F4C81",
    "#138808",
    "#E67E00",
    "#1B6CB3",
    "#7A3E9D",
    "#0E7C86",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
