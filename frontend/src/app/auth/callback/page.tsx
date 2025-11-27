'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function CallbackContent() {
  const { loginWithToken } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(getErrorMessage(errorParam))
      return
    }

    if (token) {
      loginWithToken(token)
        .then(() => {
          router.push('/start')
        })
        .catch((err) => {
          setError(err.message || 'Authentication failed')
        })
    } else {
      setError('No authentication token received')
    }
  }, [searchParams, loginWithToken, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow w-full max-w-sm text-center space-y-4">
          <div className="text-red-500 text-4xl">!</div>
          <h1 className="text-xl font-semibold text-gray-900">Authentication Failed</h1>
          <p className="text-sm text-gray-600">{error}</p>
          <a
            href="/login"
            className="block w-full rounded bg-indigo-600 text-white py-2 text-center hover:bg-indigo-700"
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow w-full max-w-sm text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <h1 className="text-xl font-semibold text-gray-900">Signing you in...</h1>
        <p className="text-sm text-gray-600">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}

function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    oauth_denied: 'You cancelled the sign-in process.',
    no_code: 'No authorization code received from Google.',
    invalid_state: 'Invalid security state. Please try again.',
    token_exchange_failed: 'Failed to verify your Google account.',
    user_info_failed: 'Failed to get your profile from Google.',
    no_email: 'No email address was provided by Google.',
    oauth_failed: 'Something went wrong during sign-in.',
  }
  return messages[errorCode] || 'An unknown error occurred.'
}
