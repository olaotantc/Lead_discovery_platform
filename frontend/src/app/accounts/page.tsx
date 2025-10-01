'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Building2, CheckSquare, Square, Trash2, ArrowRight, Filter, Search } from 'lucide-react'
import Navigation from '@/components/Navigation'

interface Account {
  id: string
  name: string
  domain: string
  description?: string
  industry?: string
  size?: string
  businessModel?: string
  confidence?: number
  score?: number
  scoreFacets?: {
    industryFit?: { score: number; reasonCodes: string[] }
    sizeFit?: { score: number; reasonCodes: string[] }
    modelFit?: { score: number; reasonCodes: string[] }
    keywordMatch?: { score: number; reasonCodes: string[] }
  }
  source: string
  matchReasons?: string[]
  sourcedFrom?: Record<string, unknown>
  status: 'discovered' | 'selected' | 'contacted' | 'qualified' | 'disqualified'
  discoveredAt: string
  updatedAt: string
}

interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export default function AccountsPage() {
  const { token } = useAuth()
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

  const [accounts, setAccounts] = useState<Account[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'discovered_at' | 'score' | 'name'>('discovered_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)

  // Load accounts
  useEffect(() => {
    loadAccounts()
  }, [statusFilter, sortBy, sortOrder])

  async function loadAccounts(offset = 0) {
    if (!token) {
      setError('Authentication required')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: offset.toString(),
        sortBy,
        sortOrder,
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiBase}/api/accounts/list?${params}`, {
        headers,
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to load accounts: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setAccounts(data.accounts)
        setPagination(data.pagination)
      } else {
        throw new Error(data.error || 'Failed to load accounts')
      }
    } catch (err) {
      console.error('Load accounts error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle selection
  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // Select/deselect all
  function toggleSelectAll() {
    if (selectedIds.size === accounts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(accounts.map(a => a.id)))
    }
  }

  // Delete selected accounts
  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected account(s)?`)) return

    setIsProcessing(true)
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`${apiBase}/api/accounts/${id}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        })
      )
      await Promise.all(promises)
      setSelectedIds(new Set())
      loadAccounts()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete some accounts')
    } finally {
      setIsProcessing(false)
    }
  }

  // Start contact discovery for selected accounts
  async function handleStartDiscovery() {
    if (selectedIds.size === 0) {
      alert('Please select at least one account')
      return
    }

    setIsProcessing(true)
    try {
      // Get selected accounts
      const selectedAccounts = accounts.filter(a => selectedIds.has(a.id))

      // For now, navigate to contacts page with first account
      // In future, could batch trigger multiple jobs
      const first = selectedAccounts[0]
      if (first) {
        window.location.href = `/contacts?url=${encodeURIComponent(first.domain)}`
      }
    } catch (err) {
      console.error('Discovery error:', err)
      alert('Failed to start discovery')
    } finally {
      setIsProcessing(false)
    }
  }

  // Filtered accounts (client-side search)
  const filteredAccounts = accounts.filter(account => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        account.name.toLowerCase().includes(query) ||
        account.domain.toLowerCase().includes(query) ||
        account.industry?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Saved Accounts</h1>
          </div>
          <p className="text-gray-600">Manage your discovered accounts and start contact discovery</p>
        </div>
        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="discovered">Discovered</option>
                <option value="selected">Selected</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              >
                <option value="discovered_at">Date Added</option>
                <option value="score">Score</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedIds.size} account(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteSelected}
                  disabled={isProcessing}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  Delete
                </button>
                <button
                  onClick={handleStartDiscovery}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4 inline mr-2" />
                  Start Contact Discovery
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading accounts...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredAccounts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search filters'
                : 'Start by discovering lookalike companies from your ICP'}
            </p>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Find Accounts
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Accounts Table */}
        {!isLoading && !error && filteredAccounts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button onClick={toggleSelectAll} className="hover:bg-gray-100 p-1 rounded">
                      {selectedIds.size === accounts.length ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedIds.has(account.id) ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSelect(account.id)}
                        className="hover:bg-gray-100 p-1 rounded"
                      >
                        {selectedIds.has(account.id) ? (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{account.name}</span>
                        <span className="text-sm text-gray-500">{account.domain}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{account.industry || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{account.size || '-'}</td>
                    <td className="px-6 py-4">
                      {account.score !== undefined ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            account.score >= 85
                              ? 'bg-green-100 text-green-800'
                              : account.score >= 70
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {account.score.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          account.status === 'discovered'
                            ? 'bg-blue-100 text-blue-800'
                            : account.status === 'selected'
                            ? 'bg-indigo-100 text-indigo-800'
                            : account.status === 'contacted'
                            ? 'bg-purple-100 text-purple-800'
                            : account.status === 'qualified'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(account.discoveredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination && pagination.hasMore && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {pagination.offset + 1} to {pagination.offset + filteredAccounts.length} of{' '}
                  {pagination.total} accounts
                </p>
                <button
                  onClick={() => loadAccounts(pagination.offset + pagination.limit)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
