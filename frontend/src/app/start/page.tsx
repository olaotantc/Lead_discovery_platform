'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Globe, PenTool, AlertCircle, Target, TrendingUp, Save, Sparkles, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { validateUrl, validateBrief, validateIcpInputs, ValidationRateLimit } from '@/utils/validation'
import { parseUrl, parseBrief, generateIcpPreview, IcpPreview } from '@/utils/parsing'
import { ICPCard } from '@/components/ICPCard'
import Navigation from '@/components/Navigation'

interface DiscoverySignal {
  category: string
  name: string
  value: string
  confidence: number
  source?: {
    type: string
    url: string
  }
  evidence?: string[]
}

interface PlaybookResult {
  id: string
  name: string
  signals: DiscoverySignal[]
}

interface DiscoveryResult {
  playbooks: PlaybookResult[]
  summary: {
    totalSignals: number
    byCategory: Record<string, number>
  }
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

interface CandidateSourcingResult {
  candidates: ScoredCandidate[]
  totalFound: number
  returnedCount: number
  averageScore: number
  topScore: number
  sourcedFrom: string[]
  durationMs: number
}

export default function StartPage() {
  console.log('[StartPage] Component mounted/rendered at', new Date().toISOString())

  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[StartPage] useEffect - window.location:', window.location.href)
      console.log('[StartPage] useEffect - document.referrer:', document.referrer)

      // Clear any stale localStorage data on initial page load
      // This ensures fresh start when user navigates to /start
      localStorage.removeItem('currentIcp')
      localStorage.removeItem('inputUrl')
      console.log('[StartPage] Cleared localStorage for fresh start')
    }
  }, [])

  const { token } = useAuth()
  const [url, setUrl] = useState('')
  const [brief, setBrief] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{url?: string; brief?: string; general?: string}>({})
  const [rateLimit] = useState(() => new ValidationRateLimit())
  const [icpPreview, setIcpPreview] = useState<IcpPreview | null>(null)
  const [showFullData, setShowFullData] = useState(false)
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryResult | null>(null)
  const [candidates, setCandidates] = useState<CandidateSourcingResult | null>(null)
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [savingAccounts, setSavingAccounts] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const validateInputs = () => {
    const newErrors: {url?: string; brief?: string; general?: string} = {}

    // URL validation
    const urlValidation = validateUrl(url)
    if (!urlValidation.isValid) {
      newErrors.url = urlValidation.error
    }

    // Brief validation (optional - only validate if provided)
    if (brief.trim()) {
      const briefValidation = validateBrief(brief, false)
      if (!briefValidation.isValid) {
        newErrors.brief = briefValidation.error
      }
    }

    // Rate limiting check
    if (!rateLimit.canValidate('user-session')) {
      newErrors.general = 'Too many attempts. Please wait a moment before trying again.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateInputs()) {
      return
    }

    rateLimit.recordAttempt('user-session')
    setIsLoading(true)

    try {
      // Final validation with cross-input checks
      const combinedValidation = validateIcpInputs(url, brief)
      if (!combinedValidation.isValid) {
        setErrors({ general: combinedValidation.error })
        return
      }

      const sanitizedUrl = combinedValidation.sanitized ? JSON.parse(combinedValidation.sanitized).url : url;
      const sanitizedBrief = combinedValidation.sanitized ? JSON.parse(combinedValidation.sanitized).brief : brief;
      const metadata = combinedValidation.sanitized ? JSON.parse(combinedValidation.sanitized).meta : {};

      console.log('Calling ICP inference API for:', sanitizedUrl);

      // Call backend ICP inference API
      const icpResponse = await fetch('http://localhost:8000/api/icp-inference/infer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: sanitizedUrl }),
      });

      if (!icpResponse.ok) {
        throw new Error(`ICP API returned ${icpResponse.status}`);
      }

      const icpData = await icpResponse.json();
      console.log('ICP inference results:', icpData);

      if (!icpData.success || !icpData.data) {
        throw new Error('Invalid ICP response format');
      }

      // Transform backend ICP data to flat format expected by UI
      const backendIcp = icpData.data;
      const preview: any = {
        // Flat properties for UI
        businessCategory: backendIcp.businessCategory || 'Unknown',
        companySize: backendIcp.companySize || 'Unknown',
        businessModel: backendIcp.businessModel || 'Unknown',
        growthStage: backendIcp.growthStage || 'Unknown',
        targetMarket: backendIcp.targetMarket || 'Unknown',
        marketPosition: backendIcp.marketPosition || 'Unknown',
        competitiveAdvantage: backendIcp.competitiveAdvantage || 'Unknown',
        revenueModel: backendIcp.revenueModel || 'Unknown',
        decisionMakingProcess: backendIcp.decisionMakingProcess || 'Unknown',
        buyingBehavior: backendIcp.buyingBehavior || 'Unknown',
        technologyAdoption: backendIcp.technologyAdoption || 'Unknown',
        regulatoryEnvironment: backendIcp.regulatoryEnvironment || 'Unknown',
        buyerRoles: backendIcp.buyerRoles || [],
        customerSegments: backendIcp.customerSegments || [],
        painPoints: backendIcp.painPoints || [],
        valueProposition: backendIcp.valueProposition || 'Unknown',
        keywords: backendIcp.keywords || [],
        confidence: backendIcp.confidence || 0,
        sourceUrl: backendIcp.sourceUrl || sanitizedUrl,
        inferredAt: backendIcp.inferredAt || new Date().toISOString(),
      };

      setIcpPreview(preview);

      // Store ICP data in localStorage for use in other pages
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentICP', JSON.stringify(preview));
        localStorage.setItem('currentICPUrl', sanitizedUrl);
      }

      // Call discovery API to get hiring signals and business profile
      // Pass ICP data so Business Profile playbook can use AI-inferred values
      try {
        console.log('Calling discovery API for:', sanitizedUrl);
        const discoveryResponse = await fetch('http://localhost:8000/api/discovery/run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: sanitizedUrl,
            brief: sanitizedBrief || undefined,
            icp: {
              businessCategory: preview.businessCategory,
              companySize: preview.companySize,
              targetMarket: preview.targetMarket,
            },
          }),
        });

        if (!discoveryResponse.ok) {
          throw new Error(`Discovery API returned ${discoveryResponse.status}`);
        }

        const discoveryData = await discoveryResponse.json();
        console.log('Discovery results:', discoveryData);

        if (discoveryData.success && discoveryData.data) {
          setDiscoveryResults(discoveryData.data);
        }
      } catch (discoveryError) {
        console.error('Discovery API error:', discoveryError);
        // Don't fail the entire request if discovery fails
        // User still gets ICP preview
      }
    } catch (error) {
      console.error('ICP generation error:', error);
      setErrors({ general: 'An unexpected error occurred while generating the ICP preview. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (errors.url) {
      // Clear URL error on change
      setErrors(prev => ({ ...prev, url: undefined }))
    }
    // Clear previous results when inputs change
    if (icpPreview) {
      setIcpPreview(null)
    }
    if (discoveryResults) {
      setDiscoveryResults(null)
    }
  }

  const handleBriefChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBrief(e.target.value)
    if (errors.brief) {
      // Clear brief error on change
      setErrors(prev => ({ ...prev, brief: undefined }))
    }
    // Clear previous results when inputs change
    if (icpPreview) {
      setIcpPreview(null)
    }
    if (discoveryResults) {
      setDiscoveryResults(null)
    }
  }

  const isFormValid = url.trim().length > 0 && Object.keys(errors).length === 0

  // Helper: compute section confidence 0-100
  function calculateConfidence(section: Record<string, string | string[] | undefined>): number {
    if (!section) return 0;
    const values = Object.values(section).filter((v) => {
      if (!v) return false;
      if (typeof v === 'string') return v !== 'Unknown' && v.trim() !== '';
      if (Array.isArray(v)) return v.length > 0;
      return false;
    });
    const total = Object.keys(section).length || 1;
    return Math.round((values.length / total) * 100);
  }

  function handleFindContacts() {
    // Navigate to discovery summary page with ICP data
    if (icpPreview) {
      const icpParam = encodeURIComponent(JSON.stringify(icpPreview))
      router.push(`/discover/summary?icp=${icpParam}`)
    }
  }

  async function handleFindLookalikes(loadMore: boolean = false) {
    if (!icpPreview) return

    setLoadingCandidates(true)
    try {
      console.log('Finding lookalike companies for ICP:', icpPreview.businessCategory)

      const currentLimit = loadMore ? undefined : 10; // Limit to 10 initially, no limit when loading more

      const response = await fetch('http://localhost:8000/api/candidate-sourcing/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          icp: {
            businessCategory: icpPreview.businessCategory,
            companySize: icpPreview.companySize,
            businessModel: icpPreview.businessModel,
            targetMarket: icpPreview.targetMarket,
            keywords: icpPreview.keywords || [],
          },
          limit: currentLimit,
        }),
      })

      if (!response.ok) {
        throw new Error(`Candidate sourcing API returned ${response.status}`)
      }

      const data = await response.json()
      console.log('Candidate sourcing results:', data)

      if (data.success && data.data) {
        setCandidates(data.data)
      }
    } catch (error) {
      console.error('Candidate sourcing error:', error)
      setErrors({ general: 'Failed to find lookalike companies. Please try again.' })
    } finally {
      setLoadingCandidates(false)
    }
  }

  async function handleSaveToAccounts() {
    if (!candidates || !token) {
      console.error('Cannot save: missing candidates or auth token')
      return
    }

    setSavingAccounts(true)
    setSaveSuccess(false)

    try {
      // Map candidates to SaveAccountInput format
      const accountsToSave = candidates.candidates.map(candidate => ({
        name: candidate.name,
        domain: candidate.domain,
        description: candidate.description,
        industry: candidate.industry,
        size: candidate.size,
        businessModel: icpPreview?.businessModel,
        confidence: candidate.confidence,
        score: candidate.score,
        scoreFacets: candidate.scoreFacets,
        source: candidate.source,
        matchReasons: candidate.matchReasons,
        sourcedFrom: {
          icpUrl: url,
          icpBrief: brief,
          discoveryTimestamp: new Date().toISOString(),
        },
      }))

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('http://localhost:8000/api/accounts/save/bulk', {
        method: 'POST',
        headers,
        body: JSON.stringify({ accounts: accountsToSave }),
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login'
          return
        }
        throw new Error(`Save accounts API returned ${response.status}`)
      }

      const data = await response.json()
      console.log('Save accounts result:', data)

      if (data.success) {
        setSaveSuccess(true)
        setTimeout(() => {
          window.location.href = '/accounts'
        }, 1500)
      }
    } catch (error) {
      console.error('Save accounts error:', error)
      setErrors({ general: 'Failed to save accounts. Please try again.' })
    } finally {
      setSavingAccounts(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Generate Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent"> ICP Profile</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Paste a URL and provide a brief description to instantly generate a detailed Ideal Customer Profile with verified contacts and evidence-based insights.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          {/* General Error */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-700 font-medium">Error</p>
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              </div>
              <button
                onClick={() => setErrors({})}
                className="text-red-600 hover:text-red-800 text-sm font-medium ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Target Company URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="url"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="example.com or https://example.com"
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all bg-white text-gray-900 ${
                    errors.url
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
              </div>
              {errors.url ? (
                <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.url}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Enter the website URL of your target company or prospect
                </p>
              )}
            </div>

            {/* Brief Input */}
            <div>
              <label htmlFor="brief" className="block text-sm font-medium text-gray-700 mb-2">
                Brief Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <PenTool className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="brief"
                  value={brief}
                  onChange={handleBriefChange}
                  placeholder="Optional: Add context about the company, industry, or your sales goals..."
                  rows={4}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none bg-white text-gray-900 ${
                    errors.brief
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
              </div>
              {errors.brief ? (
                <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.brief}</span>
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Optional: Provide additional context to improve ICP accuracy (10-1000 characters if provided)
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Analyzing Business Intelligence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generate ICP Profile</span>
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* ICP Profile Results (Redesigned) */}
        {icpPreview && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">ICP Profile</h2>
              {(() => {
                const businessProfile = { category: icpPreview.businessCategory, size: icpPreview.companySize, model: icpPreview.businessModel, stage: icpPreview.growthStage };
                const marketAnalysis = { targetMarket: icpPreview.targetMarket, marketPosition: icpPreview.marketPosition, competitiveAdvantage: icpPreview.competitiveAdvantage, revenueModel: icpPreview.revenueModel };
                const decisionProcess = { decisionProcess: icpPreview.decisionMakingProcess, buyingBehavior: icpPreview.buyingBehavior, technologyAdoption: icpPreview.technologyAdoption, regulatoryComplexity: icpPreview.regulatoryEnvironment };
                const vals = [
                  calculateConfidence(businessProfile),
                  calculateConfidence(marketAnalysis),
                  calculateConfidence(decisionProcess),
                  (icpPreview.buyerRoles && icpPreview.buyerRoles.length > 0) ? 100 : 0,
                  (icpPreview.customerSegments && icpPreview.customerSegments.length > 0) ? 100 : 0,
                ];
                const overall = Math.round(vals.reduce((a,b)=>a+b,0) / vals.length);
                const badge = overall > 70 ? 'bg-green-100 text-green-800' : overall > 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800';
                return <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge}`}>{overall}% Complete</span>
              })()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <ICPCard icon="🏢" title="Company Profile" confidence={calculateConfidence({ category: icpPreview.businessCategory, size: icpPreview.companySize, model: icpPreview.businessModel, stage: icpPreview.growthStage })} fields={[
                { label: 'Category', value: icpPreview.businessCategory },
                { label: 'Size', value: icpPreview.companySize },
                { label: 'Model', value: icpPreview.businessModel },
                { label: 'Stage', value: icpPreview.growthStage },
              ]} />

              <ICPCard icon="🎯" title="Market Position" confidence={calculateConfidence({ targetMarket: icpPreview.targetMarket, marketPosition: icpPreview.marketPosition, competitiveAdvantage: icpPreview.competitiveAdvantage, revenueModel: icpPreview.revenueModel })} fields={[
                { label: 'Target Market', value: icpPreview.targetMarket },
                { label: 'Position', value: icpPreview.marketPosition },
                { label: 'Advantage', value: icpPreview.competitiveAdvantage },
                { label: 'Revenue', value: icpPreview.revenueModel },
              ]} />

              <ICPCard icon="👥" title="Buyer Behavior" confidence={calculateConfidence({ decisionProcess: icpPreview.decisionMakingProcess, buyingBehavior: icpPreview.buyingBehavior, technologyAdoption: icpPreview.technologyAdoption, regulatoryComplexity: icpPreview.regulatoryEnvironment })} fields={[
                { label: 'Process', value: icpPreview.decisionMakingProcess },
                { label: 'Behavior', value: icpPreview.buyingBehavior },
                { label: 'Tech Adoption', value: icpPreview.technologyAdoption },
                { label: 'Regulation', value: icpPreview.regulatoryEnvironment },
              ]} />

              <ICPCard icon="🎯" title="Target Roles" confidence={(icpPreview.buyerRoles && icpPreview.buyerRoles.length > 0) ? 100 : 0} fields={icpPreview.buyerRoles && icpPreview.buyerRoles.length > 0 ? icpPreview.buyerRoles.map((r, idx)=>({ label: '', value: r })) : [{ label: '', value: 'No roles identified yet' }]} />

              <ICPCard icon="👥" title="Customer Segments" confidence={(icpPreview.customerSegments && icpPreview.customerSegments.length > 0) ? 100 : 0} fields={icpPreview.customerSegments && icpPreview.customerSegments.length > 0 ? icpPreview.customerSegments.map((s, idx)=>({ label: '', value: s })) : [{ label: '', value: 'General market' }]} />

              <ICPCard icon="💡" title="Value Drivers" confidence={calculateConfidence({ painPoints: (icpPreview.painPoints||[]).join(', '), value: icpPreview.valueProposition })} fields={[
                { label: 'Pain Points', value: icpPreview.painPoints && icpPreview.painPoints.length>0 ? icpPreview.painPoints.join(', ') : 'Unknown' },
                { label: 'Value Prop', value: icpPreview.valueProposition || 'Unknown' },
              ]} />
            </div>

            {/* Note about next step */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 mt-0.5">💡</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium mb-1">Ready to discover leads?</p>
                  <p className="text-xs text-gray-700">
                    We'll find companies and contacts matching this ICP profile with verified emails and evidence-backed outreach drafts.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button onClick={() => {
                // Clear localStorage for fresh start
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('currentIcp')
                  localStorage.removeItem('inputUrl')
                  console.log('[StartPage] Cleared localStorage on Edit URL click')
                }
                setIcpPreview(null)
                setUrl('')
              }} className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">← Edit URL</button>
              <button onClick={()=>setShowFullData(!showFullData)} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">{showFullData ? 'Hide' : 'Show'} Full Data {showFullData ? '↑' : '↓'}</button>
              <button
                onClick={handleFindContacts}
                className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-800 transition-all flex items-center gap-2"
              >
                <span>Discover Leads</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {showFullData && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Raw ICP Data</h3>
                  <pre className="text-xs text-gray-600 overflow-x-auto">{JSON.stringify(icpPreview, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Discovery Results moved to /discover/summary and /discover/results pages */}

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">1. URL Analysis</h3>
              <p className="text-sm text-gray-600">
                We analyze the company website to extract business information, industry signals, and organizational structure.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <PenTool className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">2. Context Integration</h3>
              <p className="text-sm text-gray-600">
                Your brief description helps us understand your specific goals and tailor the ICP accordingly.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">3. ICP Generation</h3>
              <p className="text-sm text-gray-600">
                We generate a comprehensive ICP preview with business category, size, regions, buyer roles, and keywords.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
