'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle, ShieldCheck, Users, RefreshCcw, Sparkles } from 'lucide-react'

type VerificationStatus = 'unverified' | 'verified' | 'invalid' | 'unknown' | 'pending'

interface ScoreFacet {
  score: number
  maxScore: number
  weight: number
  reasonCodes: string[]
  evidence: Array<{
    reason: string
    source?: string
    timestamp?: string
  }>
}

interface Contact {
  id: string
  name?: string
  firstName?: string
  lastName?: string
  email: string
  role?: string
  title?: string
  domain: string
  pattern?: string
  confidence: number
  verification: { status: VerificationStatus; score?: number }
  sources: Array<{ provider: string; url?: string; notes?: string }>
  score?: number
  scoreFacets?: {
    fit: ScoreFacet
    intent: ScoreFacet
    reachability: ScoreFacet
    recency: ScoreFacet
  }
}

interface DiscoveryData {
  jobId: string
  domain: string
  contacts: Contact[]
  threshold: number
  status: 'pending' | 'completed' | 'failed'
  error?: string
}

type Tone = 'direct' | 'consultative'
interface DraftContent { opener: string; followUp1: string; followUp2: string }
interface DraftJobData {
  jobId: string
  contactId: string
  email: string
  tone: Tone
  drafts: DraftContent
  evidenceLinks: number
  status: 'completed' | 'failed'
  generatedAt: string
}

export default function ContactsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

  const [url, setUrl] = useState('')
  const [roles, setRoles] = useState<string[]>(['Owner/GM', 'Decision Makers'])
  const [threshold, setThreshold] = useState(85)
  const [jobId, setJobId] = useState<string | null>(null)
  const [data, setData] = useState<DiscoveryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftLoadingId, setDraftLoadingId] = useState<string | null>(null)
  const [draftTone, setDraftTone] = useState<Tone>('direct')
  const [latestDraft, setLatestDraft] = useState<DraftJobData | null>(null)

  // Dev diagnostic: log API base and origin to validate CORS/base URL assumptions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.debug('[contacts] apiBase', apiBase, 'origin', window.location.origin, 'protocol', window.location.protocol)
      if (window.location.protocol === 'https:' && apiBase.startsWith('http:')) {
        // eslint-disable-next-line no-console
        console.warn('[contacts] Mixed content risk: HTTPS page calling HTTP API')
      }
    }
  }, [apiBase])

  const filteredContacts = useMemo(() => {
    if (!data) return [] as Contact[]
    return (data.contacts || []).filter((c) => (c.verification.score ?? c.confidence) >= (data.threshold || threshold))
  }, [data, threshold])

  const toggleRole = (r: string) => {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
  }

  const statusIcon = (s: VerificationStatus) => {
    if (s === 'verified') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    if (s === 'invalid') return <XCircle className="h-4 w-4 text-red-600" />
    if (s === 'pending') return <Clock className="h-4 w-4 text-amber-600" />
    return <ShieldCheck className="h-4 w-4 text-neutral-500" />
  }

  const badgeFor = (n?: number) => {
    const v = n ?? 0
    if (v >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (v >= 70) return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-red-50 text-red-700 border-red-200'
  }

  const submit = async () => {
    setError(null)
    setIsLoading(true)
    setData(null)
    setJobId(null)
    try {
      const endpoint = `${apiBase}/api/contacts/discover`
      console.log('🚀 Sending POST to:', endpoint)
      console.log('📦 Body:', { url, roles, threshold })

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, roles, threshold }),
        credentials: 'include',
      })

      console.log('📬 Response status:', res.status)
      console.log('📬 Response headers:', Object.fromEntries(res.headers.entries()))

      const json = await res.json()
      console.log('📬 Response body:', json)

      if (!json.success) throw new Error(json.error || 'Failed to start discovery')
      setJobId(json.jobId)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to start discovery'
      console.error('❌ Error:', e)
      setError(msg)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!jobId) return
    let cancel = false
    const poll = async () => {
      try {
        const res = await fetch(`${apiBase}/api/contacts/${jobId}`, {
          credentials: 'include',
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'Fetch failed')
        setData(json.data)
        if (json.data.status !== 'completed') {
          setTimeout(poll, 1000)
        } else {
          setIsLoading(false)
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Polling failed'
        if (!cancel) setError(msg)
        setIsLoading(false)
      }
    }
    poll()
    return () => {
      cancel = true
    }
  }, [jobId, apiBase])

  const updateThreshold = async (value: number) => {
    setThreshold(value)
    if (!data?.jobId) return
    try {
      await fetch(`${apiBase}/api/contacts/${data.jobId}/confidence`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: value }),
      })
    } catch {}
  }

  const generateDraft = async (c: Contact) => {
    setError(null)
    setDraftLoadingId(c.id)
    setLatestDraft(null)
    try {
      const res = await fetch(`${apiBase}/api/drafts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contactId: c.id, email: c.email, name: c.name, tone: draftTone }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to start draft job')
      const jobId: string = json.jobId
      // Poll
      const poll = async () => {
        const r = await fetch(`${apiBase}/api/drafts/${jobId}`, { credentials: 'include' })
        const j = await r.json()
        if (!j.success) throw new Error(j.error || 'Failed to fetch draft')
        if (j.data.status !== 'completed') {
          setTimeout(poll, 700)
          return
        }
        setLatestDraft(j.data as DraftJobData)
        setDraftLoadingId(null)
      }
      poll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Draft generation failed'
      setError(msg)
      setDraftLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">← Back</Link>
            <div className="flex items-center gap-2 text-gray-700"><Users className="h-5 w-5" /> Contacts</div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Discover Contacts</h2>
          {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="example.com or https://example.com" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Threshold: {threshold}%</label>
              <input type="range" min={70} max={95} step={1} value={threshold} onChange={(e) => updateThreshold(parseInt(e.target.value))} className="w-full" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={roles.includes('Owner/GM')} onChange={() => toggleRole('Owner/GM')} /> Owner/GM</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={roles.includes('Decision Makers')} onChange={() => toggleRole('Decision Makers')} /> Decision Makers</label>
          </div>
          <div className="mt-6">
            <button disabled={!url || isLoading} onClick={submit} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white">
              {isLoading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Discovering…' : 'Start Discovery'}
            </button>
          </div>
        </div>

        {data && (
          <>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Results for {data.domain}</h2>
              <div className="text-sm text-gray-500">Status: {data.status}</div>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role/Title</th>
                    <th className="py-2 pr-4">Score</th>
                    <th className="py-2 pr-4">Fit</th>
                    <th className="py-2 pr-4">Intent</th>
                    <th className="py-2 pr-4">Reach</th>
                    <th className="py-2 pr-4">Recency</th>
                    <th className="py-2 pr-4">Confidence</th>
                    <th className="py-2 pr-4">Verification</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '—'}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{c.email}</td>
                      <td className="py-2 pr-4">{c.role || c.title || '—'}</td>
                      <td className="py-2 pr-4">
                        {c.score !== undefined ? (
                          <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-md border ${badgeFor(c.score)}`}>
                            {c.score}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-600">
                        {c.scoreFacets?.fit ? (
                          <span title={c.scoreFacets.fit.reasonCodes.join(', ')}>{Math.round(c.scoreFacets.fit.score)}</span>
                        ) : '—'}
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-600">
                        {c.scoreFacets?.intent ? (
                          <span title={c.scoreFacets.intent.reasonCodes.join(', ')}>{Math.round(c.scoreFacets.intent.score)}</span>
                        ) : '—'}
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-600">
                        {c.scoreFacets?.reachability ? (
                          <span title={c.scoreFacets.reachability.reasonCodes.join(', ')}>{Math.round(c.scoreFacets.reachability.score)}</span>
                        ) : '—'}
                      </td>
                      <td className="py-2 pr-4 text-xs text-gray-600">
                        {c.scoreFacets?.recency ? (
                          <span title={c.scoreFacets.recency.reasonCodes.join(', ')}>{Math.round(c.scoreFacets.recency.score)}</span>
                        ) : '—'}
                      </td>
                      <td className="py-2 pr-4"><span className={`inline-flex items-center px-2 py-1 text-xs rounded-md border ${badgeFor(c.confidence)}`}>{c.confidence}%</span></td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          {statusIcon(c.verification.status || 'unknown')}
                          <span className={`inline-flex items-center px-2 py-1 text-xs rounded-md border ${badgeFor(c.verification.score)}`}>{c.verification.score ?? '—'}{typeof c.verification.score === 'number' ? '%' : ''}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <button
                          onClick={() => generateDraft(c)}
                          disabled={draftLoadingId === c.id}
                          title="Generate drafts"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                        >
                          {draftLoadingId === c.id ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          Draft
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredContacts.length === 0 && (
              <div className="text-sm text-gray-500">No contacts above the current threshold.</div>
            )}
          </div>
          {latestDraft && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold">Drafts for {latestDraft.email}</h3>
                <div className="text-xs text-gray-500">Tone: {latestDraft.tone}</div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-700 font-medium mb-1">Opener</div>
                  <div className="p-3 rounded-md border bg-gray-50">{latestDraft.drafts.opener}</div>
                </div>
                <div>
                  <div className="text-gray-700 font-medium mb-1">Follow Up 1</div>
                  <div className="p-3 rounded-md border bg-gray-50">{latestDraft.drafts.followUp1}</div>
                </div>
                <div>
                  <div className="text-gray-700 font-medium mb-1">Follow Up 2</div>
                  <div className="p-3 rounded-md border bg-gray-50">{latestDraft.drafts.followUp2}</div>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </main>
    </div>
  )
}
