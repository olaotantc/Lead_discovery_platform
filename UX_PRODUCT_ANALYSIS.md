# SignalRunner UX & Product Analysis Report

**Date:** November 26, 2025
**Version:** MVP v0.2
**Analyst:** Product & UX Assessment

---

## Executive Summary

SignalRunner is a lead discovery platform that transforms a company URL into verified, prioritized leads with AI-generated outreach drafts. The core value proposition—"URL to leads in ≤10 minutes"—is strong, but the current implementation has significant UX bottlenecks that could hinder user adoption and retention.

### Overall Score: 65/100

| Category | Score | Priority |
|----------|-------|----------|
| User Journey Clarity | 60/100 | High |
| Information Architecture | 70/100 | Medium |
| Onboarding & First-Time UX | 55/100 | Critical |
| Visual Design Consistency | 75/100 | Low |
| Feature Discoverability | 60/100 | High |
| Error Handling & Feedback | 65/100 | Medium |
| Mobile Responsiveness | 70/100 | Medium |

---

## 1. User Goals Analysis

### Primary User Goals
1. **Find qualified leads quickly** — Users want to input minimal information and get actionable leads
2. **Verify contact quality** — Users need confidence in email deliverability before outreach
3. **Generate personalized outreach** — Users want AI-assisted drafts with evidence backing
4. **Export/integrate with existing tools** — Users need CSV exports or email client integration

### Current Goal Achievement Assessment

| Goal | Achievement | Friction Points |
|------|-------------|-----------------|
| Find leads quickly | ⚠️ Partial | Multi-step journey unclear, ~6 clicks to first contact |
| Verify quality | ✅ Good | Confidence scores visible, verification status clear |
| Generate outreach | ✅ Good | 3 tones available, citations included |
| Export/integrate | ⚠️ Partial | CSV works, but no direct Gmail/Outlook integration yet |

---

## 2. User Journey Analysis

### Current User Flow

```
Home → /start → ICP Preview → Summary → Results → Contacts → Drafts → Export
  │      │           │           │         │          │         │
  └──────┴───────────┴───────────┴─────────┴──────────┴─────────┴── 7 distinct pages
```

### Critical Journey Bottlenecks

#### Bottleneck #1: Fragmented Flow (High Priority)
**Location:** `/start` → `/discover/summary` → `/discover/results` → `/contacts`

**Problem:** Users must navigate 4 separate pages to complete one workflow. Each transition requires a page load, potentially losing context.

**Impact:**
- High cognitive load
- Risk of abandonment at each step
- Data stored in sessionStorage/localStorage can be lost on refresh

**Recommendation:** Consolidate into a single-page workflow with progressive disclosure:
```
/discovery (single page)
├── Step 1: URL Input (collapsed after completion)
├── Step 2: ICP Preview (expandable)
├── Step 3: Company Results (inline with selection)
├── Step 4: Contact Discovery (inline)
└── Step 5: Draft & Export (inline)
```

#### Bottleneck #2: ICP Preview as Dead End (High Priority)
**Location:** `/start` page, after ICP generation

**Problem:** After generating an ICP, users see a detailed profile but must click "Discover Leads" to continue. The ICP preview provides no immediate value—it's an intermediate artifact, not a deliverable.

**Impact:**
- Users may not understand why the ICP matters
- No option to skip directly to contacts if user already knows their target

**Recommendation:**
- Auto-proceed to company discovery after ICP generation (with 3-second cancel option)
- Add "Skip ICP, search directly" option for power users

#### Bottleneck #3: No Progress Persistence (Medium Priority)
**Location:** Across all pages

**Problem:** Data stored in `sessionStorage` and `localStorage` is fragile:
- Session storage lost on tab close
- No server-side persistence of discovery runs
- Users can't resume abandoned sessions

**Impact:**
- Lost work if browser crashes
- Can't share discovery runs with teammates
- No history of past searches

**Recommendation:**
- Persist discovery runs to database (already have `discovery_runs` table)
- Add "Continue where you left off" prompt on return visits
- Add discovery history page to dashboard

#### Bottleneck #4: Hidden Workspace (Medium Priority)
**Location:** Navigation bar

**Problem:** The "Workspace" dropdown is only visible when logged in, and contains critical pages (Dashboard, Accounts, Drafts) that new users don't know exist.

**Impact:**
- Users may not realize they need to log in to save work
- Dashboard value is hidden until after registration
- Feature discoverability is poor

**Recommendation:**
- Show workspace links in navigation (greyed out with "Login to access" tooltip if not authenticated)
- Add workspace preview on landing page
- Move "Accounts" and "Drafts" into the main discovery flow sidebar

---

## 3. Page-by-Page Analysis

### 3.1 Landing Page (`/`)
**Score: 75/100**

**Strengths:**
- ✅ Clear value proposition headline
- ✅ Pricing information accessible
- ✅ Feature cards explain capabilities
- ✅ Social proof section with stats

**Weaknesses:**
- ⚠️ Stats appear fabricated ("1,247 Active Users") for MVP
- ⚠️ Partner logos are placeholder (Startup Inc, TechCorp)
- ⚠️ No interactive demo or video showing the product
- ⚠️ "Get Started" button navigates away from pricing context

**Recommendations:**
1. Remove fake stats or replace with honest metrics ("Beta users", "In development")
2. Add an embedded demo GIF or video
3. Add "Try with demo URL" button that pre-fills stripe.com for instant gratification

### 3.2 Start/ICP Page (`/start`)
**Score: 60/100**

**Strengths:**
- ✅ Clean input form with helpful validation
- ✅ Real-time error feedback
- ✅ "How It Works" section provides context
- ✅ ICP cards are well-organized with confidence scores

**Weaknesses:**
- ⚠️ Page is too long after ICP generation (requires scrolling)
- ⚠️ Brief input is optional but positioned prominently
- ⚠️ No example URLs or suggestions for first-time users
- ⚠️ Loading state is generic ("Analyzing Business Intelligence...")
- ⚠️ "Edit URL" button clears all data including ICP

**Recommendations:**
1. Add "Try with: stripe.com | hubspot.com | notion.so" quick-fill buttons
2. Provide granular loading progress (Crawling → Analyzing → Generating ICP)
3. Move ICP results to a slide-in panel or modal to reduce scroll
4. Add "Export ICP" button for users who just need the profile

### 3.3 Discovery Results (`/discover/results`)
**Score: 70/100**

**Strengths:**
- ✅ Company cards are informative with scores
- ✅ Selection checkboxes allow batch operations
- ✅ Export CSV and Find Contacts CTAs are prominent
- ✅ Score facets breakdown is detailed

**Weaknesses:**
- ⚠️ Depends on sessionStorage (data lost on refresh)
- ⚠️ No filtering or sorting options
- ⚠️ "Save to Accounts" is a TODO (non-functional)
- ⚠️ Empty state redirects to /start (loses context)

**Recommendations:**
1. Add server-side persistence for discovery results
2. Implement filters: Industry, Size, Score range
3. Add sorting: By score, by name, by industry
4. Show "Recently discovered" in sidebar for quick navigation

### 3.4 Contacts Page (`/contacts`)
**Score: 65/100**

**Strengths:**
- ✅ Multi-company selector when batch processing
- ✅ Confidence threshold slider is interactive
- ✅ Score facets (Fit, Intent, Reach, Recency) are visible
- ✅ Draft generation inline with tone selection

**Weaknesses:**
- ⚠️ Table is very wide (12 columns!) causing horizontal scroll
- ⚠️ Draft tone selector is buried in the discovery form
- ⚠️ No bulk draft generation for multiple contacts
- ⚠️ Contact discovery re-runs even if previously discovered
- ⚠️ EML download workflow is clunky (separate inputs for from/subject)

**Recommendations:**
1. Collapse score facets into expandable row detail
2. Move draft tone to draft generation modal
3. Add "Generate drafts for all selected" batch action
4. Cache contact results per domain to avoid redundant API calls

### 3.5 Drafts Page (`/drafts`)
**Score: 80/100**

**Strengths:**
- ✅ Clean list view with filtering
- ✅ Modal preview shows full draft content
- ✅ Tone badges are color-coded
- ✅ Pagination implemented

**Weaknesses:**
- ⚠️ No way to regenerate a draft with different tone
- ⚠️ No way to edit drafts inline
- ⚠️ Citations shown but not clickable in modal
- ⚠️ EML download has hardcoded "noreply@signalrunner.com" sender

**Recommendations:**
1. Add "Regenerate" button in draft modal
2. Add inline editing with "Save changes" option
3. Make citation URLs clickable in modal
4. Use user's configured email or prompt for sender

### 3.6 Accounts Page (`/accounts`)
**Score: 70/100**

**Strengths:**
- ✅ Comprehensive account management
- ✅ Status tracking (discovered, contacted, qualified)
- ✅ Search and filter functionality
- ✅ Bulk selection for batch operations

**Weaknesses:**
- ⚠️ Requires authentication (no guest access)
- ⚠️ "Start Contact Discovery" only works for first selected account
- ⚠️ No account detail view (must go to contacts page)
- ⚠️ Status updates require deletion and re-discovery

**Recommendations:**
1. Add account detail drawer/modal
2. Implement batch contact discovery for multiple accounts
3. Add status change dropdown in table row
4. Show last activity date and discovery history

### 3.7 Dashboard (`/dashboard`)
**Score: 75/100**

**Strengths:**
- ✅ At-a-glance stats for key metrics
- ✅ Recent activity feed
- ✅ Quick action cards for common tasks
- ✅ Getting started guide for new users

**Weaknesses:**
- ⚠️ Stats may show 0 for new users (not motivating)
- ⚠️ No graphs or trends visualization
- ⚠️ Quick actions lead to full-page navigation
- ⚠️ Activity feed has no filtering

**Recommendations:**
1. Show "Complete your first discovery" prompt when stats are 0
2. Add sparkline charts for weekly trends
3. Make quick actions open in modal/drawer when possible
4. Add activity type filter tabs

---

## 4. Information Architecture Issues

### Navigation Confusion
The current IA has overlapping concepts:

| Page | Overlapping With | Confusion |
|------|------------------|-----------|
| /contacts | /accounts | Both show company/contact data |
| /discover/results | /accounts | Results can be saved to accounts |
| /start | /dashboard | Both are entry points |

**Recommendation:** Simplify to 3 main sections:
1. **Discover** — Single-page discovery workflow
2. **Pipeline** — Saved accounts with status tracking
3. **Drafts** — All generated outreach content

### Missing Features in IA
1. **Settings page** — No way to configure API keys, preferences, plan
2. **Help/docs** — No in-app documentation
3. **Team/workspace** — No collaboration features visible

---

## 5. Visual Design & Consistency

### Design System Observations

**Colors:**
- Primary: Indigo-600 (#4F46E5)
- Gradients: Blue-600 to Purple-700
- Status: Green/Amber/Red for scores

**Typography:**
- Font: System default sans-serif (no custom font loaded)
- Headings: Bold, 2xl-4xl
- Body: Regular, sm-base

**Components:**
- ✅ Consistent card styling
- ✅ Button hierarchy clear (primary/secondary/ghost)
- ⚠️ Badge colors inconsistent across pages
- ⚠️ Icon usage varies (sometimes inline, sometimes in circles)

### Inconsistencies Found
1. **Badge colors for scores:**
   - Results page: Green ≥70, Yellow ≥50, Orange <50
   - Contacts page: Emerald ≥85, Amber ≥70, Red <70
   - *Should be unified*

2. **Loading indicators:**
   - Spinner with text on /start
   - Generic spinner on /dashboard
   - Table skeleton not implemented anywhere
   - *Should use consistent loading states*

3. **Back navigation:**
   - Some pages have "Back" buttons (← Back to Home)
   - Others rely on browser back button
   - *Should be consistent*

---

## 6. Error Handling & Edge Cases

### Current Error Handling Assessment

| Scenario | Current Behavior | Recommended |
|----------|-----------------|-------------|
| Invalid URL | Red error message | ✅ Good |
| API timeout | Generic error | Add retry button |
| No contacts found | "No contacts above threshold" | Suggest lowering threshold |
| Session expired | Redirect to /login | Show toast with "Login again" |
| Network offline | Fetch fails silently | Show offline indicator |
| Rate limited | Alert box | Show countdown timer |

### Missing Error States
1. No empty state for /drafts when no drafts exist (shows blank)
2. No retry mechanism for failed API calls
3. No optimistic UI updates (all actions block UI)

---

## 7. Performance Considerations

### Client-Side Data Management
**Issue:** Heavy reliance on sessionStorage/localStorage

```javascript
// Current pattern (fragile)
sessionStorage.setItem('discoveryResults', JSON.stringify(results))
const stored = sessionStorage.getItem('discoveryResults')
```

**Risk:**
- Data size limits (~5MB)
- Lost on tab close
- No sync across devices

**Recommendation:**
- Use React Query for server state management
- Persist to database with unique session IDs
- Add offline support with service worker

### API Call Patterns
**Issue:** Sequential, blocking API calls

```javascript
// Current pattern (slow)
const icp = await fetch('/api/icp-inference/infer')
const discovery = await fetch('/api/discovery/run')
const candidates = await fetch('/api/candidate-sourcing/search')
```

**Recommendation:**
- Parallelize independent calls
- Implement background job polling
- Add streaming responses for long operations

---

## 8. Mobile Experience

### Current Mobile Support
- ✅ Navigation hamburger menu implemented
- ✅ Responsive grid layouts
- ⚠️ Tables scroll horizontally (poor UX)
- ⚠️ No mobile-specific touch gestures
- ⚠️ Large buttons on mobile could be better optimized

### Mobile-Specific Recommendations
1. Replace tables with card-based lists on mobile
2. Add swipe actions for common operations (save, delete)
3. Implement pull-to-refresh on list views
4. Reduce font sizes and padding on mobile

---

## 9. Onboarding & First-Time User Experience

### Current Onboarding
1. User lands on `/`
2. Clicks "Get Started"
3. Sees `/start` form with no guidance
4. Must figure out flow themselves

### Critical Missing Elements
1. **No guided tour** — First-time users don't know what to expect
2. **No sample data** — Can't explore features without real discovery
3. **No progress indicator** — Users don't know they're on step 1 of 6
4. **No value preview** — Users must complete full flow to see results

### Recommended Onboarding Flow
```
Welcome Modal → Quick Demo (30 sec) → Pre-filled Example → User's First URL
```

1. **Welcome modal** on first visit explaining the 3-step value
2. **"Try Demo"** button that shows pre-populated results for stripe.com
3. **Tooltips** on first visit pointing out key features
4. **Progress bar** showing "Step 1 of 4: Enter URL"

---

## 10. Priority Action Items

### P0 — Critical (Do This Week)
1. **Consolidate discovery flow** into single page or wizard
2. **Persist discovery results** to database (not sessionStorage)
3. **Add sample/demo mode** for first-time users
4. **Unify score badge colors** across all pages

### P1 — High Priority (This Sprint)
1. Add progress indicator to discovery flow
2. Implement bulk draft generation
3. Add retry buttons for failed API calls
4. Create guided onboarding tour

### P2 — Medium Priority (Next Sprint)
1. Add filtering and sorting to results
2. Implement inline draft editing
3. Add activity graphs to dashboard
4. Create settings page for user preferences

### P3 — Low Priority (Backlog)
1. Mobile-optimized card layouts
2. Offline support with service worker
3. Team collaboration features
4. Email integration (Gmail/Outlook OAuth)

---

## 11. Competitive Differentiation Opportunities

### Current Unique Value
1. **Evidence-linked drafts** — Citations back every claim
2. **Multi-factor scoring** — Fit, Intent, Reachability, Recency
3. **ICP generation from URL** — No manual setup required

### Underutilized Differentiators
1. **Real-time discovery** — Could show streaming results
2. **Lookalike expansion** — "Find 10 more like this" button
3. **Intent signals** — Hiring, funding, tech stack changes
4. **Compliance-first** — Could be marketing differentiator

---

## Conclusion

SignalRunner has a compelling core product—the URL-to-leads pipeline is genuinely valuable. However, the current UX creates unnecessary friction between the user's goal and achieving it.

**Top 3 Changes for Maximum Impact:**
1. **Single-page discovery flow** with inline results
2. **Persistent sessions** so users never lose work
3. **Guided onboarding** with demo data for first-time users

These changes would significantly improve conversion from landing to completed discovery and increase user retention by making the product feel more polished and trustworthy.

---

## 12. PRD Gap Analysis — Missing Features

Cross-referencing the PRD (v0.2) against current implementation reveals significant gaps:

### A) Input & ICP Preview (Section 4A)

| PRD Requirement | Current Status | Gap |
|-----------------|----------------|-----|
| Toggle: "my company" vs "target company" | ❌ Missing | No toggle on /start page |
| Region/coverage field | ❌ Missing | ICP shows targetMarket but not region bands |
| Keywords/Offers field | ✅ Implemented | keywords[] present |
| Remove tech-stack requirement | ✅ Done | Not in ICP fields |

**Action:** Add entry point toggle to /start: "I'm prospecting for my company" vs "I'm analyzing a target"

### B) Discovery Playbooks (Section 4B)

| PRD Requirement | Current Status | Gap |
|-----------------|----------------|-----|
| Playbook 1: Hiring Signals | ⚠️ Partial | Backend exists but UI doesn't display hiring data |
| Playbook 2: Business Profile Match | ✅ Implemented | ICP inference covers this |
| Category & offer alignment | ✅ Implemented | businessCategory field |
| Location & coverage | ❌ Missing | No region/coverage discovery |
| Directory presence (Yelp, Clutch, GBP) | ❌ Missing | No directory adapter |
| Recency indicators (news, blog, awards) | ❌ Missing | No Market Moment playbook |
| Provenance storage | ⚠️ Partial | sourceUrl stored but no snippet/captured_at |

**Actions:**
1. Add hiring signals display to discovery results
2. Implement directory adapter (Google Business Profile, Clutch)
3. Add Market Moment playbook for news/blog/press mentions
4. Store full provenance: {source_url, snippet, captured_at}

### C) Contacts & Verification (Section 4C)

| PRD Requirement | Current Status | Gap |
|-----------------|----------------|-----|
| Target roles: Owner/GM, Director/VP | ✅ Implemented | Role filter exists |
| Email pattern detection | ✅ Implemented | Pattern matching service |
| Verification via Bouncer/NeverBounce | ⚠️ Mock | Currently mock adapters |
| Default ≥85% confidence | ✅ Implemented | Threshold slider |
| Auto-suppress below threshold | ✅ Implemented | Filtering works |

**Actions:**
1. Integrate real verification provider (Bouncer or NeverBounce)
2. Add Hunter.io for email discovery (currently mock)

### D) Prioritization & Scoring (Section 4D)

| PRD Requirement | Current Status | Gap |
|-----------------|----------------|-----|
| Fit (0-40): category +12, size +10, region +6, keyword +12 | ⚠️ Different | Current: 35% weight, different breakdown |
| Intent (0-35): hiring +10, openings +8, market moment +6 | ⚠️ Different | Current: 30% weight, no hiring signal |
| Reachability (0-15): verified contacts | ⚠️ Different | Current: 25% weight |
| Recency (0-10): time-based decay | ✅ Implemented | 10% weight |
| Reason codes with evidence links | ⚠️ Partial | Reason codes exist, evidence links missing |
| Hoverable evidence snippets | ❌ Missing | No hover panel |

**Actions:**
1. Align scoring weights with PRD specification
2. Add hiring signals to Intent score
3. Implement hoverable evidence panel with snippet + source URL

### E) Draft Generation (Section 4E)

| PRD Requirement | Current Status | Gap |
|-----------------|----------------|-----|
| 1 opener + 2 follow-ups | ✅ Implemented | opener, followUp1, followUp2 |
| Tones: Direct, Consultative | ⚠️ Partial | Has Direct, Consultative, Warm (extra) |
| Case-study block | ❌ Missing | No case study insertion |
| Evidence references per sentence | ⚠️ Partial | Citations exist but not per-sentence |
| Hover panel with snippet + URL | ❌ Missing | No inline hover |
| Non-tech vertical examples | ⚠️ Generic | Examples are generic, not vertical-specific |

**Actions:**
1. Add case-study block option to draft generation
2. Implement per-sentence evidence references
3. Add hover panel showing snippet + source URL
4. Create vertical-specific draft templates (local services, retail, etc.)

### F) Export & Handoff (Section 4F)

| PRD Requirement | Current Status | Gap |
|-----------------|----------------|-----|
| CSV export | ✅ Implemented | Companies and contacts CSV |
| Gmail OAuth | ❌ Missing | Removed in recent cleanup |
| Outlook OAuth | ❌ Missing | Never implemented |
| List-Unsubscribe header | ✅ Implemented | In emailHeaders |
| Sequencer: Smartlead/Instantly | ❌ Missing | No sequencer integration |
| SPF/DKIM/DMARC check | ✅ Implemented | Compliance check endpoint |
| Block handoff if failing | ⚠️ Partial | Alert only, doesn't block |

**Actions:**
1. Re-implement Gmail OAuth (was removed)
2. Add Outlook OAuth integration
3. Add sequencer connector (Smartlead or Instantly)
4. Make compliance gate blocking (not just warning)

### G) Light Analytics (Section 4G)

| PRD Requirement | Current Status | Gap |
|-----------------|----------------|-----|
| Run summary stats | ⚠️ Partial | Dashboard has basic stats |
| Accounts discovered count | ✅ Implemented | totalCompaniesFound |
| Contacts verified count | ✅ Implemented | totalContactsFound |
| Avg score | ✅ Implemented | averageScore |
| Drafts generated count | ❌ Missing | No draft count in stats |
| Connector status | ❌ Missing | No connector status display |
| Last push result | ❌ Missing | No push history |

**Actions:**
1. Add drafts_generated_count to dashboard stats
2. Add connector status panel when integrations are added
3. Track and display last push result and errors

### H) UX Flow (Section 6)

| PRD Screen | Current Implementation | Gap |
|------------|----------------------|-----|
| Welcome/Input | /start | ✅ Works |
| Prospecting toggle | ❌ Missing | No "my company vs target" toggle |
| Discovery Results | /discover/results | ✅ Works |
| Contacts Panel | /contacts | ✅ Works |
| Prioritize View | ❌ Missing | No dedicated prioritization screen |
| Evidence side-drawer | ❌ Missing | No evidence drawer |
| Drafts View | /drafts | ✅ Works |
| Tone switcher | ✅ Implemented | In /contacts |
| Case-study insert | ❌ Missing | Not implemented |
| Bulk draft generation | ❌ Missing | Only per-contact |
| Handoff screen | ❌ Missing | No dedicated handoff flow |
| Compliance checklist | ⚠️ Partial | Check exists, no checklist UI |
| Throttle suggestion | ❌ Missing | No rate limiting suggestions |

**Actions:**
1. Add prospecting mode toggle to /start
2. Create evidence side-drawer component
3. Add bulk draft generation
4. Create dedicated handoff screen with compliance checklist

### I) Data Model (Section 7)

| PRD Entity | Current Status | Gap |
|------------|----------------|-----|
| Account | ✅ Implemented | accounts table |
| Signal | ❌ Missing | No signals table |
| Contact | ✅ Implemented | contacts in discovery results |
| Draft | ✅ Implemented | drafts table |
| Run | ⚠️ Partial | discovery_runs exists but limited |
| Settings | ❌ Missing | No user settings table |

**Actions:**
1. Create `signals` table for evidence storage
2. Expand `discovery_runs` with full params and stats
3. Create `user_settings` table for thresholds, connectors, suppression

### J) Release Criteria (Section 12)

| Criterion | Status | Notes |
|-----------|--------|-------|
| ≥25 verified contacts | ⚠️ Depends | Mock data returns fewer |
| Avg score ≥65 | ⚠️ Variable | Scoring exists but untested at scale |
| ≤10 minutes | ⚠️ Untested | No performance benchmarks |
| ICP shows Category, Size, Region, Roles, Keywords | ⚠️ Missing Region | Region/coverage not explicit |
| Evidence hover references | ❌ Missing | No hover panel |
| CSV + Gmail + Outlook + Sequencer | ⚠️ Only CSV | OAuth and sequencer missing |
| Compliance gate blocks | ⚠️ Warns only | Doesn't block handoff |

---

## 13. PRD-Driven Priority Roadmap

### Phase 1: Core PRD Alignment (2 weeks)

| Item | Effort | PRD Section |
|------|--------|-------------|
| Add prospecting mode toggle | Medium | 4A |
| Implement signals table for evidence | Medium | 7 |
| Add evidence hover panel | High | 4D, 4E |
| Align scoring weights with PRD | Low | 4D |
| Add hiring signals to Intent | Medium | 4B |

### Phase 2: Integrations (2 weeks)

| Item | Effort | PRD Section |
|------|--------|-------------|
| Re-add Gmail OAuth | Medium | 4F |
| Add Outlook OAuth | Medium | 4F |
| Integrate real verification provider | Medium | 4C |
| Add Smartlead or Instantly connector | High | 4F |

### Phase 3: Enhancement (2 weeks)

| Item | Effort | PRD Section |
|------|--------|-------------|
| Bulk draft generation | Medium | 6 |
| Case-study block insertion | Medium | 4E |
| Dedicated handoff screen | Medium | 6 |
| Market Moment playbook | High | 4B |
| Directory adapters (GBP, Clutch) | High | 4B |

### Phase 4: Polish (1 week)

| Item | Effort | PRD Section |
|------|--------|-------------|
| Compliance gate blocking | Low | 4F |
| Throttle suggestions | Low | 4F |
| Run summary analytics | Medium | 4G |
| User settings page | Medium | 7 |

---

## 14. Quick Wins (Implement Today)

These require minimal effort but significantly improve PRD alignment:

1. **Add region/coverage to ICP display** — Already in backend, just expose in UI
2. **Show hiring signals in results** — Data exists, add column
3. **Align score weights** — Config change in scoring service
4. **Add draft count to dashboard** — SQL query addition
5. **Make compliance gate blocking** — Change alert to redirect

---

*Report generated by Product & UX Analysis Agent*
