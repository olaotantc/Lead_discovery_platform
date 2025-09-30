# SignalRunner - Discovery-First Lead Platform

> Paste a URL → receive verified, prioritized leads with evidence-based drafts in ≤10 minutes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.0-green.svg)](https://www.fastify.io/)

## 🚀 Overview

SignalRunner is an AI-powered lead discovery platform that transforms a single URL into verified, scored, and prioritized contacts with evidence-linked email drafts. Built for sales teams who need quality over quantity.

### Key Features

- **🎯 Smart Discovery**: Automated contact discovery from company URLs with full source attribution
- **📊 4-Facet Scoring**: Prioritize leads based on Fit, Intent, Reachability, and Recency
- **✉️ Evidence-Based Drafts**: AI-generated emails with direct links to supporting evidence
- **✅ Email Verification**: Built-in verification with confidence scoring
- **🔒 Compliance-First**: GDPR/CCPA ready with required headers and audit trails

## 📈 Current Status

**Version**: MVP v0.2
**Progress**: 5/11 tasks complete (45%)
**Status**: ✅ Core discovery and scoring systems operational

### Completed Features
- ✅ Project infrastructure (Next.js + Fastify + PostgreSQL + Redis)
- ✅ ICP generation and preview
- ✅ Contact discovery with pattern detection
- ✅ Email verification integration
- ✅ **4-facet scoring system** (Fit, Intent, Reachability, Recency)
- ✅ Draft generation (opener + 2 follow-ups)

### In Development
- 🔄 Account discovery from ICP (lookalike search)
- ⏳ Export/handoff features
- ⏳ Analytics and reporting

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  • App Router • Tailwind CSS • React Query • TypeScript     │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────┴─────────────────────────────────┐
│                    Backend (Fastify + Node.js)               │
│  • Contact Discovery • Scoring Engine • Draft Generation     │
│  • Email Verification • Job Queue (BullMQ)                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────┴────────┐                  ┌──────────┴─────────┐
│   PostgreSQL    │                  │      Redis         │
│  (Contact Data) │                  │  (Cache + Queue)   │
└────────────────┘                  └────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **State**: React Query (TanStack Query)
- **Icons**: Lucide React

### Backend
- **Framework**: Fastify 5.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (with connection pooling)
- **Cache**: Redis
- **Queue**: BullMQ (Redis-backed job processing)
- **API**: RESTful with JSON schema validation

### AI/ML
- **Models**: OpenAI GPT-4o (configured, other providers supported)
- **Services**: Email pattern detection, verification, draft generation

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+
- OpenAI API key (or alternative provider)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/olaotantc/Lead_discovery_platform.git
cd Lead_discovery_platform
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Configure environment variables**

Backend `.env`:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/signalrunner
REDIS_URL=redis://localhost:6379

# API Keys
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here  # Optional
PERPLEXITY_API_KEY=your_perplexity_key_here  # Optional

# Server
PORT=8000
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:3002
FRONTEND_URL=http://localhost:3002
```

Frontend `.env.local`:
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

4. **Start the services**

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3002
- Backend API: http://localhost:8000
- Health check: http://localhost:8000/health

## 🎯 Usage

### Basic Flow

1. **Enter a URL** (e.g., `stripe.com`)
2. **Select target roles** (e.g., "Decision Makers", "Owner/GM")
3. **Set confidence threshold** (70-95%)
4. **Run discovery** - Wait ~10 minutes for results
5. **Review scored contacts** with 4-facet breakdown
6. **Generate drafts** with evidence links
7. **Export** to CSV or Gmail/Outlook

### Scoring System

Each contact receives a **total score (0-100)** based on 4 weighted facets:

| Facet | Weight | Description |
|-------|--------|-------------|
| **Fit** | 35% | Role seniority, company match, ICP alignment, keywords |
| **Intent** | 30% | Recent activity, engagement signals, growth indicators |
| **Reachability** | 25% | Email verification status, confidence level, format |
| **Recency** | 10% | Data freshness (100 for <24h, decays over 90 days) |

**Example Output:**
```
riley.garcia@stripe.com
├─ Total Score: 40 (🟡 Medium)
├─ Fit: 35
├─ Intent: 20
├─ Reachability: 47.2
└─ Recency: 100
```

## 📁 Project Structure

```
Lead_discovery_platform/
├── backend/                 # Fastify API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   │   ├── contacts.ts
│   │   │   ├── scoring.ts
│   │   │   └── drafts.ts
│   │   ├── services/       # Business logic
│   │   │   ├── contactDiscovery.ts
│   │   │   ├── scoring.ts
│   │   │   └── emailVerification.ts
│   │   ├── config/         # DB, Redis, Queue config
│   │   ├── types/          # TypeScript interfaces
│   │   └── index.ts        # Server entry point
│   └── package.json
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── start/page.tsx     # ICP input
│   │   │   └── contacts/page.tsx  # Results view
│   │   └── components/    # React components
│   └── package.json
├── .taskmaster/           # Task Master AI project management
├── docs/                  # Documentation
├── CLAUDE.md             # AI agent instructions
└── README.md             # This file
```

## 🧪 Testing

Run end-to-end test:
```bash
# Start both servers, then:
curl -X POST http://localhost:8000/api/contacts/discover \
  -H "Content-Type: application/json" \
  -d '{"url":"stripe.com","roles":["Manager"],"threshold":80,"limit":5}'

# Get results (replace {jobId} with returned ID)
curl http://localhost:8000/api/contacts/{jobId}
```

## 🔒 Security & Compliance

- ✅ Email verification before outreach
- ✅ robots.txt respect with polite rate limiting
- ✅ Source attribution for all data points
- ✅ List-Unsubscribe headers on all exports
- ✅ GDPR/CCPA deletion capabilities (planned)
- ✅ SPF/DKIM/DMARC checks (planned)

## 📊 Performance Targets

- **Discovery Time**: ≤10 minutes per URL
- **Minimum Output**: ≥25 verified contacts
- **Average Score**: ≥65/100
- **Draft Generation**: ≤10 seconds per contact

## 🗺️ Roadmap

### Phase 1: Core Discovery (Complete ✅)
- [x] Project infrastructure
- [x] ICP generation and preview
- [x] Contact discovery
- [x] Email verification
- [x] 4-facet scoring system

### Phase 2: Draft Generation (Complete ✅)
- [x] AI-powered draft generation
- [x] Evidence linking
- [x] Multi-tone support

### Phase 3: Scale & Polish (In Progress 🔄)
- [ ] Account discovery (lookalike search)
- [ ] Export/handoff (CSV, Gmail, Outlook)
- [ ] Analytics dashboard
- [ ] Compliance enforcement

### Phase 4: Production (Planned 📋)
- [ ] Final testing
- [ ] Performance optimization
- [ ] Deployment automation
- [ ] Monitoring & alerting

## 🤝 Contributing

This is a private MVP project. For questions or collaboration inquiries, please contact the repository owner.

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [Task Master AI](https://www.npmjs.com/package/task-master-ai) - AI-powered project management
- [Claude Code](https://claude.ai) - AI development assistant
- Open source libraries and frameworks listed above

---

**Status**: Active Development | **Last Updated**: 2025-09-30 | **Version**: MVP v0.2