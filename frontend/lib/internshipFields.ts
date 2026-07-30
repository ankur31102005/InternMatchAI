// Single source of truth for internship fields, shared by the Excel template,
// the bulk parser, and the manual-entry form. Mirrors the backend
// InternshipCreate schema.

export type FieldType = "string" | "text" | "number" | "boolean" | "date"

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  help?: string
  example?: string | number | boolean
}

export const INTERNSHIP_FIELDS: FieldDef[] = [
  { key: "title", label: "Title", type: "string", required: true, placeholder: "Data Analyst Intern", example: "Data Analyst Intern" },
  { key: "company", label: "Company", type: "string", required: true, placeholder: "NITI Aayog", example: "NITI Aayog" },
  { key: "description", label: "Description", type: "text", required: true, placeholder: "Role summary and responsibilities…", example: "Assist the data team with policy dashboards and analysis." },
  { key: "sector", label: "Sector", type: "string", placeholder: "Technology", example: "Policy" },
  { key: "ministry", label: "Ministry / Dept.", type: "string", placeholder: "Ministry of Electronics & IT", example: "NITI Aayog" },
  { key: "location", label: "Location", type: "string", placeholder: "New Delhi", example: "New Delhi" },
  { key: "is_remote", label: "Remote", type: "boolean", help: "true / false", example: false },
  { key: "duration_weeks", label: "Duration (weeks)", type: "number", placeholder: "12", example: 12 },
  { key: "stipend_amount", label: "Stipend amount", type: "number", placeholder: "20000", example: 20000 },
  { key: "stipend_currency", label: "Currency", type: "string", placeholder: "INR", example: "INR" },
  { key: "min_gpa", label: "Minimum GPA", type: "number", placeholder: "7.0", example: 7.0 },
  { key: "required_degree", label: "Required degree", type: "string", placeholder: "B.Tech / B.Sc", example: "B.Tech" },
  { key: "total_seats", label: "Total seats", type: "number", placeholder: "10", example: 10 },
  { key: "is_pm_scheme", label: "PM Scheme", type: "boolean", help: "true / false", example: true },
  { key: "start_date", label: "Start date", type: "date", help: "YYYY-MM-DD", example: "2026-01-15" },
  { key: "end_date", label: "End date", type: "date", help: "YYYY-MM-DD", example: "2026-04-15" },
  { key: "application_deadline", label: "Application deadline", type: "date", help: "YYYY-MM-DD", example: "2025-12-31" },
]

export const REQUIRED_KEYS = INTERNSHIP_FIELDS.filter((f) => f.required).map(
  (f) => f.key
)

function toBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  if (value == null || value === "") return undefined
  const v = String(value).trim().toLowerCase()
  if (["true", "yes", "y", "1"].includes(v)) return true
  if (["false", "no", "n", "0"].includes(v)) return false
  return undefined
}

function toNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function toDateStr(value: unknown): string | undefined {
  if (value == null || value === "") return undefined
  // Excel may hand us a Date object, a serial number, or a string.
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const s = String(value).trim()
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return s // let the backend validate / reject
}

/**
 * Coerce a raw row (from Excel/CSV or the manual form) into a clean
 * InternshipCreate-shaped payload. Returns { payload, errors }.
 */
export function coerceInternship(raw: Record<string, unknown>): {
  payload: Record<string, unknown>
  errors: string[]
} {
  const payload: Record<string, unknown> = {}
  const errors: string[] = []

  for (const field of INTERNSHIP_FIELDS) {
    // Accept both exact key and case-insensitive label matches.
    const rawValue =
      raw[field.key] ??
      raw[field.label] ??
      raw[field.label.toLowerCase()] ??
      raw[field.key.toUpperCase()]

    let value: unknown
    switch (field.type) {
      case "boolean":
        value = toBool(rawValue)
        break
      case "number":
        value = toNumber(rawValue)
        break
      case "date":
        value = toDateStr(rawValue)
        break
      default:
        value = rawValue == null ? undefined : String(rawValue).trim() || undefined
    }

    if (field.required && (value === undefined || value === "")) {
      errors.push(`${field.label} is required`)
    }
    if (value !== undefined) payload[field.key] = value
  }

  return { payload, errors }
}
