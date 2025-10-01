'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try { await login(email, password); router.push('/start') } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Login failed') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <input className="w-full border rounded px-3 py-2" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button disabled={isLoading} className="w-full rounded bg-indigo-600 text-white py-2">Sign in</button>
        <a href="/register" className="text-sm text-indigo-600">Create an account</a>
      </form>
    </div>
  )
}
