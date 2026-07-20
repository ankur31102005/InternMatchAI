import { create } from "zustand"

interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  is_active: boolean
  is_verified: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("auth_token") : null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem("auth_token", token)
    set({ user, token, isAuthenticated: true, isLoading: false })
  },

  clearAuth: () => {
    localStorage.removeItem("auth_token")
    set({ user: null, token: null, isAuthenticated: false, isLoading: false })
  },

  setLoading: (loading) => set({ isLoading: loading }),
}))
