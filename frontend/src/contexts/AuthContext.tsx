'use client'
import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  plan: string
  discoveryLimit: number
  discoveryCount: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, plan?: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('[AuthProvider] Component mounted/rendered')

  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    console.log('[AuthProvider] useEffect - checking stored token:', stored ? 'EXISTS' : 'NONE')
    if (stored) {
      fetchMe(stored)
    } else {
      console.log('[AuthProvider] No stored token, setting isLoading=false')
      setIsLoading(false)
    }
  }, [])

  const fetchMe = async (t: string) => {
    console.log('[AuthProvider] fetchMe - attempting to validate token')
    try {
      const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      const data = await res.json()
      console.log('[AuthProvider] fetchMe response:', { success: data.success, status: res.status })
      if (data.success) {
        console.log('[AuthProvider] Token valid, setting user:', data.user?.email)
        setUser(data.user)
        setToken(t)
      } else {
        console.log('[AuthProvider] Token invalid, removing from localStorage')
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('[AuthProvider] fetchMe error:', error)
      localStorage.removeItem('auth_token')
    } finally {
      console.log('[AuthProvider] fetchMe complete, setting isLoading=false')
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Login failed')
    setUser(data.user); setToken(data.token); localStorage.setItem('auth_token', data.token)
  }

  const register = async (email: string, password: string, plan = 'free') => {
    const res = await fetch(`${API}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, plan }) })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Registration failed')
    setUser(data.user); setToken(data.token); localStorage.setItem('auth_token', data.token)
  }

  const logout = () => { setUser(null); setToken(null); localStorage.removeItem('auth_token') }

  console.log('[AuthProvider] Rendering with state:', { hasUser: !!user, hasToken: !!token, isLoading })

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

