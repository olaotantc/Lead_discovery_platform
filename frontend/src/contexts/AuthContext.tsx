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
  loading: boolean // alias for isLoading
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (stored) {
      fetchMe(stored)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchMe = async (t: string) => {
    try {
      const res = await fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        setToken(t)
      } else {
        localStorage.removeItem('auth_token')
      }
    } catch {
      localStorage.removeItem('auth_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Login failed')
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem('auth_token', data.token)
  }

  const register = async (email: string, password: string, plan = 'free') => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, plan })
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || 'Registration failed')
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem('auth_token', data.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
