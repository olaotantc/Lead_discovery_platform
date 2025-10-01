'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegisterPage() {
  const { register, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState('free')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('Password too short'); return }
    try { await register(email, password, plan); router.push('/start') } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Registration failed') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow w-full max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">Create account</h1>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <input className="w-full border rounded px-3 py-2" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password (min 8 chars)" value={password} onChange={e=>setPassword(e.target.value)} required />
        <select className="w-full border rounded px-3 py-2" value={plan} onChange={e=>setPlan(e.target.value)}>
          <option value="free">Free (10/mo)</option>
          <option value="starter">Starter (50/mo)</option>
          <option value="pro">Pro (250/mo)</option>
        </select>
        <button disabled={isLoading} className="w-full rounded bg-indigo-600 text-white py-2">Create account</button>
        <a href="/login" className="text-sm text-indigo-600">Already have an account? Sign in</a>
      </form>
    </div>
  )
}
