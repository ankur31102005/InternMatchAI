import { useAuthStore } from "@/store/authStore"

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

interface FetchOptions extends RequestInit {
  json?: any
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
      errorDetail = errBody.detail || errBody.error || errorDetail
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
      errorDetail = errBody.detail || errBody.error || errorDetail
    } catch {
      // ignore
    }
    throw new Error(errorDetail)
  }

  return response.json() as Promise<T>
}
