'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, Users, ChevronRight, ArrowLeft, Sparkles } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface IcpPreview {
  businessCategory: string
  companySize: string
  businessModel: string
  targetMarket: string
  [key: string]: any
}

export default function DiscoverySummaryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [icp, setIcp] = useState<IcpPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [companiesCount, setCompaniesCount] = useState<number | null>(null)
  const [individualsCount] = useState<number | null>(null) // Future feature
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get ICP from URL params
    const icpParam = searchParams.get('icp')
    if (icpParam) {
      try {
        const parsedIcp = JSON.parse(decodeURIComponent(icpParam))
        setIcp(parsedIcp)
        // Trigger company discovery to get count
        discoverCompanies(parsedIcp)
      } catch (e) {
        console.error('Failed to parse ICP:', e)
        setError('Invalid ICP data')
      }
    } else {
      setError('No ICP data provided')
    }
  }, [searchParams])

  const discoverCompanies = async (icpData: IcpPreview) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/api/candidate-sourcing/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icp: icpData, limit: 50 }),
      })

      if (!response.ok) {
        throw new Error('Failed to discover companies')
      }

      const result = await response.json()
      setCompaniesCount(result.data.totalFound)

      // Store results for next page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('discoveryResults', JSON.stringify(result.data))
      }
    } catch (err: any) {
      console.error('Discovery error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCompanyContacts = () => {
    if (icp) {
      router.push(`/discover/results?type=companies&icp=${encodeURIComponent(JSON.stringify(icp))}`)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/start')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              ← Back to Start
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/start')}
              className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to ICP
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Discovery Analysis</h1>
            <p className="text-lg text-gray-600">
              We've analyzed your ICP and found matching leads. Choose which type you'd like to explore.
            </p>
          </div>

          {/* ICP Summary Card */}
          {icp && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your ICP Profile</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-900">{icp.businessCategory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company Size</p>
                  <p className="font-medium text-gray-900">{icp.companySize}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Model</p>
                  <p className="font-medium text-gray-900">{icp.businessModel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Market</p>
                  <p className="font-medium text-gray-900">{icp.targetMarket}</p>
                </div>
              </div>
            </div>
          )}

          {/* Discovery Options */}
          <div className="space-y-6">
            {/* Companies Option */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Building2 className="h-8 w-8 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Discover decision-makers at companies matching your ICP. Get verified emails, contact scoring, and personalized outreach drafts.
                  </p>

                  {loading ? (
                    <div className="flex items-center gap-3 text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      <span>Analyzing companies...</span>
                    </div>
                  ) : companiesCount !== null ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-4xl font-bold text-indigo-600 mb-2">{companiesCount}</div>
                        <p className="text-sm text-gray-500">Companies found matching your ICP</p>
                      </div>
                      <button
                        onClick={handleGenerateCompanyContacts}
                        className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-800 transition-all flex items-center gap-2"
                      >
                        <span>Generate Contacts</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Individuals Option (Coming Soon) */}
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-8 opacity-60">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-8 w-8 text-gray-400" />
                    <h2 className="text-2xl font-bold text-gray-700">Individuals</h2>
                    <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm font-medium rounded-full">
                      Coming in v0.3
                    </span>
                  </div>
                  <p className="text-gray-500 mb-4">
                    Discover individual professionals (indie developers, solo founders, freelancers) matching your ICP directly.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Sparkles className="h-4 w-4" />
                    <span>Individual discovery powered by LinkedIn and GitHub signals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Company discovery finds businesses matching your ICP and identifies key decision-makers.
              Individual discovery (coming soon) will find professionals directly without company affiliation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
