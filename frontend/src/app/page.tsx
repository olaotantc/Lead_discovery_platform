'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      {/* Top Nav */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
                <span className="text-white text-sm font-bold">SR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-neutral-900">SignalRunner</span>
                <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded-md">v0.2</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Pricing</a>
              <a href="#docs" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Docs</a>
              <a href="#faq" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">FAQ</a>
              <div className="h-4 w-px bg-neutral-300"></div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>API Status</span>
                </div>
              </div>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <Link href="/start" className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors">
                <span>Get Started</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

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
                <Link href="/start" className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/20 text-sm sm:text-base transition-all">
                  Get started — it&apos;s free
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
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

          {/* Feature Grid */}
          <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/></svg>
                  </div>
                  <div className="text-sm font-medium tracking-tight">Automated discovery</div>
                </div>
                <p className="mt-2 text-sm text-neutral-600">Crawl public pages for hiring and profile signals with full source attribution.</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div className="text-sm font-medium tracking-tight">Verified contacts</div>
                </div>
                <p className="mt-2 text-sm text-neutral-600">Return ≥25 verified contacts on average per run in ≤10 minutes.</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center text-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  </div>
                  <div className="text-sm font-medium tracking-tight">Scoring & intent</div>
                </div>
                <p className="mt-2 text-sm text-neutral-600">Fit, intent, reach, and recency with visual breakdowns and evidence.</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center text-sky-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
                  </div>
                  <div className="text-sm font-medium tracking-tight">Compliance‑first</div>
                </div>
                <p className="mt-2 text-sm text-neutral-600">Evidence‑linked drafts, verification, and required unsubscribe headers.</p>
              </div>
            </div>

            {/* CTA Banner */}
            <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">Start your first discovery run</h3>
                <p className="text-sm text-neutral-600 mt-1">No credit card required. Bring a URL or market brief.</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/start" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/20 transition-all">
                  Run Discovery
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
                <a href="#faq" className="inline-flex items-center gap-2 px-3 py-2.5 rounded-md bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-300 text-sm transition-all">
                  Learn more
                </a>
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
                <Link href="/start" className="hover:text-neutral-900 inline-flex items-center gap-1">
                  Launch app
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
