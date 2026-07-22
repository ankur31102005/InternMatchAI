"use client"

import { useEffect, useState } from "react"

/**
 * Persist a small list to localStorage. Used for profile sections
 * (education, experience, certificates) that have no backend endpoint yet,
 * so the UI stays functional without touching the API.
 */
export function useLocalList<T extends { id: string }>(
  key: string
): {
  items: T[]
  add: (item: Omit<T, "id">) => void
  remove: (id: string) => void
  ready: boolean
} {
  const [items, setItems] = useState<T[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // ignore
    }
    setReady(true)
  }, [key])

  const persist = (next: T[]) => {
    setItems(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const add = (item: Omit<T, "id">) => {
    const id = `${Date.now()}-${Math.floor(performance.now())}`
    persist([...items, { ...item, id } as T])
  }

  const remove = (id: string) => persist(items.filter((i) => i.id !== id))

  return { items, add, remove, ready }
}
