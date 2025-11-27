'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { ArrowLeft, Search, Download, ExternalLink, Filter, Edit3, Save, X, Loader2 } from 'lucide-react'

interface Draft {
  id: string
  contact_id: string
  email: string
  name: string | null
  domain: string
  tone: 'direct' | 'consultative' | 'warm'
  opener: string
  follow_up_1: string
  follow_up_2: string
  citations: Array<{ id: number; url: string; title: string; snippet?: string }>
  email_headers: Record<string, string>
  evidence_data: any
  created_at: string
  updated_at: string
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [emailFilter, setEmailFilter] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [contactFilter, setContactFilter] = useState('')
  const [toneFilter, setToneFilter] = useState<'all' | 'direct' | 'consultative' | 'warm'>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const limit = 20

  // Selected draft for detail view
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState({
    opener: '',
    follow_up_1: '',
    follow_up_2: '',
    tone: 'direct' as 'direct' | 'consultative' | 'warm',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetchDrafts()
  }, [page, emailFilter, domainFilter, contactFilter])

  const fetchDrafts = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (emailFilter) params.append('email', emailFilter)
      if (domainFilter) params.append('domain', domainFilter)
      if (contactFilter) params.append('contactId', contactFilter)
      params.append('limit', limit.toString())
      params.append('offset', ((page - 1) * limit).toString())

      const response = await fetch(`http://localhost:8000/api/drafts/list/all?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch drafts')
      }

      const data = await response.json()
      setDrafts(data.data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load drafts')
    } finally {
      setLoading(false)
    }
  }

  const downloadDraft = (draft: Draft) => {
    const emlContent = `From: noreply@signalrunner.com
To: ${draft.email}
Subject: Following up on ${draft.domain}
MIME-Version: 1.0
Content-Type: text/plain; charset=utf-8
${Object.entries(draft.email_headers).map(([k, v]) => `${k}: ${v}`).join('\n')}

Opener:
${draft.opener}

Follow-up 1:
${draft.follow_up_1}

Follow-up 2:
${draft.follow_up_2}

Citations:
${draft.citations.map((c, i) => `[${i + 1}] ${c.title} - ${c.url}`).join('\n')}
`

    const blob = new Blob([emlContent], { type: 'message/rfc822' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `draft-${draft.domain}-${new Date(draft.created_at).toISOString().split('T')[0]}.eml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredDrafts = toneFilter === 'all'
    ? drafts
    : drafts.filter(d => d.tone === toneFilter)

  const getToneBadgeColor = (tone: string) => {
    switch (tone) {
      case 'direct': return 'bg-blue-100 text-blue-700'
      case 'consultative': return 'bg-purple-100 text-purple-700'
      case 'warm': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Enter edit mode
  const startEditing = () => {
    if (selectedDraft) {
      setEditValues({
        opener: selectedDraft.opener,
        follow_up_1: selectedDraft.follow_up_1,
        follow_up_2: selectedDraft.follow_up_2,
        tone: selectedDraft.tone,
      })
      setIsEditing(true)
      setSaveError(null)
    }
  }

  // Cancel edit mode
  const cancelEditing = () => {
    setIsEditing(false)
    setSaveError(null)
  }

  // Save draft changes
  const saveDraft = async () => {
    if (!selectedDraft) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await fetch(`http://localhost:8000/api/drafts/db/${selectedDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          opener: editValues.opener,
          followUp1: editValues.follow_up_1,
          followUp2: editValues.follow_up_2,
          tone: editValues.tone,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      const data = await response.json()
      if (data.success && data.data) {
        // Update the draft in state
        setSelectedDraft(data.data)
        setDrafts(drafts.map(d => d.id === data.data.id ? data.data : d))
        setIsEditing(false)
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  // Close modal and reset edit state
  const closeModal = () => {
    setSelectedDraft(null)
    setIsEditing(false)
    setSaveError(null)
  }

  return (
    <>
      <Navigation />

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/contacts"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Link>

            <h1 className="text-4xl font-bold text-neutral-900 mb-2">Draft History</h1>
            <p className="text-neutral-600">View and download all your generated email drafts</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-neutral-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search email..."
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Domain</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search domain..."
                    value={domainFilter}
                    onChange={(e) => setDomainFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Contact ID</label>
                <input
                  type="text"
                  placeholder="Filter by contact..."
                  value={contactFilter}
                  onChange={(e) => setContactFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Tone</label>
                <select
                  value={toneFilter}
                  onChange={(e) => setToneFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Tones</option>
                  <option value="direct">Direct</option>
                  <option value="consultative">Consultative</option>
                  <option value="warm">Warm</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setEmailFilter('')
                setDomainFilter('')
                setContactFilter('')
                setToneFilter('all')
                setPage(1)
              }}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Clear all filters
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-neutral-600">Loading drafts...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">Error: {error}</p>
            </div>
          )}

          {/* Drafts List */}
          {!loading && !error && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                {filteredDrafts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-600">No drafts found. Generate some drafts from the contacts page!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Domain</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {filteredDrafts.map((draft) => (
                          <tr key={draft.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-neutral-900">{draft.name || draft.email}</div>
                                <div className="text-sm text-neutral-500">{draft.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <a
                                href={`https://${draft.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
                              >
                                {draft.domain}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getToneBadgeColor(draft.tone)}`}>
                                {draft.tone}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-neutral-600">
                              {new Date(draft.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedDraft(draft)}
                                  className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => downloadDraft(draft)}
                                  className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                                  title="Download as .eml"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {filteredDrafts.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-neutral-600">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, filteredDrafts.length)} of {filteredDrafts.length} drafts
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={filteredDrafts.length < limit}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Draft Detail Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-neutral-900">{selectedDraft.name || selectedDraft.email}</h3>
                <p className="text-sm text-neutral-600">{selectedDraft.domain}</p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Save Error */}
              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{saveError}</span>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm">
                {isEditing ? (
                  <select
                    value={editValues.tone}
                    onChange={(e) => setEditValues({ ...editValues, tone: e.target.value as any })}
                    className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="direct">Direct</option>
                    <option value="consultative">Consultative</option>
                    <option value="warm">Warm</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getToneBadgeColor(selectedDraft.tone)}`}>
                    {selectedDraft.tone}
                  </span>
                )}
                <span className="text-neutral-600">
                  Created {new Date(selectedDraft.created_at).toLocaleDateString()}
                </span>
                {isEditing && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    Editing
                  </span>
                )}
              </div>

              {/* Opener */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">Opener</h4>
                {isEditing ? (
                  <textarea
                    value={editValues.opener}
                    onChange={(e) => setEditValues({ ...editValues, opener: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <div className="bg-neutral-50 rounded-lg p-4 text-neutral-800 whitespace-pre-wrap">{selectedDraft.opener}</div>
                )}
              </div>

              {/* Follow-up 1 */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">Follow-up 1</h4>
                {isEditing ? (
                  <textarea
                    value={editValues.follow_up_1}
                    onChange={(e) => setEditValues({ ...editValues, follow_up_1: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <div className="bg-neutral-50 rounded-lg p-4 text-neutral-800 whitespace-pre-wrap">{selectedDraft.follow_up_1}</div>
                )}
              </div>

              {/* Follow-up 2 */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">Follow-up 2</h4>
                {isEditing ? (
                  <textarea
                    value={editValues.follow_up_2}
                    onChange={(e) => setEditValues({ ...editValues, follow_up_2: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <div className="bg-neutral-50 rounded-lg p-4 text-neutral-800 whitespace-pre-wrap">{selectedDraft.follow_up_2}</div>
                )}
              </div>

              {/* Citations */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">Citations ({selectedDraft.citations.length})</h4>
                <div className="space-y-2">
                  {selectedDraft.citations.map((citation, i) => (
                    <div key={i} className="bg-neutral-50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 break-words"
                          >
                            {citation.title}
                          </a>
                          {citation.snippet && (
                            <p className="text-xs text-neutral-600 mt-1">{citation.snippet}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                {isEditing ? (
                  <>
                    <button
                      onClick={saveDraft}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Draft
                    </button>
                    <button
                      onClick={() => downloadDraft(selectedDraft)}
                      className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                    >
                      <Download className="h-4 w-4" />
                      Download .eml
                    </button>
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
