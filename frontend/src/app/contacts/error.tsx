'use client'

export default function ContactsError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  // Log for debugging
  console.error('[contacts] runtime error', error)
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 rounded-lg border bg-red-50 border-red-200 text-red-800">
      <h2 className="text-lg font-semibold mb-2">Something went wrong loading Contacts</h2>
      <p className="text-sm mb-4">{error.message || 'Unknown error'}</p>
      <button onClick={() => reset()} className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700">Try again</button>
    </div>
  )
}

