export default function SignalRunnerApp() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>SignalRunner — MVP v0.2</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
        <script src="https://unpkg.com/lucide@0.447.0/dist/umd/lucide.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-white text-neutral-900 antialiased font-sans" style={{fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial', scrollBehavior: 'smooth'}}>
        {/* App Shell */}
        <div className="min-h-screen flex flex-col">
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
                  {/* Mobile Menu Button */}
                  <button id="mobile-menu-btn" className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <line x1="4" x2="20" y1="6" y2="6"></line>
                      <line x1="4" x2="20" y1="12" y2="12"></line>
                      <line x1="4" x2="20" y1="18" y2="18"></line>
                    </svg>
                  </button>

                  {/* Theme Toggle */}
                  <button id="darkToggle" className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-sm text-neutral-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                    </svg>
                    <span className="hidden lg:inline">Dark</span>
                  </button>

                  {/* Sign In */}
                  <button className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm text-neutral-700 hover:text-neutral-900 transition-colors">
                    Sign in
                  </button>

                  {/* Get Started Button */}
                  <a id="header-get-started" href="/start" className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-md transition-colors">
                    <span>Get Started</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Mobile Navigation Menu */}
              <div id="mobile-menu" className="md:hidden hidden border-t border-neutral-200 py-4">
                <div className="flex flex-col space-y-3">
                  <a href="#features" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors py-2">Features</a>
                  <a href="#pricing" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors py-2">Pricing</a>
                  <a href="#docs" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors py-2">Docs</a>
                  <a href="#faq" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors py-2">FAQ</a>
                  <div className="border-t border-neutral-200 pt-3 mt-3">
                    <button className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors py-2 w-full text-left">Sign in</button>
                  </div>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="sparkles" className="lucide lucide-sparkles w-3.5 h-3.5"></svg>
                    New • MVP v0.2
                  </span>
                  <h1 id="hero-title" className="mt-4 text-4xl sm:text-6xl font-semibold tracking-tight text-neutral-900">
                    Find, prioritize, and message ready-to-buy accounts in minutes
                  </h1>
                  <p className="mt-4 text-base sm:text-lg text-neutral-600">
                    Paste a URL or brief. We discover ideal accounts, verify contacts, score fit + intent, and draft evidence‑linked outreach you can ship immediately.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <a id="btn-get-started" href="/start" className="motion-btn inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/20 text-sm sm:text-base" data-tooltip="Start the app">
                      Get started — it's free
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="arrow-right" className="lucide lucide-arrow-right w-4 h-4"></svg>
                    </a>
                    <a href="#features" className="motion-btn inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-md bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-300 text-sm sm:text-base" data-tooltip="Scroll to features">
                      See how it works
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="play" className="lucide lucide-play w-4 h-4"></svg>
                    </a>
                  </div>

                  {/* User Stats */}
                  <div className="mt-8 text-center">
                    <p className="text-sm text-neutral-500 mb-4">Trusted by sales teams worldwide</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="tilt rounded-lg border border-neutral-200 bg-white p-4">
                        <div className="text-2xl font-bold text-indigo-600" id="active-users-count">1,247</div>
                        <div className="text-xs text-neutral-600">Active Users</div>
                      </div>
                      <div className="tilt rounded-lg border border-neutral-200 bg-white p-4">
                        <div className="text-2xl font-bold text-emerald-600" id="discovery-runs-count">18,432</div>
                        <div className="text-xs text-neutral-600">Discovery Runs</div>
                      </div>
                      <div className="tilt rounded-lg border border-neutral-200 bg-white p-4">
                        <div className="text-2xl font-bold text-amber-600" id="contacts-discovered-count">486K</div>
                        <div className="text-xs text-neutral-600">Contacts Found</div>
                      </div>
                      <div className="tilt rounded-lg border border-neutral-200 bg-white p-4">
                        <div className="text-2xl font-bold text-purple-600" id="success-rate">94%</div>
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

                {/* Live Preview Card */}
                <div className="mt-10 sm:mt-14">
                  <div className="tilt rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.03)_inset,0,20px_60px_-30px_rgba(0,0,0,0.15)]">
                    <div className="p-3 border-b border-neutral-200 flex items-center gap-2 text-sm text-neutral-700">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      ICP Discovery
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="tilt lg:col-span-2 rounded-xl border border-neutral-200 bg-white">
                          <div className="p-4 border-b border-neutral-200 flex items-center gap-3">
                            <span className="inline-flex gap-2 text-neutral-800 bg-neutral-50 border-neutral-200 border rounded-md px-3 py-1.5 items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="link" className="w-4 h-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                              URL
                            </span>
                            <div className="ml-auto text-xs text-neutral-500">Auth: JWT (app), OAuth for Gmail/Outlook</div>
                          </div>
                          <div className="p-4 space-y-3">
                            <label className="text-sm text-neutral-800">Company or Market URL</label>
                            <div className="flex gap-2">
                              <input id="demo-url-input" type="url" placeholder="https://example.com" className="flex-1 rounded-md bg-white border border-neutral-200 px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-neutral-300" />
                              <button id="demo-run-btn" className="motion-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/20" data-tooltip="Run discovery">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="scan-line" className="w-4 h-4"></svg>
                                Run
                              </button>
                            </div>
                            <div className="text-xs text-neutral-500">We crawl public pages, respect robots.txt, and link sources.</div>
                          </div>
                        </div>
                        <div className="tilt rounded-xl border border-neutral-200 bg-white">
                          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                            <h3 className="text-base font-medium tracking-tight">ICP Preview</h3>
                            <span className="text-xs text-neutral-500">v0.2</span>
                          </div>
                          <div className="p-4 space-y-3 text-xs">
                            <div id="icp-preview-tags" className="flex flex-wrap gap-2">
                              <span className="px-2.5 py-1.5 rounded-md bg-neutral-50 border border-neutral-200">Local services</span>
                              <span className="px-2.5 py-1.5 rounded-md border border-neutral-200">51–200</span>
                              <span className="px-2.5 py-1.5 rounded-md bg-neutral-50 border border-neutral-200">West LA</span>
                              <span className="px-2.5 py-1.5 rounded-md bg-neutral-50 border border-neutral-200">Owner</span>
                            </div>
                            <div className="pt-2 border-t border-neutral-200 text-neutral-600">Observability</div>
                            <div className="text-neutral-500 space-y-1 max-h-16 overflow-auto no-scrollbar">
                              <div>22:52:59 • ui_tab</div>
                              <div>22:52:57 • run_started</div>
                              <div>22:52:43 • run_started</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Grid */}
              <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 sm:pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="tilt rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center text-indigo-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="radar" className="w-4 h-4"></svg>
                      </div>
                      <div className="text-sm font-medium tracking-tight">Automated discovery</div>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">Crawl public pages for hiring and profile signals with full source attribution.</p>
                  </div>
                  <div className="tilt rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center text-emerald-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="users" className="w-4 h-4"></svg>
                      </div>
                      <div className="text-sm font-medium tracking-tight">Verified contacts</div>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">Return ≥25 verified contacts on average per run in ≤10 minutes.</p>
                  </div>
                  <div className="tilt rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center text-amber-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="target" className="w-4 h-4"></svg>
                      </div>
                      <div className="text-sm font-medium tracking-tight">Scoring & intent</div>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">Fit, intent, reach, and recency with visual breakdowns and evidence.</p>
                  </div>
                  <div className="tilt rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center text-sky-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="shield-check" className="w-4 h-4"></svg>
                      </div>
                      <div className="text-sm font-medium tracking-tight">Compliance‑first</div>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">Evidence‑linked drafts, verification, and required unsubscribe headers.</p>
                  </div>
                </div>

                {/* CTA Banner */}
                <div className="mt-8 tilt rounded-2xl border border-neutral-200 bg-white p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">Start your first discovery run</h3>
                    <p className="text-sm text-neutral-600 mt-1">No credit card required. Bring a URL or market brief.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a id="btn-get-started-2" href="/start" className="motion-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/20" data-tooltip="Start the app">
                      Run Discovery
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="arrow-right" className="w-4 h-4"></svg>
                    </a>
                    <a href="#faq" className="motion-btn inline-flex items-center gap-2 px-3 py-2.5 rounded-md bg-neutral-50 hover:bg-neutral-100 text-neutral-900 border border-neutral-300 text-sm" data-tooltip="Open FAQ">
                      Learn more
                    </a>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="tilt rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="clock" className="w-4 h-4 text-neutral-700"></svg>
                      </div>
                      <div className="text-sm font-medium tracking-tight">How long does a run take?</div>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">Most runs complete in under 10 minutes, depending on scope and target size.</p>
                  </div>
                  <div className="tilt rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="file-check" className="w-4 h-4 text-neutral-700"></svg>
                      </div>
                      <div className="text-sm font-medium tracking-tight">What about evidence?</div>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">Every reason, score, and draft links back to a source URL with a snippet for auditability.</p>
                  </div>
                  <div className="tilt rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="shield" className="w-4 h-4 text-neutral-700"></svg>
                      </div>
                      <div className="text-sm font-medium tracking-tight">Is it compliant?</div>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">Compliance gate enforces verification, score thresholds, and List‑Unsubscribe headers.</p>
                  </div>
                  <div className="tilt rounded-xl border border-neutral-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md bg-neutral-50 border border-neutral-200 grid place-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="mail" className="w-4 h-4 text-neutral-700"></svg>
                      </div>
                      <div className="text-sm font-medium tracking-tight">Where can I send?</div>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">Export CSV or compose directly via Gmail with OAuth — evidence preserved.</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-10 border-t border-neutral-200 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-sm text-neutral-500">© <span id="year">{new Date().getFullYear()}</span> SignalRunner. All rights reserved.</div>
                  <div className="flex items-center gap-4 text-sm text-neutral-700">
                    <a href="#features" className="hover:text-neutral-900">Features</a>
                    <a href="#faq" className="hover:text-neutral-900">FAQ</a>
                    <a id="footer-get-started" href="/start" className="motion-btn hover:text-neutral-900 inline-flex items-center gap-1" data-tooltip="Launch app">
                      Launch app
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-lucide="arrow-right" className="w-4 h-4"></svg>
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>

        {/* Styles and Scripts */}
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .motion-btn { transition: transform .15s ease, background-color .2s ease, color .2s ease, border-color .2s ease, box-shadow .2s ease; will-change: transform; }
          .motion-btn:active { transform: translateY(1px) scale(0.98); }
          .tilt { transform-style: preserve-3d; transition: transform .2s ease, box-shadow .2s ease; }
          .tilt:hover { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.2); }
        `}</style>

        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try { window.lucide && window.lucide.createIcons(); } catch(e){}

              // Navigation interactions
              const getStartedBtns = document.querySelectorAll('#btn-get-started, #btn-get-started-2, #footer-get-started, #header-get-started');
              getStartedBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                  window.location.href = '/start';
                });
              });

              // Mobile menu toggle
              const mobileMenuBtn = document.getElementById('mobile-menu-btn');
              const mobileMenu = document.getElementById('mobile-menu');
              if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.addEventListener('click', () => {
                  mobileMenu.classList.toggle('hidden');
                });
              }

              // Animated counters for user stats
              function animateCounter(elementId, target, suffix = '') {
                const element = document.getElementById(elementId);
                if (!element) return;

                let current = 0;
                const increment = target / 100;
                const timer = setInterval(() => {
                  current += increment;
                  if (current >= target) {
                    current = target;
                    clearInterval(timer);
                  }

                  let displayValue;
                  if (target >= 1000000) {
                    displayValue = (current / 1000000).toFixed(1) + 'M';
                  } else if (target >= 1000) {
                    displayValue = (current / 1000).toFixed(0) + 'K';
                  } else {
                    displayValue = Math.floor(current).toLocaleString();
                  }

                  element.textContent = displayValue + suffix;
                }, 30);
              }

              // Start counter animations after a short delay
              setTimeout(() => {
                animateCounter('active-users-count', 1247);
                animateCounter('discovery-runs-count', 18432);
                animateCounter('contacts-discovered-count', 486000);
                animateCounter('success-rate', 94, '%');
              }, 500);

              // Demo section functionality
              const demoInput = document.getElementById('demo-url-input');
              const demoBtn = document.getElementById('demo-run-btn');
              const icpTags = document.getElementById('icp-preview-tags');

              if (demoBtn && demoInput && icpTags) {
                demoBtn.addEventListener('click', () => {
                  let url = demoInput.value.trim();
                  if (!url) {
                    alert('Please enter a URL to analyze');
                    return;
                  }

                  // Normalize URL to include protocol if missing
                  if (!/^https?:\/\//i.test(url)) {
                    url = 'https://' + url;
                    demoInput.value = url;
                  }

                  // Show loading state
                  demoBtn.innerHTML = '<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"></circle><path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analyzing...';
                  demoBtn.disabled = true;

                  // Simulate API call
                  setTimeout(() => {
                    // Generate dynamic ICP preview based on URL
                    let domain = '';
                    try {
                      domain = new URL(url).hostname.replace('www.', '');
                    } catch (e) {
                      alert('Please enter a valid URL (e.g., https://example.com)');
                      demoBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M3 6l3 6l3-6m6 0l3 6l3-6"></path><path d="M3 6h18m-9 6v6"></path></svg>Run';
                      demoBtn.disabled = false;
                      return;
                    }
                    const industries = ['SaaS', 'E-commerce', 'Fintech', 'Healthcare', 'Education', 'Manufacturing'];
                    const sizes = ['1-10', '11-50', '51-200', '201-500', '500+'];
                    const regions = ['San Francisco', 'New York', 'Austin', 'Seattle', 'Boston', 'Remote'];
                    const roles = ['CEO', 'CTO', 'VP Sales', 'Marketing Director', 'Founder'];

                    const industry = industries[Math.floor(Math.random() * industries.length)];
                    const size = sizes[Math.floor(Math.random() * sizes.length)];
                    const region = regions[Math.floor(Math.random() * regions.length)];
                    const role = roles[Math.floor(Math.random() * roles.length)];

                    icpTags.innerHTML =
                      '<span class="px-2.5 py-1.5 rounded-md bg-neutral-50 border border-neutral-200">' + industry + '</span>' +
                      '<span class="px-2.5 py-1.5 rounded-md border border-neutral-200">' + size + '</span>' +
                      '<span class="px-2.5 py-1.5 rounded-md bg-neutral-50 border border-neutral-200">' + region + '</span>' +
                      '<span class="px-2.5 py-1.5 rounded-md bg-neutral-50 border border-neutral-200">' + role + '</span>';

                    // Reset button
                    demoBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M3 6l3 6l3-6m6 0l3 6l3-6"></path><path d="M3 6h18m-9 6v6"></path></svg>Run';
                    demoBtn.disabled = false;

                    // Add success notification
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-sm z-50';
                    notification.innerHTML = '✅ ICP Preview generated for ' + domain;
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);

                  }, 2000);
                });
              }

              // Tilt effects
              document.querySelectorAll('.tilt').forEach(el => {
                el.addEventListener('mousemove', (e) => {
                  const rect = el.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const rx = ((y - rect.height/2) / rect.height) * -6;
                  const ry = ((x - rect.width/2) / rect.width) * 8;
                  el.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(0)';
                });
                el.addEventListener('mouseleave', () => {
                  el.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)';
                });
              });
            })();
          `
        }} />
      </body>
    </html>
  );
}
