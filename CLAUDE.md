# Lead Discovery Platform - Claude Code Guide

**Project:** SignalRunner - Discovery-First Lead Platform
**Last Updated:** 2025-11-26
**Status:** ~70% complete - Core discovery engine working, downstream flow needs wiring

## Quick Context

A lead discovery platform that takes a URL/brief and returns verified, prioritized leads with evidence-based email drafts in ≤10 minutes.

**Stack:** Next.js 15 + Fastify + PostgreSQL + Redis + BullMQ + OpenAI

## Current State

### Working (can demo end-to-end)
- ICP inference from website crawling (8 pages)
- Multi-pass candidate discovery (5 verticals × 10 companies)
- Company scoring with 4 facets
- Discovery flow: `/start` → `/discover/summary` → `/discover/results`

### Scaffolded (code exists, not wired)
- Contact discovery UI (`/contacts` page)
- Draft generation (`/drafts` page)
- Email verification (mock implementation)
- Authentication routes

### Not Started
- Real email verification API integration
- Gmail/Outlook OAuth
- Sequencer integration (Smartlead/Instantly)
- CSV export

## Architecture

```
Lead_discovery_platform/
├── frontend/                 # Next.js 15 (port 3002)
│   └── src/app/
│       ├── page.tsx          # Landing page
│       ├── start/            # ICP input form
│       ├── discover/         # Summary + results pages
│       ├── contacts/         # Contact discovery (scaffolded)
│       └── drafts/           # Draft generation (scaffolded)
│
├── backend/                  # Fastify (port 8000)
│   └── src/
│       ├── index.ts          # Server entry, route registration
│       ├── routes/           # API endpoints
│       │   ├── icpInference.ts
│       │   ├── candidateSourcing.ts
│       │   ├── contacts.ts
│       │   └── drafts.ts
│       ├── services/         # Business logic
│       │   ├── icpInference.ts      # Website crawling + OpenAI extraction
│       │   ├── candidateSourcing.ts # Multi-pass company discovery
│       │   ├── companyScoring.ts    # 4-facet scoring algorithm
│       │   ├── contactDiscovery.ts  # Email pattern detection
│       │   ├── emailVerification.ts # Verification (mock)
│       │   ├── scoring.ts           # Contact scoring
│       │   └── drafts.ts            # Email draft generation
│       ├── config/           # DB, Redis, BullMQ setup
│       ├── migrations/       # PostgreSQL schema
│       └── types/            # TypeScript definitions
│
└── .taskmaster/              # Task management
```

## Key Files

| Purpose | File | Lines |
|---------|------|-------|
| ICP extraction | `backend/src/services/icpInference.ts` | 320 |
| Company discovery | `backend/src/services/candidateSourcing.ts` | 500+ |
| Scoring logic | `backend/src/services/companyScoring.ts` | 300 |
| Contact discovery | `backend/src/services/contactDiscovery.ts` | 200 |
| Draft generation | `backend/src/services/drafts.ts` | 220 |
| Discovery results UI | `frontend/src/app/discover/results/page.tsx` | 400 |

## API Endpoints

```
POST /api/icp-inference/infer     # Extract ICP from URL
POST /api/candidate-sourcing/search  # Find matching companies
POST /api/contacts/discover       # Find contacts (scaffolded)
POST /api/drafts/generate         # Generate email drafts (scaffolded)
GET  /api/health                  # Health check
```

## Development Commands

```bash
# Start servers
cd backend && npm run dev    # http://localhost:8000
cd frontend && npm run dev   # http://localhost:3002

# Build
cd backend && npm run build
cd frontend && npm run build

# Database
cd backend && npm run migrate

# Task management
task-master list              # View all tasks
task-master next              # Get next task
task-master show <id>         # Task details
task-master set-status --id=<id> --status=done
```

## Scoring Algorithm

### Company Scoring (companyScoring.ts)
```
Total = industryFit(40%) + sizeFit(25%) + modelFit(20%) + keywordMatch(15%)
```

### Contact Scoring (scoring.ts)
```
Total = fit(35%) + intent(30%) + reachability(25%) + recency(10%)
```

## Data Flow

```
URL Input
    ↓
Crawl website (8 pages: /, /product, /about, /pricing, etc.)
    ↓
OpenAI extracts ICP: { businessCategory, companySize, targetMarket, customerSegments, keywords }
    ↓
Extract 5-7 industry verticals from targetMarket
    ↓
Parallel search: 5 verticals × 10 companies each = 50 candidates
    ↓
Score all candidates against ICP
    ↓
Return top 35-50 with scores and facet breakdowns
    ↓
[GAP] Contact discovery not connected
    ↓
[GAP] Draft generation not connected
```

## Known Issues

1. **Discovery bias** - Still favors famous companies (Asana, Zapier). Blacklist helps but not enough SMBs.
2. **ICP targetMarket** - Sometimes contains job titles ("CTOs") instead of company types ("Tech Startups").
3. **Flow disconnection** - Cannot navigate from results → contacts → drafts.

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...        # For ICP inference and discovery
DATABASE_URL=postgres://...   # PostgreSQL connection
REDIS_URL=redis://...         # Redis connection

# Optional (for full functionality)
ANTHROPIC_API_KEY=           # Alternative LLM
PERPLEXITY_API_KEY=          # Research features
BOUNCER_API_KEY=             # Email verification
HUNTER_API_KEY=              # Email discovery
```

## Next Steps (Priority Order)

1. **Wire contact discovery** - Add company selection on results page, call `/api/contacts/discover`
2. **Wire draft generation** - Pass selected contacts to `/api/drafts/generate`
3. **Real email verification** - Replace mock with Bouncer/NeverBounce API
4. **Implement export** - CSV download of contacts/drafts

## Testing the Discovery Flow

```bash
# Test ICP inference
curl -X POST http://localhost:8000/api/icp-inference/infer \
  -H "Content-Type: application/json" \
  -d '{"url": "stripe.com"}'

# Test candidate sourcing (needs ICP from previous step)
curl -X POST http://localhost:8000/api/candidate-sourcing/search \
  -H "Content-Type: application/json" \
  -d '{"icp": {...}, "limit": 50}'
```

## Code Quality Standards

- TypeScript everywhere (no .js files)
- All code must compile: `npm run build`
- Environment variables via .env (never hardcode)
- Evidence tracking for all discovered data

## Compliance Requirements

- SPF/DKIM/DMARC validation before email handoff
- List-Unsubscribe header on all outbound emails
- GDPR/CCPA deletion capability
- Respect robots.txt, implement rate limiting

## Performance Targets

- URL to results: ≤10 minutes
- Draft generation: ≤10 seconds per contact
- Minimum output: ≥25 verified contacts with ≥65 avg score

---

## Task Master Integration

This project uses Task Master for development coordination. See `.taskmaster/CLAUDE.md` for full documentation.

```bash
task-master list                    # View tasks
task-master next                    # Next available task
task-master set-status --id=X --status=done  # Mark complete
```

---

**Current blocker:** Discovery results page needs "Select Companies" flow to proceed to contact discovery.
