import { useAuthStore } from "@/store/authStore"

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

interface FetchOptions extends RequestInit {
  json?: any
}

/**
 * Turn a FastAPI error body into a readable string. FastAPI returns 422
 * validation errors as `detail: [{ loc, msg, ... }]`, so we flatten those
 * into "field: message" pairs instead of rendering "[object Object]".
 */
function extractErrorMessage(errBody: any, fallback: string): string {
  const detail = errBody?.detail ?? errBody?.error
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    const msgs = detail.map((e) => {
      const loc = Array.isArray(e?.loc) ? e.loc[e.loc.length - 1] : ""
      const field = loc && loc !== "body" ? `${loc}: ` : ""
      return `${field}${e?.msg ?? "invalid value"}`
    })
    return msgs.filter(Boolean).join("; ") || fallback
  }
  if (detail && typeof detail === "object") return detail.msg || fallback
  return fallback
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = useAuthStore.getState().token
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (options.json) {
    headers.set("Content-Type", "application/json")
    options.body = JSON.stringify(options.json)
  }

  const fetchOptions: RequestInit = { ...options }
  delete (fetchOptions as any).json

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    let errorDetail = "An error occurred"
    try {
      const errBody = await response.json()
      errorDetail = extractErrorMessage(errBody, errorDetail)
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

/**
 * Fetch a protected file (with the auth header) and open it in a new tab.
 * Used for viewing resumes — a plain <a href> can't send the JWT, so we pull
 * the bytes as a blob and hand the browser an object URL to render inline.
 */
export async function apiOpenFile(path: string): Promise<void> {
  const token = useAuthStore.getState().token
  const headers = new Headers()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${path}`, { headers })
  if (!response.ok) {
    let errorDetail = "Could not open the file"
    try {
      const errBody = await response.json()
      errorDetail = extractErrorMessage(errBody, errorDetail)
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank", "noopener,noreferrer")
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * Multipart upload helper. Kept separate from apiFetch because FormData must
 * not have its Content-Type set manually (the browser sets the boundary).
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const token = useAuthStore.getState().token
  const headers = new Headers()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  })

  if (!response.ok) {
    let errorDetail = "Upload failed"
    try {
      const errBody = await response.json()
      errorDetail = extractErrorMessage(errBody, errorDetail)
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  return response.json() as Promise<T>
}
