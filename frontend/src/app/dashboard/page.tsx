'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'
import {
  Target,
  Users,
  Building2,
  TrendingUp,
  ArrowRight,
  Clock,
  Mail,
  FileSearch,
} from 'lucide-react'

interface DashboardStats {
  icpCount: number
  discoveryRuns: number
  totalCompaniesFound: number
  totalContactsFound: number
  averageScore: number
  recentActivity: Array<{
    type: 'icp' | 'discovery' | 'contact'
    description: string
    timestamp: string
  }>
}

export default function DashboardPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
  const { token, user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers: HeadersInit = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        const res = await fetch(`${apiBase}/api/stats/dashboard`, {
          headers,
          credentials: 'include',
        })
        const json = await res.json()
        if (json.success) {
          setStats(json.data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchStats()
    }
  }, [apiBase, token, authLoading])

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'icp':
        return <Target className="h-4 w-4 text-purple-600" />
      case 'discovery':
        return <FileSearch className="h-4 w-4 text-blue-600" />
      case 'contact':
        return <Mail className="h-4 w-4 text-green-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {user ? `Welcome back, ${user.email.split('@')[0]}` : 'Dashboard'}
            </h1>
            <p className="text-lg text-gray-600">
              Your lead discovery activity at a glance
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* ICPs Created */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                  ICPs
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.icpCount ?? 0}
              </div>
              <p className="text-sm text-gray-500">ICPs created</p>
            </div>

            {/* Discovery Runs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileSearch className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Runs
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.discoveryRuns ?? 0}
              </div>
              <p className="text-sm text-gray-500">Discovery runs</p>
            </div>

            {/* Companies Found */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  Companies
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.totalCompaniesFound ?? 0}
              </div>
              <p className="text-sm text-gray-500">Companies found</p>
            </div>

            {/* Contacts Found */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  Contacts
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.totalContactsFound ?? 0}
              </div>
              <p className="text-sm text-gray-500">Contacts discovered</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/start"
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all group"
                  >
                    <div>
                      <div className="font-semibold mb-1">New Discovery</div>
                      <div className="text-sm text-indigo-100">Create an ICP and find leads</div>
                    </div>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/contacts"
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all group"
                  >
                    <div>
                      <div className="font-semibold mb-1">Find Contacts</div>
                      <div className="text-sm text-green-100">Discover emails for a domain</div>
                    </div>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/accounts"
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all group"
                  >
                    <div>
                      <div className="font-semibold mb-1">Saved Accounts</div>
                      <div className="text-sm text-blue-100">View your saved companies</div>
                    </div>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/discover/results"
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all group"
                  >
                    <div>
                      <div className="font-semibold mb-1">Recent Results</div>
                      <div className="text-sm text-amber-100">View discovery results</div>
                    </div>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Average Score Card */}
              {stats && stats.averageScore > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Average Lead Score</h2>
                      <p className="text-sm text-gray-500">Across all discovery runs</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <span
                        className={`text-4xl font-bold ${
                          stats.averageScore >= 70
                            ? 'text-green-600'
                            : stats.averageScore >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {Math.round(stats.averageScore)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-4">No recent activity yet</p>
                  <Link
                    href="/start"
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Start your first discovery
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Getting Started Guide (for new users) */}
          {stats && stats.icpCount === 0 && stats.discoveryRuns === 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Getting Started
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Create an ICP</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter a URL and brief to generate your Ideal Customer Profile
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Run Discovery</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Find companies that match your ICP with AI-powered search
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Find Contacts</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Discover verified emails and generate outreach drafts
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/start"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Start Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
