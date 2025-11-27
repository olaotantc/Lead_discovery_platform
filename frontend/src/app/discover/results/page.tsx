'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, TrendingUp, Users, CheckSquare, Square, Download } from 'lucide-react'
import Navigation from '@/components/Navigation'

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

export default function DiscoveryResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<CandidateSourcingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingAccounts, setSavingAccounts] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Get results from sessionStorage
    if (typeof window !== 'undefined') {
      const storedResults = sessionStorage.getItem('discoveryResults')
      if (storedResults) {
        setResults(JSON.parse(storedResults))
      }
      setLoading(false)
    }
  }, [])

  const toggleSelection = (domain: string) => {
    setSelectedDomains(prev => {
      const next = new Set(prev)
      if (next.has(domain)) {
        next.delete(domain)
      } else {
        next.add(domain)
      }
      return next
    })
  }

  const selectAll = () => {
    if (!results) return
    setSelectedDomains(new Set(results.candidates.map(c => c.domain)))
  }

  const deselectAll = () => {
    setSelectedDomains(new Set())
  }

  const handleFindContacts = () => {
    if (selectedDomains.size === 0) return
    // Store selected companies in sessionStorage for the contacts page
    const selectedCompanies = results?.candidates.filter(c => selectedDomains.has(c.domain)) || []
    sessionStorage.setItem('selectedCompanies', JSON.stringify(selectedCompanies))
    // Navigate to contacts page with first domain (contacts page will handle the rest)
    const firstDomain = Array.from(selectedDomains)[0]
    router.push(`/contacts?url=${encodeURIComponent(firstDomain)}`)
  }

  const handleSaveToAccounts = async () => {
    if (!results) return

    setSavingAccounts(true)
    try {
      // TODO: Implement save to accounts API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save accounts:', error)
    } finally {
      setSavingAccounts(false)
    }
  }

  const handleExportCSV = async () => {
    if (!results || results.candidates.length === 0) return

    // Export selected companies if any selected, otherwise export all
    const companiesToExport = selectedDomains.size > 0
      ? results.candidates.filter(c => selectedDomains.has(c.domain))
      : results.candidates

    try {
      const response = await fetch('http://localhost:8000/api/exports/companies/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: companiesToExport }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `companies_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export CSV:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading results...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">No Results Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find any discovery results. Please start a new search.</p>
            <button
              onClick={() => router.push('/start')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              ← Start New Search
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Summary
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Discovery Results</h1>
                <p className="text-lg text-gray-600">
                  Found {results.totalFound} companies matching your ICP
                  {selectedDomains.size > 0 && (
                    <span className="ml-2 text-indigo-600 font-medium">
                      ({selectedDomains.size} selected)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleFindContacts}
                  disabled={selectedDomains.size === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Users className="h-5 w-5" />
                  <span>Find Contacts</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={results.candidates.length === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Download className="h-5 w-5" />
                  <span>
                    {selectedDomains.size > 0 ? `Export ${selectedDomains.size} CSV` : 'Export All CSV'}
                  </span>
                </button>
                <button
                  onClick={handleSaveToAccounts}
                  disabled={savingAccounts || saveSuccess}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Save className="h-5 w-5" />
                  <span>
                    {saveSuccess ? 'Saved!' : savingAccounts ? 'Saving...' : 'Save to Accounts'}
                  </span>
                </button>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center gap-4 mt-4 text-sm">
              <button
                onClick={selectAll}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Deselect All
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Found</p>
                  <p className="text-3xl font-bold text-gray-900">{results.totalFound}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-green-600">{results.averageScore}/100</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Top Score</p>
                <p className="text-3xl font-bold text-purple-600">{results.topScore}/100</p>
              </div>
            </div>
          </div>

          {/* Company Results */}
          {results.totalFound === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No Companies Found</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find any companies matching this ICP. Try adjusting your ICP criteria or try a different target market.
              </p>
              <button
                onClick={() => router.push('/start')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                ← Create New ICP
              </button>
            </div>
          ) : (
            /* Company Cards */
            <div className="space-y-4">
              {results.candidates.map((candidate, index) => (
                <div
                  key={index}
                  className={`bg-white border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer ${
                    selectedDomains.has(candidate.domain)
                      ? 'border-indigo-400 ring-2 ring-indigo-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => toggleSelection(candidate.domain)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Selection Checkbox */}
                      <div className="pt-1">
                        {selectedDomains.has(candidate.domain) ? (
                          <CheckSquare className="h-6 w-6 text-indigo-600" />
                        ) : (
                          <Square className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{candidate.name}</h3>
                        <a
                          href={`https://${candidate.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {candidate.domain}
                        </a>
                      </div>
                      {candidate.description && (
                        <p className="text-gray-600 mb-3">{candidate.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {candidate.industry && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                            {candidate.industry}
                          </span>
                        )}
                        {candidate.size && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                            {candidate.size}
                          </span>
                        )}
                      </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-6" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-5 py-2 rounded-xl text-2xl font-bold ${
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
                    <div className="grid grid-cols-4 gap-4 py-4 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-1">Industry Fit</div>
                        <div className="text-2xl font-semibold text-gray-900">{candidate.scoreFacets.industryFit.score}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-1">Size Fit</div>
                        <div className="text-2xl font-semibold text-gray-900">{candidate.scoreFacets.sizeFit.score}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-1">Model Fit</div>
                        <div className="text-2xl font-semibold text-gray-900">{candidate.scoreFacets.modelFit.score}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-1">Keywords</div>
                        <div className="text-2xl font-semibold text-gray-900">{candidate.scoreFacets.keywordMatch.score}</div>
                      </div>
                    </div>
                  )}

                  {/* Match Reasons */}
                  {candidate.matchReasons && candidate.matchReasons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-2">Why this match:</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.matchReasons.slice(0, 4).map((reason, idx) => (
                          <span key={idx} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Next Steps */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">🎯 Next Steps</h3>
            <p className="text-sm text-gray-700 mb-4">
              Select companies above, then click &quot;Find Contacts&quot; to discover decision-maker emails and generate personalized outreach drafts.
            </p>
            {selectedDomains.size > 0 && (
              <button
                onClick={handleFindContacts}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                <Users className="h-4 w-4" />
                Find Contacts for {selectedDomains.size} {selectedDomains.size === 1 ? 'Company' : 'Companies'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
