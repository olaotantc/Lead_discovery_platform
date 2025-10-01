'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Globe, PenTool, AlertCircle, Target, TrendingUp, Save, Sparkles } from 'lucide-react'
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('[StartPage] useEffect - window.location:', window.location.href)
      console.log('[StartPage] useEffect - document.referrer:', document.referrer)
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
    if (typeof window !== 'undefined') window.location.href = '/contacts'
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
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Generate Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent"> ICP Preview</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Paste a URL and provide a brief description to instantly generate a detailed Ideal Customer Profile preview with verified contacts and evidence-based insights.
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
                  <span>Generate ICP Preview</span>
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* ICP Preview Results (Redesigned) */}
        {icpPreview && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">ICP Preview Generated</h2>
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

              <ICPCard icon="🎯" title="Target Roles" confidence={(icpPreview.buyerRoles && icpPreview.buyerRoles.length > 0) ? 100 : 0} fields={icpPreview.buyerRoles && icpPreview.buyerRoles.length > 0 ? icpPreview.buyerRoles.map(r=>({ label: r, value: '' })) : [{ label: 'No roles identified yet', value: '' }]} />

              <ICPCard icon="👥" title="Customer Segments" confidence={(icpPreview.customerSegments && icpPreview.customerSegments.length > 0) ? 100 : 0} fields={icpPreview.customerSegments && icpPreview.customerSegments.length > 0 ? icpPreview.customerSegments.map(s=>({ label: s, value: '' })) : [{ label: 'General market', value: '' }]} />

              <ICPCard icon="💡" title="Value Drivers" confidence={calculateConfidence({ painPoints: (icpPreview.painPoints||[]).join(', '), value: icpPreview.valueProposition })} fields={[
                { label: 'Pain Points', value: icpPreview.painPoints && icpPreview.painPoints.length>0 ? icpPreview.painPoints.join(', ') : 'Unknown' },
                { label: 'Value Prop', value: icpPreview.valueProposition || 'Unknown' },
              ]} />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button onClick={()=>setIcpPreview(null)} className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">← Edit URL</button>
              <button onClick={()=>setShowFullData(!showFullData)} className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">{showFullData ? 'Hide' : 'Show'} Full Data {showFullData ? '↑' : '↓'}</button>
              <button onClick={handleFindContacts} className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-800 transition-all flex items-center gap-2">Find Contacts →</button>
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

        {/* Discovery Results */}
        {discoveryResults && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900">Discovery Signals</h2>
              </div>
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {discoveryResults.summary.totalSignals} signals detected
              </div>
            </div>

            {/* Category summary chips */}
            {discoveryResults.summary?.byCategory && (
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(discoveryResults.summary.byCategory).map(([cat, count]) => (
                  <span key={cat} className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700 text-xs">
                    {cat}: {count}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-6">
              {discoveryResults.playbooks.map((playbook, playbookIndex) => (
                <div key={playbookIndex} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">{playbook.name}</h3>
                    <span className="text-sm text-gray-500">({playbook.signals.length} signals)</span>
                  </div>

                  <div className="space-y-4">
                    {playbook.signals.map((signal, signalIndex) => (
                      <div key={signalIndex} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-medium text-gray-900">{signal.name.replace(/([A-Z])/g, ' $1').trim()}</span>
                            {signal.category && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                signal.category.toLowerCase().includes('hiring') ? 'bg-blue-100 text-blue-800' :
                                signal.category.toLowerCase().includes('profile') ? 'bg-violet-100 text-violet-800' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {signal.category}
                              </span>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            signal.confidence >= 70 ? 'bg-green-100 text-green-800' :
                            signal.confidence >= 40 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {signal.confidence}% confidence
                          </span>
                        </div>

                        <p className="text-base text-gray-700 leading-relaxed mb-4">{signal.value}</p>

                        {signal.evidence && signal.evidence.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                              Evidence:
                            </h4>
                            <ul className="space-y-2 mb-4">
                              {signal.evidence.map((evidence, evidenceIndex) => (
                                <li key={evidenceIndex} className="flex items-start gap-2">
                                  <span className="text-blue-600 font-bold mt-1">•</span>
                                  <span className="text-base text-gray-800">{evidence}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {signal.source && (
                          <div className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
                            <span className="font-medium">Source:</span>{' '}
                            {signal.source.url ? (
                              <a
                                href={signal.source.url}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {signal.source.type}
                              </a>
                            ) : (
                              <span>{signal.source.type}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>What&apos;s Next:</strong> These signals help prioritize your outreach. Higher confidence scores indicate stronger evidence of fit with your ICP.
              </p>
            </div>
          </div>
        )}

        {/* Lookalike Companies Section */}
        {icpPreview && !candidates && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Find Lookalike Companies</h2>
              <p className="text-gray-600 mb-6">
                Discover companies similar to your ICP profile, ranked by fit score
              </p>
              <button
                onClick={() => handleFindLookalikes(false)}
                disabled={loadingCandidates}
                className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 px-8 rounded-lg font-medium hover:from-blue-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 mx-auto"
              >
                {loadingCandidates ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Finding Lookalikes...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    <span>Find Lookalike Companies</span>
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-3">
                This will take 60-90 seconds to discover and score companies
              </p>
            </div>
          </div>
        )}

        {/* Lookalike Companies Results */}
        {candidates && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Lookalike Companies</h2>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {candidates.totalFound} Found
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Avg Score: {candidates.averageScore}/100
                </span>
                <button
                  onClick={handleSaveToAccounts}
                  disabled={savingAccounts || saveSuccess}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>
                    {saveSuccess ? 'Saved!' : savingAccounts ? 'Saving...' : 'Save to Accounts'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {candidates.candidates.map((candidate, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                        <a
                          href={`https://${candidate.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {candidate.domain}
                        </a>
                      </div>
                      {candidate.description && (
                        <p className="text-gray-600 text-sm mb-3">{candidate.description}</p>
                      )}
                      {candidate.industry && (
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                          {candidate.industry}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <span className={`px-4 py-2 rounded-lg text-lg font-bold ${
                        candidate.score >= 70 ? 'bg-green-100 text-green-800' :
                        candidate.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {candidate.score}
                      </span>
                      <span className="text-xs text-gray-500">Fit Score</span>
                    </div>
                  </div>

                  {/* Score Facets */}
                  {candidate.scoreFacets && (
                    <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-1">Industry</div>
                        <div className="text-lg font-semibold text-gray-900">{candidate.scoreFacets.industryFit.score}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-1">Size</div>
                        <div className="text-lg font-semibold text-gray-900">{candidate.scoreFacets.sizeFit.score}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-1">Model</div>
                        <div className="text-lg font-semibold text-gray-900">{candidate.scoreFacets.modelFit.score}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-1">Keywords</div>
                        <div className="text-lg font-semibold text-gray-900">{candidate.scoreFacets.keywordMatch.score}</div>
                      </div>
                    </div>
                  )}

                  {/* Match Reasons */}
                  {candidate.matchReasons && candidate.matchReasons.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {candidate.matchReasons.slice(0, 3).map((reason, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {candidates.returnedCount < candidates.totalFound && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => handleFindLookalikes(true)}
                  disabled={loadingCandidates}
                  className="bg-white border-2 border-blue-600 text-blue-600 py-3 px-8 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loadingCandidates ? 'Loading...' : `Load All ${candidates.totalFound} Companies`}
                </button>
                <p className="text-gray-600 mt-2">Showing {candidates.returnedCount} of {candidates.totalFound} companies</p>
              </div>
            )}
          </div>
        )}

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
