# SignalRunner User Workflow & Use Cases

**Last Updated:** 2025-09-29
**Status:** Task 4 Complete - Contact Discovery Implemented

## Complete User Journey

### 1. Landing Page (/)

**Purpose**: Entry point showcasing platform value and immediate utility

**Key Elements**:
- **Hero Section**: "Discovery-First Lead Generation" messaging
- **Stats Display**:
  - 1,247 Active Users
  - 18,432 Discovery Runs
  - 486K Contacts Found
  - 94% Success Rate
- **Demo Widget**: Interactive URL input showing instant ICP generation
- **Partner Logos**: Trust indicators (Stripe, Shopify, Notion, Linear, etc.)
- **FAQ Section**: Common questions and answers

**User Actions**:
- View platform overview
- Test demo widget with company URL
- Click "Get Started" → Navigate to `/start`
- Review FAQ for questions

### 2. ICP Preview Input (/start)

**Purpose**: Capture target company URL and optional brief, generate ICP preview

**Current Implementation**:
- **URL Input Field**: Company domain or full URL (e.g., `stripe.com` or `https://stripe.com`)
- **Brief Input Field** (Optional): Additional context about target audience
- **Real-time Validation**: Client-side checks for valid URL format
- **"Generate Preview" Button**: Triggers ICP generation API call

**What Happens**:
1. User enters company URL (required) + optional brief
2. System validates input format
3. Frontend calls `POST /api/discovery/preview`
4. Backend analyzes company:
   - Scrapes website content
   - Identifies industry signals
   - Generates ICP characteristics
   - Returns preview with discovery signals
5. Frontend displays ICP preview with:
   - Company overview
   - Target persona characteristics
   - Discovery strategy recommendations

**Example Output**:
```
Target: stripe.com
ICP Preview:
- Industry: Financial Technology (Fintech)
- Target Roles: CFOs, Finance Directors, Payment Operations Leads
- Company Size: Series B+ startups, Mid-market enterprises
- Pain Points: Payment processing complexity, fraud prevention, global expansion
- Discovery Signals: Engineering blogs mentioning "payment infrastructure",
  job postings for "Payment Systems Engineer", recent funding announcements
```

### 3. Contact Discovery (/contacts)

**Purpose**: Find and verify contacts at target companies based on ICP

**Current Implementation**:
- **Company URL Input**: Target company domain
- **Role Selection**: Checkboxes for "Owner/GM" and "Decision Makers"
- **Confidence Threshold Slider**: 70-95% range for contact quality filtering
- **Discovery Results Table**: Shows discovered contacts with:
  - Name
  - Email address (verified)
  - Role/Title
  - Email pattern detected (e.g., `{first}.{last}@domain.com`)
  - Confidence score (color-coded badge)
  - Verification status (icon + score)
  - Sources (provider attribution)

**What Happens**:
1. User enters company URL and selects target roles
2. Frontend calls `POST /api/contacts/discover`
3. Backend creates BullMQ job for async processing:
   - **Pattern Detection**: Analyzes company domain for email patterns
   - **Provider Lookup**: Queries Hunter/Clearbit APIs (currently mocked)
   - **Email Generation**: Creates candidate emails based on patterns
   - **Verification**: Validates email deliverability
   - **Confidence Scoring**: Assigns 0-100% score to each contact
4. Frontend polls `GET /api/contacts/{jobId}` every 1 second
5. Results display with real-time filtering by threshold
6. User can adjust threshold slider to refine results

**Color-Coded Confidence**:
- **Green (≥85%)**: High confidence - verified or strong pattern match
- **Yellow (70-84%)**: Medium confidence - pattern match with some uncertainty
- **Red (<70%)**: Low confidence - speculative or unverified

**Verification Status Icons**:
- ✓ **Verified**: Email confirmed deliverable
- ⏱ **Pending**: Verification in progress
- ✗ **Invalid**: Email bounced or rejected
- 🛡 **Unknown**: Not yet verified

## Key Use Cases

### Use Case 1: Territory Expansion
**Scenario**: Sales team expanding into new geographic region

**Workflow**:
1. Marketing manager pastes competitor URL from target region (e.g., `acme-logistics-uk.com`)
2. Reviews ICP preview to understand regional business model
3. Navigates to `/contacts` and discovers 50+ verified contacts
4. Filters to ≥85% confidence threshold → 25 high-quality leads
5. Exports contacts to CRM
6. *[Future: Tasks 5-7]* Reviews scoring/evidence, generates personalized drafts, sends via Gmail

**Time to Value**: 10 minutes from URL paste to CRM export

### Use Case 2: Event-Based Outreach
**Scenario**: Company just announced Series B funding

**Workflow**:
1. SDR sees funding announcement on TechCrunch
2. Pastes company URL into `/start` with brief: "Just raised $50M Series B, likely expanding ops team"
3. ICP preview highlights hiring signals and growth indicators
4. Discovers 15 executive contacts in `/contacts` (CFO, COO, VP Engineering)
5. *[Future]* AI generates drafts congratulating on funding + offering relevant solution
6. *[Future]* Sends personalized emails within 2 hours of announcement

**Time to Value**: 30 minutes from news to inbox (beating competitors)

### Use Case 3: Account-Based Marketing (ABM)
**Scenario**: Enterprise team targeting Fortune 500 accounts

**Workflow**:
1. Marketing ops uploads list of 100 target company domains
2. Batch processes each URL through `/start` → generates 100 ICP previews
3. Identifies companies with high fit scores (e.g., "uses Salesforce, 500+ employees, hiring DevOps roles")
4. For each high-fit account, runs contact discovery
5. *[Future]* Prioritizes contacts by engagement signals (recent LinkedIn activity, GitHub commits)
6. *[Future]* Generates multi-touch campaign drafts tailored to each persona
7. Exports to marketing automation platform (HubSpot/Marketo)

**Time to Value**: 2 hours for 100-account campaign setup (vs. days of manual research)

### Use Case 4: Sales Research Automation
**Scenario**: AE preparing for discovery call with new prospect

**Workflow**:
1. AE receives inbound demo request from `newco.io`
2. 15 minutes before call, pastes URL into `/start`
3. Reviews ICP preview to understand:
   - Company business model
   - Technology stack indicators
   - Hiring signals (what they're building)
   - Competitive landscape
4. Discovers key stakeholders in `/contacts`
5. Identifies prospect's role in org chart
6. *[Future]* Reviews AI-generated "evidence brief" with company news, recent posts, tech choices
7. Enters call with deep context and tailored talking points

**Time to Value**: 5 minutes from URL to comprehensive research brief

## Real-World Example: Sarah's Monday Morning

**Sarah** is an SDR at a B2B SaaS company selling API infrastructure.

**9:00 AM** - Sarah reads her weekly industry newsletter and sees that **Acme Robotics** just announced a new product requiring real-time data sync.

**9:05 AM** - She opens SignalRunner and pastes `acmerobotics.com` into `/start` with brief:
> "Just announced real-time robotics control product - likely need API infrastructure for data streaming"

**9:07 AM** - ICP preview shows:
- Industry: Industrial IoT
- Target Roles: VP Engineering, Director of Platform Engineering
- Tech Stack Signals: Uses AWS, hiring "Senior Backend Engineer - Real-time Systems"
- Discovery Strategy: Focus on engineering leadership and infrastructure team

**9:10 AM** - Sarah clicks through to `/contacts`, enters URL again, selects "Decision Makers"

**9:12 AM** - Results appear with 18 contacts:
- **Emily Chen** - VP Engineering (92% confidence, verified)
- **Marcus Johnson** - Director of Platform (88% confidence, verified)
- **Priya Patel** - Senior Engineering Manager (85% confidence, pending)
- [15 more contacts at various confidence levels]

**9:15 AM** - Sarah adjusts threshold to 85%+ → narrows to 8 high-quality leads

**9:20 AM** - *[Future: Task 6]* Sarah reviews AI-generated draft for Emily:
> Subject: Real-time data sync for Acme's new robotics platform
>
> Hi Emily,
>
> Saw Acme's announcement about the new real-time control system—congrats!
>
> Given your team is [hiring for real-time systems engineers], I imagine you're
> evaluating infrastructure for streaming telemetry data at scale.
>
> We work with companies like [similar IoT companies] who faced similar challenges...

**9:25 AM** - Sarah reviews evidence panel showing:
- ✓ Recent job posting: "Senior Backend Engineer - Real-time Systems"
- ✓ Company blog post: "Building the next generation of robotics control"
- ✓ LinkedIn: Emily recently liked a post about "event-driven architectures"

**9:30 AM** - Sarah sends 8 personalized emails via Gmail integration

**9:35 AM** - Sarah moves to next target company

**Total Time**: 30 minutes from news article to 8 personalized emails sent

## What's Coming Next

### Task 5: Scoring & Prioritization Engine (Pending)
- Multi-signal scoring algorithm (company fit + contact relevance + timing)
- Evidence collection system (recent news, social activity, job postings)
- Priority ranking for contacts within each account

### Task 6: Evidence-Backed Draft Generation (Pending)
- AI-powered email draft generation using Claude/GPT
- Evidence linking in drafts (cite sources: LinkedIn, blog, jobs)
- Tone customization (direct/warm/consultative)
- Multi-touch sequence generation

### Task 7: Export & Email Integration (Pending)
- CSV export with all contact data
- Gmail OAuth integration for direct sending
- Outlook OAuth integration
- Sequencer integration (Smartlead/Instantly)
- SPF/DKIM/DMARC compliance checks

## Technical Implementation Notes

**Current Architecture**:
- **Frontend**: Next.js 15 on port 3002
- **Backend**: Fastify on port 8000
- **Job Queue**: BullMQ with Redis
- **Database**: PostgreSQL for persistence

**API Endpoints Live**:
- `POST /api/discovery/preview` - ICP generation
- `GET /api/discovery/:jobId` - ICP job status
- `POST /api/contacts/discover` - Start contact discovery
- `GET /api/contacts/:jobId` - Contact discovery results
- `POST /api/contacts/verify` - Verify specific emails
- `PATCH /api/contacts/:id/confidence` - Update threshold

**Performance Targets**:
- ICP Preview: ≤30 seconds
- Contact Discovery: ≤5 minutes for 50 contacts
- Email Verification: ≤2 seconds per email
- End-to-end (URL → verified contacts): ≤10 minutes

---

**For Development Team**: This workflow is implemented across:
- `frontend/src/app/page.tsx` - Landing page
- `frontend/src/app/start/page.tsx` - ICP input/preview
- `frontend/src/app/contacts/page.tsx` - Contact discovery
- `backend/src/routes/discovery.ts` - ICP API
- `backend/src/routes/contacts.ts` - Contact API
- `backend/src/services/contactDiscovery.ts` - Orchestration logic
- `backend/src/workers/contact-discovery.ts` - BullMQ worker