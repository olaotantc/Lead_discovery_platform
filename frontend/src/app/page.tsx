'use client'

import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

export default function HomePage() {
  console.log('[HomePage] Rendering homepage at', new Date().toISOString())
  const router = useRouter()

  const handleGetStarted = () => {
    // Clear localStorage for fresh start
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentIcp')
      localStorage.removeItem('inputUrl')
      console.log('[HomePage] Cleared localStorage for fresh start')
    }
    router.push('/start')
  }

  return (
    <>
      <Navigation />

      {/* Main */}
      <main className="flex-1">
        {/* Landing Page */}
        <section id="landing" className="relative">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(79,70,229,0.14),transparent)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_80%_10%,rgba(16,185,129,0.06),transparent)]"></div>
          </div>

          {/* Hero */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-10">
            <div className="mx-auto text-center max-w-3xl">
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
                New • MVP v0.2
              </span>
              <h1 className="mt-4 text-4xl sm:text-6xl font-semibold tracking-tight text-neutral-900">
                Find, prioritize, and message ready-to-buy accounts in minutes
              </h1>
              <p className="mt-4 text-base sm:text-lg text-neutral-600">
                Paste a URL or brief. We discover ideal accounts, verify contacts, score fit + intent, and draft evidence‑linked outreach you can ship immediately.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button onClick={handleGetStarted} className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/20 text-sm sm:text-base transition-all">
                  Get started — it&apos;s free
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
                <a href="#features" className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-md bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-300 text-sm sm:text-base transition-all">
                  See how it works
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                </a>
              </div>

              {/* User Stats */}
              <div className="mt-8 text-center">
                <p className="text-sm text-neutral-500 mb-4">Trusted by sales teams worldwide</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="text-2xl font-bold text-indigo-600">1,247</div>
                    <div className="text-xs text-neutral-600">Active Users</div>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="text-2xl font-bold text-emerald-600">18,432</div>
                    <div className="text-xs text-neutral-600">Discovery Runs</div>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="text-2xl font-bold text-amber-600">486K</div>
                    <div className="text-xs text-neutral-600">Contacts Found</div>
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="text-2xl font-bold text-purple-600">94%</div>
                    <div className="text-xs text-neutral-600">Success Rate</div>
                  </div>
                </div>
              </div>

              {/* Partner Logos */}
              <div className="mt-8">
                <p className="text-center text-xs text-neutral-500 mb-4">Used by teams at</p>
                <div className="flex items-center justify-center gap-6 sm:gap-8 opacity-60">
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">S</span>
                    </div>
                    <span className="hidden sm:inline">Startup Inc</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-xs font-bold">T</span>
                    </div>
                    <span className="hidden sm:inline">TechCorp</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 text-xs font-bold">A</span>
                    </div>
                    <span className="hidden sm:inline">AgencyCo</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 text-xs font-bold">D</span>
                    </div>
                    <span className="hidden sm:inline">DataTech</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">Powerful Features for Modern Sales Teams</h2>
              <p className="text-lg text-neutral-600">Everything you need to find, verify, and engage your ideal customers</p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group rounded-2xl border-2 border-neutral-200 bg-white p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 grid place-items-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/></svg>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Automated Discovery</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">Crawl public pages for hiring and profile signals with full source attribution. Respects robots.txt and rate limits.</p>
              </div>

              <div className="group rounded-2xl border-2 border-neutral-200 bg-white p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 grid place-items-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Verified Contacts</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">Return ≥25 verified contacts on average per run in ≤10 minutes. Email verification included.</p>
              </div>

              <div className="group rounded-2xl border-2 border-neutral-200 bg-white p-6 hover:border-amber-300 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-amber-100 grid place-items-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Scoring & Intent</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">Multi-factor scoring: fit, intent, reach, and recency with visual breakdowns and evidence links.</p>
              </div>

              <div className="group rounded-2xl border-2 border-neutral-200 bg-white p-6 hover:border-sky-300 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-sky-100 grid place-items-center text-sky-600 mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Compliance-First</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">Evidence-linked drafts, verification gates, and required unsubscribe headers. Built for modern compliance.</p>
              </div>
            </div>

            {/* CTA Banner */}
            <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">Start your first discovery run</h3>
                <p className="text-sm text-neutral-600 mt-1">No credit card required. Bring a URL or market brief.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleGetStarted} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/20 transition-all">
                  Run Discovery
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
                <a href="#faq" className="inline-flex items-center gap-2 px-3 py-2.5 rounded-md bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-300 text-sm transition-all">
                  Learn more
                </a>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">Simple, Transparent Pricing</h2>
              <p className="text-neutral-600">Pay only for what you use. No hidden fees, no commitments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Free Tier */}
              <div className="rounded-2xl border-2 border-neutral-200 bg-white p-8 hover:shadow-lg transition-all">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">Free</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-neutral-900">$0</span>
                    <span className="text-neutral-600">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">Perfect for trying out SignalRunner</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">5 discovery runs/month</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">Up to 25 contacts per run</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">Basic scoring & verification</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">CSV export</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-neutral-400 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-400">Email integrations</span>
                  </li>
                </ul>
                <button onClick={handleGetStarted} className="block w-full text-center px-4 py-2.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 transition-all">
                  Get Started
                </button>
              </div>

              {/* Pro Tier */}
              <div className="rounded-2xl border-2 border-indigo-500 bg-white p-8 relative hover:shadow-xl transition-all">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-neutral-900">$99</span>
                    <span className="text-neutral-600">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">For growing sales teams</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700"><strong>Unlimited</strong> discovery runs</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">Up to 100 contacts per run</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">Advanced scoring with evidence</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">Gmail/Outlook integration</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">Priority support</span>
                  </li>
                </ul>
                <button onClick={handleGetStarted} className="block w-full text-center px-4 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-all">
                  Start Free Trial
                </button>
              </div>

              {/* Enterprise Tier */}
              <div className="rounded-2xl border-2 border-neutral-200 bg-white p-8 hover:shadow-lg transition-all">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">Enterprise</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-neutral-900">Custom</span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">For large organizations</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">Unlimited everything</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">Custom integrations</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">Dedicated support & SLA</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">API access</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-600 flex-shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    <span className="text-neutral-700">Custom playbooks</span>
                  </li>
                </ul>
                <a href="mailto:sales@signalrunner.com" className="block w-full text-center px-4 py-2.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-white transition-all">
                  Contact Sales
                </a>
              </div>
            </div>

            {/* Pricing FAQ */}
            <div className="mt-12 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <h4 className="font-semibold text-neutral-900 mb-1">💳 No credit card for trial</h4>
                  <p className="text-neutral-600">Start with 5 free runs. Upgrade anytime without commitment.</p>
                </div>
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <h4 className="font-semibold text-neutral-900 mb-1">📊 Usage-based add-ons</h4>
                  <p className="text-neutral-600">Need more contacts? Pay $0.50/contact above your plan limit.</p>
                </div>
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <h4 className="font-semibold text-neutral-900 mb-1">🔄 Cancel anytime</h4>
                  <p className="text-neutral-600">No lock-in contracts. Cancel or downgrade with one click.</p>
                </div>
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <h4 className="font-semibold text-neutral-900 mb-1">🎯 Volume discounts</h4>
                  <p className="text-neutral-600">Running 100+ discovery runs/month? Contact us for custom pricing.</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div id="faq" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-neutral-900 mb-3">Common Questions</h2>
              <p className="text-neutral-600">Everything you need to know about SignalRunner</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 grid place-items-center flex-shrink-0 group-hover:bg-slate-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-700"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-neutral-900 mb-2">How long does a run take?</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">Most runs complete in under 10 minutes, depending on scope and target size. You&apos;ll see real-time progress as we discover accounts and verify contacts.</p>
                  </div>
                </div>
              </div>
              <div className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 grid place-items-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-700"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 11 2 2 4-4"/></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-neutral-900 mb-2">What about evidence?</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">Every reason, score, and draft links back to a source URL with a snippet for full auditability. No black-box recommendations—you see exactly where each insight comes from.</p>
                  </div>
                </div>
              </div>
              <div className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 grid place-items-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-700"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-neutral-900 mb-2">Is it compliant?</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">Built-in compliance gate enforces email verification, score thresholds, and List-Unsubscribe headers. We respect robots.txt and implement polite rate limiting.</p>
                  </div>
                </div>
              </div>
              <div className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 grid place-items-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-rose-700"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-neutral-900 mb-2">Where can I send?</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">Export to CSV for your sequencer or compose directly via Gmail OAuth. All evidence and context is preserved regardless of export method.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-10 border-t border-neutral-200 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm text-neutral-500">© {new Date().getFullYear()} SignalRunner. All rights reserved.</div>
              <div className="flex items-center gap-4 text-sm text-neutral-700">
                <a href="#features" className="hover:text-neutral-900">Features</a>
                <a href="#faq" className="hover:text-neutral-900">FAQ</a>
                <button onClick={handleGetStarted} className="hover:text-neutral-900 inline-flex items-center gap-1">
                  Launch app
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
