# SignalRunner - Product Backlog

## 🚀 High Priority Features

### 1. Simplified Single-Flow Discovery (Workflow Optimization)
**Status**: Planned for v0.3
**Priority**: High
**Effort**: 1-2 weeks
**Inspired by**: Gojiberry's streamlined approach

**Problem Statement:**
Current workflow requires 4 manual steps with multiple page transitions:
1. Enter URL → Generate ICP
2. Find lookalike companies → view results
3. Save companies to accounts
4. Generate drafts for each contact

This is **too long-winded** - users have to make decisions at each step, causing friction and drop-off.

**Competitor Analysis (Gojiberry):**
- **What they do**: AI sales agent runs 24/7, finding warm leads automatically
- **Key features**: LinkedIn intent tracking, automated campaigns, smart lead scoring, Slack alerts, unlimited imports
- **Value prop**: "Less prospecting, more closing"
- **Differentiator**: Proactive vs reactive, platform-native (LinkedIn), automation-first

**Proposed Solution:**

Merge steps 2-4 into one automated background process:

**New Workflow:**
```
1. Enter URL → Click "Generate & Discover"
   ↓ (Backend runs automatically in sequence:)
   - Generate ICP (8-10s)
   - Find lookalike companies (10-15s)
   - Discover contacts at each company (5-10s per company)
   - Score all contacts (1-2s)
   - Generate drafts for top contacts (3-5s per contact)

2. Show unified results page with everything ready:
   "✅ Found 47 accounts • 156 contacts • 156 drafts ready"

3. One-click actions:
   [Copy Draft] [Send via Gmail] [Send via LinkedIn] [Export CSV]
```

**UI Design:**
```
┌─────────────────────────────────────────────────────────┐
│  🎯 Discovery Complete - projectmaven.io ICP            │
│  47 accounts • 156 contacts • All drafts ready          │
├─────────────────────────────────────────────────────────┤
│  [Filters: Score >80 ▼] [Industry: All ▼] [Role: All ▼]│
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🏢 Acme SaaS Inc.              Score: 92 🔥       │ │
│  │ B2B SaaS • 25 employees • Series A                │ │
│  │ 3 contacts found                                   │ │
│  │                                                    │ │
│  │ 👤 John Doe - CEO                   Score: 95 🔥  │ │
│  │ ✉️ john.doe@acmesaas.com           ✅ Verified    │ │
│  │                                                    │ │
│  │ 💬 Draft: "Hi John, I noticed Acme just raised    │ │
│  │    Series A and is expanding into enterprise..."  │ │
│  │                                                    │ │
│  │ [📋 Copy] [✉️ Send via Gmail] [🔗 LinkedIn DM]    │ │
│  │ [👁️ View Full Evidence]                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🏢 Beta Tech Corp                  Score: 88       │ │
│  │ ...                                                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Export All to CSV] [Send Batch via Smartlead]        │
└─────────────────────────────────────────────────────────┘
```

**Backend Implementation:**
```typescript
// New route: POST /api/discovery/full-run
async function fullDiscoveryRun(companyUrl: string) {
  // 1. Generate ICP
  const icp = await inferICP(companyUrl);

  // 2. Find lookalike companies
  const companies = await findLookalikeCompanies(icp);

  // 3. For each company, discover contacts
  const allContacts = [];
  for (const company of companies.slice(0, 50)) { // Limit to top 50
    const contacts = await discoverContacts(company.domain, icp.buyerRoles);
    allContacts.push(...contacts);
  }

  // 4. Score all contacts
  const scoredContacts = await scoreContacts(allContacts, icp);

  // 5. Generate drafts for top 50 contacts (score >70)
  const topContacts = scoredContacts.filter(c => c.score >= 70).slice(0, 50);
  const drafts = await generateDraftsForContacts(topContacts, icp);

  return {
    icp,
    companies: companies.length,
    contacts: allContacts.length,
    drafts: drafts.length,
    results: drafts.map(d => ({
      company: d.company,
      contact: d.contact,
      score: d.score,
      draft: d.draft,
      evidence: d.evidence
    }))
  };
}
```

**Changes Required:**
- **Backend**: New `/api/discovery/full-run` endpoint that orchestrates entire flow
- **Frontend**: Single results page replacing `/accounts` and separate draft pages
- **Loading UX**: Progress indicator showing current step (ICP → Companies → Contacts → Drafts)
- **Remove**: `/accounts` page (redundant)

**Success Metrics:**
- Time to first result: <2 minutes (down from 5-10 minutes)
- User drop-off rate: <10% (down from ~40% with multi-step flow)
- Drafts generated per session: >50 (up from ~10)

**Estimated Timeline:**
- Week 1: Backend orchestration endpoint + job queue setup
- Week 2: New results UI + loading states + draft actions

---

### 2. Hybrid Discovery: Individual Professionals + Companies
**Status**: Planned for v0.3
**Priority**: High
**Effort**: 2-3 weeks

**Problem Statement:**
Current discovery only finds contacts at company domains. However, ProjectMaven's ICP includes:
- Individual professionals (indie devs, solo founders, freelancers) - people without company domains
- Companies (B2B SaaS startups, tech companies) - organizations with domains

**Current Limitation:**
When ICP identifies "Indie Developers" or "Solo Founders" as targets, the platform can't discover them because they don't have company domains to search against.

**Solution Design:**

#### Phase 2A: Individual Profile Discovery
**Goal**: Find individual professionals matching ICP criteria through profile-based search

**Data Sources:**
- LinkedIn Sales Navigator API (requires enterprise license)
- Apollo.io API (B2B contact database)
- Hunter.io (email finder)
- GitHub API (for developer profiles)
- Twitter/X API (for thought leaders)
- ProductHunt API (for indie makers)

**Discovery Strategy:**
```typescript
interface IndividualDiscoveryRequest {
  icp: {
    roles: string[]              // e.g., ["Indie Developer", "Solo Founder"]
    segments: string[]            // e.g., ["Freelancers", "Bootstrappers"]
    industries: string[]          // e.g., ["Software", "SaaS"]
    geographicFocus?: string     // e.g., "United States, Europe"
    keywords: string[]            // e.g., ["TypeScript", "React", "Next.js"]
  }
  platforms: ('linkedin' | 'github' | 'twitter' | 'producthunt')[]
  limit: number
}

interface IndividualProfile {
  id: string
  name: string
  title: string
  bio: string
  location?: string
  email?: string                 // Direct if found, pattern-based otherwise
  confidence: number
  platforms: {
    linkedin?: string
    github?: string
    twitter?: string
    website?: string
  }
  signals: {
    recentActivity: string[]     // Posts, repos, products launched
    keywords: string[]            // Technologies, interests mentioned
    engagement: number            // Followers, stars, engagement rate
  }
  score: number
  scoreFacets: {
    roleFit: number
    activityLevel: number
    reachability: number
    relevance: number
  }
}
```

**Backend Implementation:**
- `/api/individual-discovery/search` - Search for individuals matching ICP
- `/api/individual-discovery/:jobId` - Poll for results
- Service: `backend/src/services/individualDiscovery.ts`
- Worker: `individual-discovery` queue in BullMQ

**Frontend Implementation:**
- Update `/start` page to detect if ICP includes individuals
- Show both "Companies" and "Individuals" tabs in results
- Individual results show profile preview with platform links
- Email enrichment on-demand (click to reveal)

**Scoring Logic:**
```typescript
// Individual Fit Score (0-100)
- Role Match: 35 points (title/bio contains target role keywords)
- Activity Level: 25 points (recent posts/commits/products)
- Keyword Match: 20 points (mentions relevant technologies)
- Reachability: 20 points (email found, social profiles public)

// Total Score = weighted sum
```

**Cost Considerations:**
- LinkedIn Sales Navigator: $99-149/month per seat
- Apollo.io: $49-79/month (credit-based)
- Hunter.io: $49/month (1,000 searches)
- GitHub/Twitter APIs: Free tier + rate limits

**Success Metrics:**
- ≥50 individual profiles per ICP search
- ≥70% email deliverability for individuals
- ≥60 average confidence score
- ≤30 seconds discovery time

---

#### Phase 2B: Unified Discovery Results
**Goal**: Present both companies and individuals in a cohesive interface

**UI/UX Design:**
```
┌─────────────────────────────────────────────┐
│  Discovery Results for Your ICP              │
├─────────────────────────────────────────────┤
│                                              │
│  [Companies: 47]  [Individuals: 23]  [All]  │  ← Tabs
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ 🏢 Acme SaaS Inc.                    │  │  ← Company card
│  │ B2B SaaS · 25 employees · Series A   │  │
│  │ 3 contacts found                     │  │
│  │ [View Contacts →]                    │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ 👤 John Doe                          │  │  ← Individual card
│  │ Indie Developer · San Francisco      │  │
│  │ 🐙 GitHub · 🐦 Twitter · 💼 LinkedIn │  │
│  │ [Generate Draft]  [Reveal Email]     │  │
│  └──────────────────────────────────────┘  │
│                                              │
└─────────────────────────────────────────────┘
```

**Data Model:**
```typescript
interface UnifiedDiscoveryResult {
  companies: CompanyResult[]
  individuals: IndividualProfile[]
  summary: {
    totalCompanies: number
    totalIndividuals: number
    totalContacts: number  // Contacts at companies + individuals
    averageScore: number
  }
  icp: IcpPreview
  discoveredAt: string
}
```

**Implementation Tasks:**
- [ ] Design unified results page wireframes
- [ ] Create `UnifiedDiscoveryResults` component
- [ ] Add tab navigation (Companies / Individuals / All)
- [ ] Implement filtering (by score, location, role)
- [ ] Add bulk actions (select multiple, export CSV)
- [ ] Create individual profile modal with full details
- [ ] Implement email reveal with credit system

---

## 🎯 Medium Priority Features

### 2. Enhanced Web Scraping for ICP Generation
**Status**: Planned for v0.4
**Priority**: Medium
**Effort**: 1 week

**Problem Statement:**
Current web scraping (axios + cheerio) is easily blocked by modern websites with bot detection (Cloudflare, etc.). Many target company websites (Apple, Stripe, etc.) return 0 pages, forcing fallback to URL-only AI inference with lower confidence (50%).

**Current Workaround:**
Using OpenAI's general knowledge of companies to generate ICPs without scraping. Works well for known companies but lacks real-time website data.

**Solution Options:**

#### Option A: Playwright/Puppeteer (Free)
**Cost**: ✅ Free (open source)
**Implementation**:
- Add Playwright as middle fallback layer: axios → Playwright → AI-only
- Handles JavaScript-rendered sites
- Can bypass simple bot detection with proper browser fingerprinting
- Full browser automation capabilities

**Pros**:
- No additional cost
- Handles modern SPAs (React, Vue, etc.)
- Can execute JavaScript and wait for dynamic content

**Cons**:
- Resource-heavy (runs Chrome headless)
- Slower (~2-5 seconds per page vs <1 second with axios)
- Requires more server resources

**Code Changes**:
```typescript
// backend/src/services/icpInference.ts
async function crawlSite(baseUrl: string): Promise<PageContent[]> {
  // Try 1: axios + cheerio (fast, lightweight)
  let pages = await crawlWithAxios(baseUrl);

  if (pages.length === 0) {
    console.log('Axios failed, trying Playwright...');
    // Try 2: Playwright (slower, but handles JavaScript)
    pages = await crawlWithPlaywright(baseUrl);
  }

  return pages;
}
```

#### Option B: Firecrawl API (Paid)
**Cost**: 💰 $20/month (500 credits) to $400/month (20K credits)
**Pros**: Specialized for scraping, clean markdown output, built-in rate limiting
**Cons**: Credit-based pricing, external dependency

#### Option C: ScrapingBee (Paid)
**Cost**: 💰 $49/month (1,000 requests) to $249/month (unlimited)
**Pros**: Handles JavaScript, rotating proxies, good success rate
**Cons**: Usage-based pricing can add up quickly

#### Option D: Bright Data (Enterprise)
**Cost**: 💰 $500+/month for residential proxies
**Pros**: Highest success rate, handles complex anti-bot measures
**Cons**: Expensive, overkill for MVP

**Recommendation**: Start with Option A (Playwright) for free, reliable improvement.

**Success Metrics:**
- Increase successful scrape rate from ~0% to ≥60%
- Increase average ICP confidence from 50% to ≥75%
- Maintain page load time <5 seconds per company

---

### 3. Advanced ICP Refinement
**Status**: Planned for v0.4
**Priority**: Medium
**Effort**: 1-2 weeks

**Feature**: Allow users to refine generated ICPs:
- Mark companies/individuals as "Good Fit" or "Not a Fit"
- System learns and adjusts ICP scoring
- Re-run discovery with refined criteria
- Save multiple ICP variants for A/B testing

### 3. Email Deliverability Dashboard
**Status**: Planned for v0.4
**Priority**: Medium
**Effort**: 1 week

**Feature**: Track email performance:
- Open rates per campaign
- Response rates by segment
- Bounce rate monitoring
- Domain reputation checker
- A/B test draft variants

### 4. CRM Integration
**Status**: Planned for v0.5
**Priority**: Medium
**Effort**: 2 weeks

**Integrations**:
- HubSpot
- Salesforce
- Pipedrive
- Notion
- Airtable

**Sync**: Two-way sync of contacts, companies, and engagement data

---

## 🔮 Future Enhancements

### 5. Continuous Agent Mode (24/7 Lead Generation)
**Status**: Future consideration (v0.5+)
**Priority**: Low (differentiation feature)
**Effort**: 4-6 weeks
**Inspired by**: Gojiberry's "AI agent that runs 24/7"

**Problem Statement:**
Current workflow is reactive - users must manually trigger each discovery run. This requires:
- Active time investment from users
- Remembering to run searches regularly
- Missing time-sensitive opportunities (job changes, funding rounds, tech stack changes)

**Gojiberry's Approach:**
- **Proactive agent**: Runs continuously, finding leads "while you sleep"
- **Intent signal tracking**: Monitors LinkedIn for buying signals (job changes, funding, hiring)
- **Real-time alerts**: Slack/email notifications when hot leads appear
- **Automated outreach**: Can send messages automatically (with approval gates)
- **Platform-native**: Lives within LinkedIn where B2B happens

**Proposed Solution:**

Transform SignalRunner from reactive tool → proactive agent:

**Phase 1: Scheduled Runs**
```
User sets up:
- Base ICP (from URL or manual config)
- Schedule (daily, weekly)
- Alert thresholds (score >85 = Slack alert)

Agent runs automatically:
- Discovers new companies daily
- Finds new contacts at existing companies
- Scores everyone
- Generates drafts
- Sends digest email: "🔥 5 hot leads found today (score >90)"
```

**Phase 2: Intent Signal Monitoring**
```
Monitor for buying signals:
- Job changes (new VP Sales at target company)
- Funding rounds (Series A/B announcements)
- Tech stack changes (company adopts competitor tool)
- Hiring sprees (company posts 5+ open roles)
- Website changes (new pricing page, case studies)
- Social mentions (company tweets about pain point)

When signal detected:
- Immediate Slack/email alert
- Auto-generate hyper-personalized draft
- Optional: Auto-send via LinkedIn/email (with approval)
```

**Phase 3: Multi-Channel Automation**
```
- LinkedIn DM sequences (with Safety First AI)
- Email sequences (via Smartlead/Instantly integration)
- Twitter/X engagement (like/comment on relevant posts)
- Calendar booking links (auto-insert meeting scheduler)
```

**Data Sources for Intent Signals:**
- **LinkedIn API**: Job changes, company updates, hiring posts
- **Crunchbase API**: Funding announcements, acquisitions
- **BuiltWith/Datanyze**: Tech stack tracking
- **Google Alerts**: News mentions
- **Twitter API**: Social listening
- **Company websites**: Change detection (via differ.js)

**Implementation Architecture:**
```typescript
// Cron job runs every 6 hours
async function continuousAgentLoop(userId: string) {
  const icpConfig = await getICPConfig(userId);

  // 1. Run discovery
  const newLeads = await discoverNewLeads(icpConfig);

  // 2. Check for intent signals
  const hotSignals = await checkIntentSignals(icpConfig);

  // 3. Score and prioritize
  const prioritized = await scoreLeads([...newLeads, ...hotSignals]);

  // 4. Generate drafts for high-priority leads
  const topLeads = prioritized.filter(l => l.score >= 85);
  const drafts = await generateDrafts(topLeads);

  // 5. Send alerts
  if (topLeads.length > 0) {
    await sendSlackAlert(userId, topLeads);
    await sendEmailDigest(userId, drafts);
  }

  // 6. Optional: Auto-send (with user approval)
  if (icpConfig.autoSend) {
    await sendOutreachWithApproval(userId, drafts);
  }
}
```

**UI Changes:**
```
New page: /agent-settings
┌─────────────────────────────────────────┐
│  🤖 Continuous Agent Settings            │
├─────────────────────────────────────────┤
│  Base ICP: projectmaven.io              │
│  [Edit ICP]                             │
│                                          │
│  Schedule:                               │
│  ◉ Daily at 9am                         │
│  ○ Weekly on Monday                     │
│  ○ Custom schedule                      │
│                                          │
│  Alert Settings:                         │
│  ☑ Slack alerts (score >85)             │
│  ☑ Email daily digest                   │
│  ☑ SMS for hot leads (score >95)        │
│                                          │
│  Intent Signals to Monitor:              │
│  ☑ Job changes                          │
│  ☑ Funding announcements                │
│  ☑ Tech stack changes                   │
│  ☑ Hiring sprees                        │
│  ☐ Social mentions                      │
│                                          │
│  Auto-Send (Premium):                    │
│  ☐ Auto-send LinkedIn DMs (with review) │
│  ☐ Auto-send emails (with review)       │
│                                          │
│  [Save Settings]                        │
└─────────────────────────────────────────┘
```

**Pricing Model:**
- **Free tier**: Manual runs only
- **Pro tier** ($49/mo): Scheduled runs (daily/weekly)
- **Enterprise tier** ($199/mo): Intent monitoring + auto-send + Slack integration

**Success Metrics:**
- Agent uptime: >99.5%
- Alert relevance: >80% of alerts marked "useful" by users
- Time saved: 10+ hours/week per user
- Lead quality: >60% of agent-found leads convert to meetings

**Technical Challenges:**
- LinkedIn API rate limits (need enterprise license)
- Real-time signal processing at scale
- Cost of continuous monitoring (API calls, compute)
- User trust (allowing agent to send messages automatically)

**Risk Mitigation:**
- Start with scheduled runs (low risk)
- Add intent monitoring gradually
- Require explicit opt-in for auto-send
- Provide kill switch and approval gates
- Clear audit log of all agent actions

---

### 6. AI-Powered Objection Handling
Generate responses to common objections based on historical data.

### 6. Multi-Channel Outreach
Expand beyond email to LinkedIn DMs, Twitter DMs, SMS.

### 7. Team Collaboration
Multiple users, shared ICPs, campaign templates, approval workflows.

### 8. Compliance Automation
Automatic GDPR/CCPA deletion, consent tracking, legal hold features.

---

## 🐛 Known Issues & Technical Debt

### High Priority
- [ ] Fix "Find Contacts" workflow confusion (✅ Fixed in v0.2)
- [ ] Target Roles showing "No data yet" (✅ Fixed in v0.2)
- [ ] Customer Segments showing "No data yet" (✅ Fixed in v0.2)

### Medium Priority
- [ ] Rate limiting for ICP generation endpoint
- [ ] Pagination for large contact lists (>100 contacts)
- [ ] Better error handling for API failures
- [ ] Add loading skeletons instead of spinners

### Low Priority
- [ ] Dark mode support
- [ ] Mobile-responsive improvements
- [ ] Keyboard shortcuts for power users
- [ ] Export drafts as PDF

---

## 📊 Metrics to Track

### Product Metrics
- ICP generation success rate
- Average time to first contact discovered
- Average contacts per ICP
- Email verification accuracy
- Draft generation quality (user ratings)

### Business Metrics
- User activation rate (completed first discovery)
- Weekly active users
- Retention (Day 1, Day 7, Day 30)
- Conversion rate (trial → paid)
- Monthly Recurring Revenue (MRR)

---

**Last Updated**: 2025-10-01
**Next Review**: 2025-10-15
