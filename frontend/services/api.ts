import { useAuthStore } from "@/store/authStore"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

interface FetchOptions extends RequestInit {
  json?: any
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (options.json) {
    headers.set("Content-Type", "application/json")
    options.body = JSON.stringify(options.json)
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
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
