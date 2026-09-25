import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from '@/api/client'
import { User, UserProfileData } from '@/api/types'

interface SignupInput {
  full_name: string
  email: string
  password: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signin: (email: string, password: string) => Promise<User>
  signup: (values: SignupInput) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateUser: (user: User) => void
  updateProfile: (profile: UserProfileData) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User }>('/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const onUnauthorized = () => setUser(null)
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [refresh])

  const signin = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ user: User }>('/auth/signin', { email, password })
    setUser(data.user)
    return data.user
  }, [])

  const signup = useCallback(async (values: SignupInput) => {
    const { data } = await api.post<{ user: User }>('/auth/signup', values)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // still clear local state
    } finally {
      setUser(null)
    }
  }, [])

  const updateUser = useCallback((u: User) => setUser(u), [])
  const updateProfile = useCallback((profile: UserProfileData) => {
    setUser((prev) => (prev ? { ...prev, profile } : prev))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, logout, refresh, updateUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}