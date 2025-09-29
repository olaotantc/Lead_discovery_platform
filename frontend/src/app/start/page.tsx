'use client'

import { useState } from 'react'
import { ChevronRight, Globe, PenTool, Sparkles, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { validateUrl, validateBrief, validateIcpInputs, ValidationRateLimit } from '@/utils/validation'
import { parseUrl, parseBrief, generateIcpPreview, IcpPreview } from '@/utils/parsing'

export default function StartPage() {
  const [url, setUrl] = useState('')
  const [brief, setBrief] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{url?: string; brief?: string; general?: string}>({})
  const [rateLimit] = useState(() => new ValidationRateLimit())
  const [icpPreview, setIcpPreview] = useState<IcpPreview | null>(null)

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

      console.log('Generating ICP preview for:', { url: sanitizedUrl, brief: sanitizedBrief });

      // Parse URL and brief to extract business information
      const urlData = parseUrl(sanitizedUrl);
      const briefData = parseBrief(sanitizedBrief);
      
      // Generate ICP preview
      const preview = generateIcpPreview(urlData, briefData, metadata);
      
      // Simulate processing time
      setTimeout(() => {
        setIsLoading(false);
        setIcpPreview(preview);
        
        console.log('Generated ICP Preview:', preview);
      }, 1500)
    } catch {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
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
    // Clear previous ICP preview when inputs change
    if (icpPreview) {
      setIcpPreview(null)
    }
  }

  const handleBriefChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBrief(e.target.value)
    if (errors.brief) {
      // Clear brief error on change
      setErrors(prev => ({ ...prev, brief: undefined }))
    }
    // Clear previous ICP preview when inputs change
    if (icpPreview) {
      setIcpPreview(null)
    }
  }

  const isFormValid = url.trim() && Object.keys(errors).length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                SignalRunner
              </span>
            </div>
          </div>
        </div>
      </header>

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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-700 font-medium">Validation Error</p>
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
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
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all ${
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
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none ${
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
                  <span>Generating ICP Preview...</span>
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

        {/* ICP Preview Results */}
        {icpPreview && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">ICP Preview Generated</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                icpPreview.confidence === 'High' 
                  ? 'bg-green-100 text-green-800' 
                  : icpPreview.confidence === 'Medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {icpPreview.confidence} Confidence
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Business Profile</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{icpPreview.businessCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{icpPreview.companySize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Region:</span>
                    <span className="font-medium">{icpPreview.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium">{icpPreview.businessModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stage:</span>
                    <span className="font-medium">{icpPreview.growthStage}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Market Analysis</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Market:</span>
                    <span className="font-medium text-sm">{icpPreview.targetMarket}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Position:</span>
                    <span className="font-medium text-sm">{icpPreview.marketPosition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Advantage:</span>
                    <span className="font-medium text-sm">{icpPreview.competitiveAdvantage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-medium text-sm">{icpPreview.revenueModel}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Decision Process</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Process:</span>
                    <span className="font-medium text-sm">{icpPreview.decisionMakingProcess}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Behavior:</span>
                    <span className="font-medium text-sm">{icpPreview.buyingBehavior}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tech Adoption:</span>
                    <span className="font-medium text-sm">{icpPreview.technologyAdoption}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Regulation:</span>
                    <span className="font-medium text-sm">{icpPreview.regulatoryEnvironment}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Target Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {icpPreview.buyerRoles.map((role, index) => (
                    <span key={index} className="px-2.5 py-1.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Customer Segments</h3>
                <div className="flex flex-wrap gap-2">
                  {icpPreview.customerSegments.map((segment, index) => (
                    <span key={index} className="px-2.5 py-1.5 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm">
                      {segment}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Pain Points</h3>
                <div className="flex flex-wrap gap-2">
                  {icpPreview.painPoints.map((painPoint, index) => (
                    <span key={index} className="px-2.5 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
                      {painPoint}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Value Proposition</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <span className="text-yellow-800 font-medium">{icpPreview.valueProposition}</span>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Budget Indicators</h3>
                <div className="flex flex-wrap gap-2">
                  {icpPreview.budgetIndicators.map((indicator, index) => (
                    <span key={index} className="px-2.5 py-1.5 rounded-md bg-purple-50 border border-purple-200 text-purple-800 text-sm">
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Urgency Signals</h3>
                <div className="flex flex-wrap gap-2">
                  {icpPreview.urgencySignals.map((signal, index) => (
                    <span key={index} className="px-2.5 py-1.5 rounded-md bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Keywords & Services</h3>
              <div className="flex flex-wrap gap-2">
                {icpPreview.keywords.map((keyword, index) => (
                  <span key={index} className="px-2.5 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-gray-700 text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Analysis Sources</h3>
              <div className="space-y-3">
                {icpPreview.sources.map((source, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-2">{source.type}</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {source.extractedData.map((data, dataIndex) => (
                        <li key={dataIndex} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          <span>{data}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
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
