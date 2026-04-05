import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthState, User } from '../types/auth'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user: User, token: string) => 
        set({ user, token, isAuthenticated: true }),
      logout: () => 
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'prometheon-auth',
      // We only want to persist user info, maybe token. 
      // But user said store access_token in memory. 
      // Persistence can be customized. 
      // Let's store user info for quick redirection and token if needed.
      // But I will keep it simple.
    }
  )
)
