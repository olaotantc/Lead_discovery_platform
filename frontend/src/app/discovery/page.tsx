'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight,
  ChevronLeft,
  Globe,
  PenTool,
  AlertCircle,
  Sparkles,
  Building2,
  Users,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCcw,
  Check,
  Play,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'

// Types
interface ICPData {
  businessCategory: string
  companySize: string
  businessModel: string
  growthStage: string
  targetMarket: string
  marketPosition: string
  competitiveAdvantage: string
  revenueModel: string
  decisionMakingProcess: string
  buyingBehavior: string
  technologyAdoption: string
  regulatoryEnvironment: string
  buyerRoles: string[]
  customerSegments: string[]
  painPoints: string[]
  valueProposition: string
  keywords: string[]
  confidence: number
  sourceUrl: string
  inferredAt: string
}

interface ScoredCandidate {
  name: string
  domain: string
  description?: string
  industry?: string
  size?: string
  confidence: number
  score: number
  scoreFacets?: {
    industryFit: { score: number; reasonCodes: string[] }
    sizeFit: { score: number; reasonCodes: string[] }
    modelFit: { score: number; reasonCodes: string[] }
    keywordMatch: { score: number; reasonCodes: string[] }
  }
  matchReasons: string[]
  source: string
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
  confidence: number
  verification: { status: string; score?: number }
  score?: number
  scoreFacets?: any
}

interface DraftContent {
  opener: string
  followUp1: string
  followUp2: string
}

// Step definitions
const STEPS = [
  { id: 1, name: 'Input', icon: Globe, description: 'Your company URL' },
  { id: 2, name: 'Profile', icon: Sparkles, description: 'Your business' },
  { id: 3, name: 'Prospects', icon: Building2, description: 'Potential customers' },
  { id: 4, name: 'Contacts', icon: Users, description: 'Find emails' },
  { id: 5, name: 'Drafts', icon: FileText, description: 'Generate outreach' },
]

// Demo data for sample mode
const DEMO_URL = 'stripe.com'
const DEMO_ICP: ICPData = {
  businessCategory: 'Financial Technology / Payment Processing',
  companySize: '1000+',
  businessModel: 'B2B SaaS',
  growthStage: 'Enterprise',
  targetMarket: 'Online businesses, E-commerce, SaaS companies, Marketplaces',
  marketPosition: 'Market Leader',
  competitiveAdvantage: 'Developer-first approach, comprehensive API, global reach',
  revenueModel: 'Transaction fees + Subscription',
  decisionMakingProcess: 'Technical evaluation by engineering, business approval',
  buyingBehavior: 'Product-led with sales assist for enterprise',
  technologyAdoption: 'Early adopter',
  regulatoryEnvironment: 'PCI-DSS, Financial regulations, GDPR',
  buyerRoles: ['CTO', 'VP Engineering', 'Head of Payments', 'CFO'],
  customerSegments: ['Startups', 'SMBs', 'Enterprise', 'Marketplaces'],
  painPoints: ['Payment complexity', 'Global expansion', 'Compliance burden', 'Developer experience'],
  valueProposition: 'Unified payment infrastructure for the internet economy',
  keywords: ['payments', 'fintech', 'API', 'e-commerce', 'SaaS billing'],
  confidence: 92,
  sourceUrl: 'stripe.com',
  inferredAt: new Date().toISOString(),
}

function DiscoveryWizardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuth()
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

  // Session persistence state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionKey, setSessionKey] = useState<string | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)

  // Current step
  const [currentStep, setCurrentStep] = useState(1)
  const [isDemo, setIsDemo] = useState(false)

  // Step 1: Input state
  const [url, setUrl] = useState('')
  const [brief, setBrief] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  // Step 2: ICP state
  const [icp, setIcp] = useState<ICPData | null>(null)
  const [icpLoading, setIcpLoading] = useState(false)

  // Step 3: Companies state
  const [companies, setCompanies] = useState<ScoredCandidate[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
  const [companyFilter, setCompanyFilter] = useState('')
  const [companySortBy, setCompanySortBy] = useState<'score' | 'name'>('score')
  const [companySortOrder, setCompanySortOrder] = useState<'asc' | 'desc'>('desc')

  // Step 4: Contacts state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [confidenceThreshold, setConfidenceThreshold] = useState(85)

  // Step 5: Drafts state
  const [drafts, setDrafts] = useState<Map<string, DraftContent>>(new Map())
  const [draftsLoading, setDraftsLoading] = useState(false)
  const [draftTone, setDraftTone] = useState<'direct' | 'consultative' | 'warm'>('direct')

  // General state
  const [error, setError] = useState<string | null>(null)

  // Load session from localStorage key (for anonymous users)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('discovery_session_key')
      if (storedKey) {
        setSessionKey(storedKey)
      }
    }
  }, [])

  // Load existing session or create new one
  useEffect(() => {
    const demo = searchParams.get('demo')
    const resumeSession = searchParams.get('session')

    if (demo === 'true') {
      setIsDemo(true)
      setUrl(DEMO_URL)
      setIcp(DEMO_ICP)
      setCurrentStep(2)
      setSessionLoaded(true)
      return
    }

    // If resuming a specific session
    if (resumeSession) {
      loadSession(resumeSession)
      return
    }

    // Try to load latest in-progress session
    loadLatestSession()
  }, [searchParams])

  // Load session data
  const loadSession = async (id: string) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (sessionKey) headers['x-session-key'] = sessionKey

      const response = await fetch(`${apiBase}/api/sessions/${id}`, {
        headers,
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          restoreSessionState(data.data)
        }
      }
    } catch (err) {
      console.error('Failed to load session:', err)
    } finally {
      setSessionLoaded(true)
    }
  }

  // Load latest in-progress session
  const loadLatestSession = async () => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (sessionKey) headers['x-session-key'] = sessionKey

      const response = await fetch(`${apiBase}/api/sessions/latest`, {
        headers,
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          restoreSessionState(data.data)
        }
      }
    } catch (err) {
      console.error('Failed to load latest session:', err)
    } finally {
      setSessionLoaded(true)
    }
  }

  // Restore state from session data
  const restoreSessionState = (session: any) => {
    setSessionId(session.id)
    setCurrentStep(session.current_step || 1)
    setUrl(session.url || '')
    setBrief(session.brief || '')

    if (session.icp_data) {
      setIcp(session.icp_data)
    }
    if (session.companies && Array.isArray(session.companies)) {
      setCompanies(session.companies)
    }
    if (session.selected_companies && Array.isArray(session.selected_companies)) {
      setSelectedCompanies(new Set(session.selected_companies))
    }
    if (session.contacts && Array.isArray(session.contacts)) {
      setContacts(session.contacts)
    }
    if (session.selected_contacts && Array.isArray(session.selected_contacts)) {
      setSelectedContacts(new Set(session.selected_contacts))
    }
    if (session.confidence_threshold) {
      setConfidenceThreshold(session.confidence_threshold)
    }
    if (session.drafts && typeof session.drafts === 'object') {
      setDrafts(new Map(Object.entries(session.drafts)))
    }
    if (session.draft_tone) {
      setDraftTone(session.draft_tone)
    }
    setIsDemo(session.is_demo || false)
  }

  // Create new session
  const createSession = async () => {
    if (isDemo) return // Don't persist demo sessions

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(`${apiBase}/api/sessions`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ url, brief }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setSessionId(data.data.id)
          if (data.data.sessionKey) {
            setSessionKey(data.data.sessionKey)
            localStorage.setItem('discovery_session_key', data.data.sessionKey)
          }
        }
      }
    } catch (err) {
      console.error('Failed to create session:', err)
    }
  }

  // Save session state (debounced)
  const saveSession = async (updates: Record<string, any>) => {
    if (!sessionId || isDemo) return

    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (sessionKey) headers['x-session-key'] = sessionKey

      await fetch(`${apiBase}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify(updates),
      })
    } catch (err) {
      console.error('Failed to save session:', err)
    }
  }

  // Auto-save when state changes
  useEffect(() => {
    if (!sessionLoaded || !sessionId || isDemo) return

    const timeoutId = setTimeout(() => {
      saveSession({
        current_step: currentStep,
        url,
        brief,
        icp_data: icp,
        companies,
        selected_companies: Array.from(selectedCompanies),
        contacts,
        selected_contacts: Array.from(selectedContacts),
        confidence_threshold: confidenceThreshold,
        drafts: Object.fromEntries(drafts),
        draft_tone: draftTone,
      })
    }, 1000) // Debounce 1 second

    return () => clearTimeout(timeoutId)
  }, [currentStep, url, brief, icp, companies, selectedCompanies, contacts, selectedContacts, confidenceThreshold, drafts, draftTone, sessionId, sessionLoaded, isDemo])

  // Validate URL
  const validateUrl = (input: string): boolean => {
    if (!input.trim()) {
      setUrlError('Please enter a URL')
      return false
    }
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i
    if (!urlPattern.test(input)) {
      setUrlError('Please enter a valid URL (e.g., example.com)')
      return false
    }
    setUrlError(null)
    return true
  }

  // Step 1 → Step 2: Generate ICP
  const handleGenerateICP = async () => {
    if (!validateUrl(url)) return

    setIcpLoading(true)
    setError(null)

    // Create session if not exists
    if (!sessionId && !isDemo) {
      await createSession()
    }

    try {
      const response = await fetch(`${apiBase}/api/icp-inference/infer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) throw new Error(`ICP API returned ${response.status}`)

      const data = await response.json()
      if (!data.success || !data.data) throw new Error('Invalid ICP response')

      setIcp(data.data)
      setCurrentStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ICP')
    } finally {
      setIcpLoading(false)
    }
  }

  // Step 2 → Step 3: Find Companies
  const handleFindCompanies = async () => {
    if (!icp) return

    setCompaniesLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiBase}/api/candidate-sourcing/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          icp: {
            businessCategory: icp.businessCategory,
            companySize: icp.companySize,
            businessModel: icp.businessModel,
            targetMarket: icp.targetMarket,
            keywords: icp.keywords || [],
          },
          limit: 25,
        }),
      })

      if (!response.ok) throw new Error(`Candidate API returned ${response.status}`)

      const data = await response.json()
      if (data.success && data.data?.candidates) {
        setCompanies(data.data.candidates)
        setCurrentStep(3)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find companies')
    } finally {
      setCompaniesLoading(false)
    }
  }

  // Step 3 → Step 4: Find Contacts
  const handleFindContacts = async () => {
    if (selectedCompanies.size === 0) {
      setError('Please select at least one company')
      return
    }

    setContactsLoading(true)
    setError(null)
    const allContacts: Contact[] = []

    try {
      // Process each selected company
      for (const domain of selectedCompanies) {
        const response = await fetch(`${apiBase}/api/contacts/discover`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            url: domain,
            roles: ['Owner/GM', 'Decision Makers'],
            threshold: confidenceThreshold,
          }),
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.jobId) {
            // Poll for results
            let attempts = 0
            while (attempts < 30) {
              await new Promise(resolve => setTimeout(resolve, 1000))
              const pollRes = await fetch(`${apiBase}/api/contacts/${data.jobId}`, {
                credentials: 'include',
              })
              const pollData = await pollRes.json()
              if (pollData.data?.status === 'completed') {
                allContacts.push(...(pollData.data.contacts || []))
                break
              }
              attempts++
            }
          }
        }
      }

      setContacts(allContacts)
      setCurrentStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find contacts')
    } finally {
      setContactsLoading(false)
    }
  }

  // Step 4 → Step 5: Generate Drafts (Bulk)
  const handleGenerateDrafts = async () => {
    if (selectedContacts.size === 0) {
      setError('Please select at least one contact')
      return
    }

    setDraftsLoading(true)
    setError(null)
    const newDrafts = new Map<string, DraftContent>()

    try {
      // Generate drafts for all selected contacts
      const contactList = contacts.filter(c => selectedContacts.has(c.id))

      for (const contact of contactList) {
        const response = await fetch(`${apiBase}/api/drafts/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            contactId: contact.id,
            email: contact.email,
            name: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
            tone: draftTone,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.jobId) {
            // Poll for results
            let attempts = 0
            while (attempts < 20) {
              await new Promise(resolve => setTimeout(resolve, 700))
              const pollRes = await fetch(`${apiBase}/api/drafts/${data.jobId}`, {
                credentials: 'include',
              })
              const pollData = await pollRes.json()
              if (pollData.data?.status === 'completed') {
                newDrafts.set(contact.id, pollData.data.drafts)
                break
              }
              attempts++
            }
          }
        }
      }

      setDrafts(newDrafts)
      setCurrentStep(5)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate drafts')
    } finally {
      setDraftsLoading(false)
    }
  }

  // Export to CSV
  const handleExportCSV = async () => {
    const dataToExport = contacts.filter(c => selectedContacts.has(c.id)).map(c => ({
      name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
      email: c.email,
      role: c.role || c.title || '',
      domain: c.domain,
      confidence: c.confidence,
      score: c.score || '',
      draft_opener: drafts.get(c.id)?.opener || '',
      draft_followup1: drafts.get(c.id)?.followUp1 || '',
      draft_followup2: drafts.get(c.id)?.followUp2 || '',
    }))

    try {
      const response = await fetch(`${apiBase}/api/exports/contacts/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: dataToExport }),
      })

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `discovery_export_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to export CSV')
    }
  }

  // Filtered and sorted companies
  const filteredCompanies = useMemo(() => {
    let result = [...companies]

    // Filter
    if (companyFilter) {
      const query = companyFilter.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.domain.toLowerCase().includes(query) ||
        c.industry?.toLowerCase().includes(query)
      )
    }

    // Sort
    result.sort((a, b) => {
      const aVal = companySortBy === 'score' ? a.score : a.name
      const bVal = companySortBy === 'score' ? b.score : b.name
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return companySortOrder === 'desc' ? bVal - aVal : aVal - bVal
      }
      return companySortOrder === 'desc'
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal))
    })

    return result
  }, [companies, companyFilter, companySortBy, companySortOrder])

  // Filtered contacts by confidence
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => c.confidence >= confidenceThreshold)
  }, [contacts, confidenceThreshold])

  // Calculate step status
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Banner */}
        {isDemo && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Play className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800 font-medium">Demo Mode — Exploring with sample data from Stripe</span>
            </div>
            <button
              onClick={() => {
                setIsDemo(false)
                setUrl('')
                setIcp(null)
                setCompanies([])
                setContacts([])
                setDrafts(new Map())
                setCurrentStep(1)
              }}
              className="text-amber-700 hover:text-amber-900 text-sm font-medium"
            >
              Exit Demo
            </button>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, idx) => {
                const status = getStepStatus(step.id)
                const Icon = step.icon
                return (
                  <li key={step.id} className="relative flex-1">
                    {idx > 0 && (
                      <div
                        className={`absolute left-0 top-5 -translate-x-1/2 w-full h-0.5 ${
                          status === 'upcoming' ? 'bg-gray-200' : 'bg-indigo-600'
                        }`}
                        style={{ width: 'calc(100% - 2.5rem)', left: '-50%', marginLeft: '1.25rem' }}
                      />
                    )}
                    <button
                      onClick={() => status === 'completed' && setCurrentStep(step.id)}
                      disabled={status === 'upcoming'}
                      className={`relative flex flex-col items-center group ${
                        status === 'upcoming' ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          status === 'completed'
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : status === 'current'
                            ? 'bg-white border-indigo-600 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {status === 'completed' ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </span>
                      <span
                        className={`mt-2 text-xs font-medium ${
                          status === 'current' ? 'text-indigo-600' : status === 'completed' ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {step.name}
                      </span>
                      <span className="text-xs text-gray-500 hidden sm:block">{step.description}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              Dismiss
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Step 1: URL Input */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Discovery</h2>
                <p className="text-gray-600">Enter your company URL and we&apos;ll find potential customers for your business</p>
              </div>

              {/* Demo Quick Start */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">New here? Try a demo first</p>
                    <p className="text-sm text-gray-600">See how SignalRunner finds leads using Stripe as an example</p>
                  </div>
                  <Link
                    href="/discovery?demo=true"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Try Demo
                  </Link>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Company URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value)
                      setUrlError(null)
                    }}
                    placeholder="example.com or https://example.com"
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                      urlError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                {urlError && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {urlError}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Quick try: <button onClick={() => setUrl('stripe.com')} className="text-indigo-600 hover:underline">stripe.com</button>
                  {' | '}
                  <button onClick={() => setUrl('hubspot.com')} className="text-indigo-600 hover:underline">hubspot.com</button>
                  {' | '}
                  <button onClick={() => setUrl('notion.so')} className="text-indigo-600 hover:underline">notion.so</button>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Description <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <PenTool className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Add context about your sales goals or target market..."
                    rows={3}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateICP}
                disabled={icpLoading || !url.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {icpLoading ? (
                  <>
                    <RefreshCcw className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Analyze My Business
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: ICP Preview */}
          {currentStep === 2 && icp && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Business Profile</h2>
                  <p className="text-gray-600">We analyzed your business to identify ideal customer characteristics</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  icp.confidence >= 80 ? 'bg-green-100 text-green-800' :
                  icp.confidence >= 60 ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {icp.confidence}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Your Business */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    Your Business
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Category:</span> <span className="text-gray-900">{icp.businessCategory}</span></div>
                    <div><span className="text-gray-500">Size:</span> <span className="text-gray-900">{icp.companySize}</span></div>
                    <div><span className="text-gray-500">Model:</span> <span className="text-gray-900">{icp.businessModel}</span></div>
                    <div><span className="text-gray-500">Stage:</span> <span className="text-gray-900">{icp.growthStage}</span></div>
                  </div>
                </div>

                {/* Your Target Market */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Your Target Market
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Target:</span> <span className="text-gray-900">{icp.targetMarket}</span></div>
                    <div><span className="text-gray-500">Position:</span> <span className="text-gray-900">{icp.marketPosition}</span></div>
                    <div><span className="text-gray-500">Revenue:</span> <span className="text-gray-900">{icp.revenueModel}</span></div>
                  </div>
                </div>

{/* Keywords */}
                <div className="p-4 bg-gray-50 rounded-lg md:col-span-2 lg:col-span-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {icp.keywords?.map((kw, idx) => (
                      <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleFindCompanies}
                  disabled={companiesLoading}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {companiesLoading ? (
                    <>
                      <RefreshCcw className="h-5 w-5 animate-spin" />
                      Finding Companies...
                    </>
                  ) : (
                    <>
                      Find Potential Customers
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Companies */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Potential Customers</h2>
                  <p className="text-gray-600">
                    {companies.length} prospects found • {selectedCompanies.size} selected
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedCompanies(new Set(companies.map(c => c.domain)))}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedCompanies(new Set())}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Who to Contact - Buyer Roles */}
              {icp?.buyerRoles && icp.buyerRoles.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <h3 className="font-medium text-gray-900">Who to Contact at These Companies</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {icp.buyerRoles.map((role, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder="Filter by name, domain, industry..."
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={companySortBy}
                  onChange={(e) => setCompanySortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="score">Sort by Score</option>
                  <option value="name">Sort by Name</option>
                </select>
                <button
                  onClick={() => setCompanySortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  {companySortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {/* Company List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.domain}
                    onClick={() => {
                      const newSelected = new Set(selectedCompanies)
                      if (newSelected.has(company.domain)) {
                        newSelected.delete(company.domain)
                      } else {
                        newSelected.add(company.domain)
                      }
                      setSelectedCompanies(newSelected)
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedCompanies.has(company.domain)
                        ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedCompanies.has(company.domain)}
                            onChange={() => {}}
                            className="h-4 w-4 text-indigo-600 rounded"
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{company.name}</h4>
                            <p className="text-sm text-gray-500">{company.domain}</p>
                          </div>
                        </div>
                        {company.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{company.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          {company.industry && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {company.industry}
                            </span>
                          )}
                          {company.size && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {company.size}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-lg text-lg font-bold ${
                          company.score >= 70 ? 'bg-green-100 text-green-800' :
                          company.score >= 50 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {company.score}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Fit Score</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleFindContacts}
                  disabled={contactsLoading || selectedCompanies.size === 0}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {contactsLoading ? (
                    <>
                      <RefreshCcw className="h-5 w-5 animate-spin" />
                      Finding Contacts...
                    </>
                  ) : (
                    <>
                      Find Contacts ({selectedCompanies.size})
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Contacts */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Contacts Discovered</h2>
                  <p className="text-gray-600">
                    {filteredContacts.length} contacts above {confidenceThreshold}% confidence • {selectedContacts.size} selected
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedContacts(new Set(filteredContacts.map(c => c.id)))}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedContacts(new Set())}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Confidence Threshold */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Confidence Threshold: {confidenceThreshold}%
                  </label>
                  <select
                    value={draftTone}
                    onChange={(e) => setDraftTone(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="direct">Direct Tone</option>
                    <option value="consultative">Consultative Tone</option>
                    <option value="warm">Warm Tone</option>
                  </select>
                </div>
                <input
                  type="range"
                  min={70}
                  max={95}
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Contact List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => {
                      const newSelected = new Set(selectedContacts)
                      if (newSelected.has(contact.id)) {
                        newSelected.delete(contact.id)
                      } else {
                        newSelected.add(contact.id)
                      }
                      setSelectedContacts(newSelected)
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedContacts.has(contact.id)
                        ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => {}}
                          className="h-4 w-4 text-indigo-600 rounded"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown'}
                          </h4>
                          <p className="text-sm text-gray-600">{contact.email}</p>
                          <p className="text-xs text-gray-500">{contact.role || contact.title || 'No role'} @ {contact.domain}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          contact.confidence >= 85 ? 'bg-green-100 text-green-800' :
                          contact.confidence >= 70 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {contact.confidence}%
                        </span>
                        {contact.verification?.status === 'verified' && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredContacts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No contacts found above the confidence threshold
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleGenerateDrafts}
                  disabled={draftsLoading || selectedContacts.size === 0}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {draftsLoading ? (
                    <>
                      <RefreshCcw className="h-5 w-5 animate-spin" />
                      Generating Drafts...
                    </>
                  ) : (
                    <>
                      Generate Drafts ({selectedContacts.size})
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Drafts & Export */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Drafts Generated</h2>
                  <p className="text-gray-600">{drafts.size} drafts ready for export</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>

              {/* Draft Previews */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {Array.from(drafts.entries()).map(([contactId, draft]) => {
                  const contact = contacts.find(c => c.id === contactId)
                  return (
                    <div key={contactId} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{contact?.email}</h4>
                          <p className="text-sm text-gray-500">
                            {contact?.name || `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim()} @ {contact?.domain}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                          {draftTone}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Opener</p>
                          <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">{draft.opener}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Follow-up 1</p>
                          <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">{draft.followUp1}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Follow-up 2</p>
                          <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded">{draft.followUp2}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {drafts.size === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No drafts generated yet
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Go to Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setCurrentStep(1)
                      setUrl('')
                      setIcp(null)
                      setCompanies([])
                      setContacts([])
                      setDrafts(new Map())
                      setSelectedCompanies(new Set())
                      setSelectedContacts(new Set())
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2"
                  >
                    <Sparkles className="h-5 w-5" />
                    Start New Discovery
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Wrapper with Suspense boundary for useSearchParams
export default function DiscoveryWizard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <DiscoveryWizardContent />
    </Suspense>
  )
}
