# Lead Discovery Platform - Claude Code Integration Guide

**Project:** SignalRunner - Discovery-First Lead Platform MVP v0.2
**Last Updated:** 2025-09-29 10:35 UTC
**Status:** Task 1 complete; Task 2 in progress (~60%)

## 🚀 Quick Project Context

This is a **lead discovery platform** that takes a URL/brief and returns verified, prioritized leads with evidence-based email drafts in ≤10 minutes. We're building an MVP with Next.js frontend + Fastify backend + AI-powered discovery engine.

**Current Phase:** Task 2 (ICP Preview Input) - in progress
**Next Priority:** Wire ICP API route and frontend
**Architecture:** Next.js + Fastify + PostgreSQL + Redis + BullMQ + AI

## 📋 Current Status Summary

### ✅ Completed Infrastructure
- **Project Structure**: Frontend/backend directories with TypeScript
- **Build Systems**: Both apps compile and run successfully
- **Task Management**: Taskmaster AI configured with 10-task roadmap
- **Version Control**: Git repository with proper structure

### 🔄 Currently Working On
- **Task 2**: Implement ICP Preview Input (URL + brief)
- **Next Steps**: Register ICP routes in Fastify and call from `/start`

### 📄 Key Files for Handoff
- `project_status.md` - Comprehensive status and progress tracking
- `PRD.txt` - Complete product requirements document
- `.taskmaster/tasks/tasks.json` - AI-generated development roadmap
- `frontend.html` - Original frontend implementation (needs migration)

## 🎯 Development Workflow

### Primary Commands
```bash
# Task Management
taskmaster list                    # View all tasks and progress
taskmaster next                    # Get next available task
taskmaster show <id>               # View detailed task info
taskmaster set-status --id=<id> --status=<status>  # Update progress

# Development
cd frontend && npm run dev         # Frontend development server
cd backend && npm run dev          # Backend development server (port 8000)
```

### Current Task Breakdown
- **1.1** ✅ Initialize Git Repository
- **1.2** ✅ Set Up Project Structure
- **1.3** ✅ Integrate Styling and Data Fetching Tools
- **1.4** ✅ Initialize Databases (PostgreSQL + Redis)
- **1.5** ✅ Set Up Job Management (BullMQ)
- **2.0** 🔄 Implement ICP Preview Input (backend routes drafted; wiring pending)

## 🏗️ Architecture Overview

### Frontend (`/frontend/`)
- **Framework**: Next.js 15.5.4 + TypeScript + Tailwind CSS
- **State Management**: React Query provider configured
- **Pages**: Home with CTAs linking to `/start`; `/start` page with client-side validation
- **Current Need**: Call backend ICP API and render preview

### Backend (`/backend/`)
- **Framework**: Fastify + TypeScript
- **Database**: PostgreSQL pool + health checks
- **Cache/Jobs**: Redis client + BullMQ queues/workers with test endpoints
- **ICP**: Routes and validation service drafted (`routes/icp.ts`, `services/validation.ts`) — register with server

### Key Integrations Needed
1. **AI APIs**: OpenAI (✅ configured), Anthropic, Perplexity
2. **Email Verification**: Bouncer or NeverBounce
3. **Email Integration**: Gmail/Outlook OAuth
4. **Sequencer**: Smartlead or Instantly

## 🔧 Technical Implementation Notes

### Immediate Next Steps
1. Register ICP routes in Fastify and expose `/api/icp/validate` and `/api/icp/preview`.
2. Update `/start` page to call `POST /api/icp/preview` via React Query; render preview.
3. Ensure `lucide-react` is added to frontend dependencies for icons used on `/start`.
4. Continue migration of `frontend.html` sections to Next.js components.

### Project Structure
```
Lead_discovery_platform/
├── frontend/           # Next.js app (port 3000)
├── backend/            # Fastify API (port 8000)
├── .taskmaster/        # AI task management
├── project_status.md   # Always check this first!
├── PRD.txt            # Complete requirements
└── frontend.html      # Reference implementation
```

## 🤖 AI-Powered Development

### Taskmaster Integration
This project uses **Taskmaster AI** for development coordination:
- **10 main tasks** generated from PRD analysis
- **Subtasks** auto-generated for complex work
- **Dependencies** managed automatically
- **Progress tracking** with AI assistance

### Key Commands
```bash
taskmaster expand --id=<id>        # Break task into subtasks
taskmaster update-task --id=<id> --prompt="changes"  # Update with AI
taskmaster analyze-complexity      # Get complexity analysis
```

## 📊 Progress Tracking

**Overall Progress**: ~60% complete
- **Task 1**: 100% (5/5 subtasks done)
- **Task 2**: In progress

**Critical Path**: Complete infrastructure → ICP preview → Discovery engine → Contact verification → Scoring → Draft generation → Export/handoff

## 🔑 Environment Setup

### Required API Keys
```bash
# Already configured
OPENAI_API_KEY=sk-proj-FoL4...  # ✅ Working

# Needed for full functionality
ANTHROPIC_API_KEY=              # For Claude models
PERPLEXITY_API_KEY=             # For research features
BOUNCER_API_KEY=                # Email verification
GMAIL_CLIENT_ID=                # Email integration
OUTLOOK_CLIENT_ID=              # Email integration
```

### Database Requirements
- **PostgreSQL**: Main data storage
- **Redis**: Caching + job queue backend
- **BullMQ**: Job processing for discovery operations

## 🎨 Frontend Implementation

The original frontend (`frontend.html`) contains a **complete 6-step workflow**:
1. **Welcome/Input** - URL/brief entry with ICP preview
2. **Discovery Results** - Account listing with filtering
3. **Contacts** - Verified contact management
4. **Prioritize** - Evidence breakdown with scoring
5. **Drafts** - Email generation with evidence linking
6. **Handoff** - CSV export + Gmail/Outlook integration

**Migration Priority**: Convert this to Next.js components while preserving functionality.

## 🔄 Handoff Protocol

### For Continuing Development
1. **Read `project_status.md`** - Get latest status
2. **Run `taskmaster next`** - See current priority
3. **Check build status**: `cd frontend && npm run build`, `cd backend && npm run build`
4. **Review PRD.txt** - Understand requirements

### For New Tasks
1. **Use Taskmaster**: `taskmaster show <id>` for details
2. **Update progress**: Mark tasks complete as you go
3. **Update `project_status.md`** after major changes
4. **Test builds** before marking tasks done

### For Debugging
- **Frontend logs**: Next.js dev server console
- **Backend logs**: Fastify server console
- **Task status**: `taskmaster list --with-subtasks`
- **Dependencies**: Check `.taskmaster/tasks/tasks.json`

## 🚨 Important Notes

### Code Quality Standards
- **TypeScript everywhere** - No JavaScript files
- **Build verification** - Must compile without errors
- **Environment variables** - Use .env files, never hardcode
- **Evidence tracking** - Every feature needs source provenance

### Compliance Requirements
- **Email hygiene**: SPF/DKIM/DMARC checks required
- **List-Unsubscribe**: Required for all email handoffs
- **Data privacy**: GDPR/CCPA deletion capabilities needed
- **Rate limiting**: Respect robots.txt, implement backoff

### Performance Targets
- **URL to results**: ≤10 minutes end-to-end
- **Draft generation**: ≤10 seconds per contact
- **Minimum output**: ≥25 verified contacts with ≥65 avg score

---

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

---

**Remember**: Always update `project_status.md` after significant changes!
