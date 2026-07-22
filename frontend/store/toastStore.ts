import { create } from "zustand"

export type ToastVariant = "success" | "error" | "info" | "warning"

export interface Toast {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, "id">) => void
  dismiss: (id: number) => void
}

let counter = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++counter
    set((state) => ({ toasts: [...state.toasts, { ...t, id }] }))
    // Auto-dismiss after 4.5s
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) }))
    }, 4500)
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) })),
}))

/** Convenience helper: `toast.success("Saved")` */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: "error" }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: "info" }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: "warning" }),
}
