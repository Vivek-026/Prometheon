export type Role = "admin" | "task_manager" | "coder"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar_url?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}
