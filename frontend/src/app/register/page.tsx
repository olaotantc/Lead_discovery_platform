'use client'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RegisterPage() {
  const { register, loginWithGoogle, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState('free')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    try {
      await register(email, password, plan)
      router.push('/start')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">Create account</h1>

        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full flex items-center justify-center gap-3 rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            type="password"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="free">Free (10 discoveries/mo)</option>
            <option value="starter">Starter (50 discoveries/mo)</option>
            <option value="pro">Pro (250 discoveries/mo)</option>
          </select>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-indigo-600 text-white py-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
