# SignalRunner Platform - User Workflow & Use Cases

Based on what we've implemented, here's how the platform works:

---
🎯 Core Use Case: B2B Lead Discovery & Outreach

Who it's for:
- Sales reps at B2B companies
- SDRs (Sales Development Representatives)
- Business development teams
- Founders doing outbound sales
- Marketing teams building targeted lists

---
📱 Current User Journey (As Implemented)

Step 1: Landing Page (/)

What the user sees:
- Professional landing page with stats (1,247 users, 18,432 runs, 486K contacts found)
- Value proposition: "Find, prioritize, and message ready-to-buy accounts in minutes"
- Live ICP Discovery demo widget (can try with any URL)
- Feature cards explaining the platform
- FAQ section with common questions

User Action: Click "Get Started" → Goes to /start

---
Step 2: ICP Preview Input (/start)

What the user does:
1. Pastes a company URL (e.g., stripe.com, shopify.com)
2. Optionally adds a brief description (e.g., "Looking for fintech companies hiring engineers")
3. Clicks "Generate ICP Preview"

What happens:
- Client-side ICP generation - Instantly analyzes the URL and brief to create an Ideal Customer Profile
- Discovery signals - Calls backend to detect:
  - Hiring signals (career pages, job postings) with confidence scores
  - Business profile (industry, company size, region)

What the user sees:
✅ ICP Preview Generated
- Business Category: SaaS / Fintech
- Company Size: 201-500
- Region: San Francisco
- Buyer Roles: CEO, CTO, VP Sales
- Keywords: payments, API, platform

📊 Discovery Signals Detected (5 signals)
Hiring Signals:
  ✓ Career Page Likely (60% confidence)
    Evidence: Possible endpoints found

Business Profile:
  ✓ Industry Guess: Financial Services (65% confidence)
  ✓ Company Size: Mid-market (70% confidence)

Real-world example:
Sarah, an SDR at a DevOps tool company, wants to find SaaS companies actively hiring engineers (signal of
 growth). She pastes notion.so and adds "Looking for productivity tool companies hiring". The system 
instantly shows her Notion's profile + hiring signals.

---
Step 3: Contact Discovery (/contacts)

What the user does:
1. Enters the same or different company URL
2. Selects target roles (Owner/GM, Decision Makers, CTO, etc.)
3. Sets confidence threshold (default 85%)
4. Clicks "Start Discovery"

What happens (in <10 minutes):
- Pattern detection - Generates potential email patterns (firstname.lastname@, first@, etc.)
- Provider lookup - Checks email discovery providers (Hunter, Clearbit) for verified contacts
- Email verification - Validates deliverability of discovered emails
- Confidence scoring - Each contact gets a score based on pattern match + verification

What the user sees:
🔄 Discovery Running... (Job ID: abc123)

✅ Discovery Complete - 12 contacts found

[Filter by confidence: 70%---●---95%]

Contact: Sarah Chen
Email: sarah.chen@stripe.com
Role: VP Engineering
Confidence: 92% ✓ (green badge)
Verification: Verified ✓
Pattern: firstname.lastname@domain
Source: Hunter.io

Contact: John Doe
Email: john@stripe.com
Confidence: 78% (yellow badge)
Verification: Pending ⏱
Pattern: first@domain
Source: Pattern match

Real-world example:
Sarah now runs contact discovery on Notion. The system finds 12 verified contacts including "Head of 
Engineering" (92% confidence), "VP Product" (88%), and "Engineering Manager" (85%). She can filter to 
only show 85%+ contacts.

---
🎯 Key Use Cases (Based on Implementation)

Use Case 1: Territory Expansion

Scenario: Sales team expanding into new verticals

Workflow:
1. Paste competitor URLs to understand the market
2. Review ICP previews to identify patterns
3. Run contact discovery on 20-30 similar companies
4. Get 300+ verified contacts with roles and confidence scores
5. Export to CSV for email sequencer

Value: Find 300 qualified leads in 2 hours instead of 2 weeks

---
Use Case 2: Event-Based Outreach

Scenario: Company just raised funding or is hiring aggressively

Workflow:
1. Paste company URL showing growth signals
2. See hiring signals (job postings detected)
3. Discover decision-maker contacts
4. Reach out with timing-based messaging ("Saw you're hiring 5 engineers...")

Value: Reach prospects at the perfect moment with relevant context

---
Use Case 3: Account-Based Marketing (ABM)

Scenario: Marketing team targeting 50 high-value accounts

Workflow:
1. Create ICP previews for all 50 target accounts
2. Run discovery to find 3-5 contacts per account
3. Review confidence scores and verification status
4. Filter to only 85%+ verified contacts
5. Personalize outreach based on discovered signals

Value: Quality over quantity - 150 highly verified contacts instead of 10,000 random emails

---
Use Case 4: Sales Research Automation

Scenario: SDR doing daily prospecting

Workflow:
1. Morning routine: Paste 10 target company URLs
2. Review results: Each company shows ICP + signals + contacts in 10 mins
3. Export: Download CSV with all verified contacts
4. Upload to sequencer: Import to Outreach/Salesloft
5. Personalize: Reference discovered signals in messaging

Value: 2 hours of research condensed into 20 minutes

---
🔮 What's Coming Next (Planned Tasks)

Task 5: Scoring & Prioritization

- Fit Score - How well does this contact match your ICP?
- Intent Score - Are they showing buying signals?
- Reachability Score - How likely is email to get through?
- Recency Score - How fresh is this data?

User sees: "Sarah Chen - Total Score: 87/100 (High Priority)"

---
Task 6: Evidence-Based Draft Generation

- Generate personalized email drafts for each contact
- Every sentence includes evidence from discovery
- Choose tone (Direct vs Consultative)
- Add optional case studies

Example draft:
"Hi Sarah, saw Stripe is hiring 5 engineers this quarter [link to careers page]. We help fintech 
companies [based on discovered industry] reduce deployment time by 40%..."

---
Task 7: Export & Email Integration

- Export to CSV for sequencers (Smartlead, Instantly)
- Send directly via Gmail/Outlook OAuth
- All evidence preserved in export
- List-Unsubscribe headers included (compliance)

---
💡 Real-World Example: Full Workflow

Sarah's Monday Morning:

9:00 AM - Opens SignalRunner
- Goal: Find 50 SaaS CTOs for a DevOps tool pitch

9:05 AM - Pastes notion.so, airtable.com, figma.com
- Reviews ICP previews
- Sees Notion is hiring (good timing signal)

9:10 AM - Runs contact discovery on all 3
- Gets 15 verified contacts total
- Filters to 85%+ confidence = 12 contacts remain

9:15 AM - Reviews contacts
- 4 CTOs, 5 VPs Engineering, 3 Eng Directors
- All emails verified, roles confirmed

9:20 AM - Exports to CSV
- Uploads to Outreach.io sequencer
- Writes personalized opener referencing hiring signals

9:30 AM - Sends first batch
- 12 highly targeted emails sent
- Each references specific company context

Result: 12 quality conversations instead of 100 spray-and-pray emails

---
🎯 Why This Matters

Traditional approach:
- Manual research: 2-3 hours per company
- Generic email lists: 2% response rate
- No context: "Dear Sir/Madam..."

SignalRunner approach:
- Automated research: 10 minutes per company
- Verified contacts: 85%+ deliverability
- Full context: Evidence-based personalization
- 10x faster with higher quality

---
That's the complete workflow based on what we've built! The platform transforms manual prospecting into
automated, evidence-based lead generation in under 10 minutes per company.

---
Prospecting for My Company (Lookalike Search)

Goal: Paste your own company’s domain, infer your ICP, and find lookalike accounts to target.

Flow:
1) Paste your company URL on /start and choose “Prospecting for my company”.
2) ICP Extraction — The system analyzes your site (homepage, product/solutions, case studies) to build your ICP (category, size, regions, buyer roles, keywords/offers).
3) Account Discovery — It searches providers/web for lookalike accounts, respecting robots.txt and rate limits, and ranks them by fit to your ICP.
4) Review & Select — See candidates with reasons and sources; select the top accounts.
5) Run Contacts — Trigger contact discovery for selected accounts; filter by threshold (e.g., 85%+) and verify.
6) Drafts — Generate evidence-linked drafts (Task 6) for chosen contacts.

Notes:
- Acceptance target: 30–100 candidate accounts in ≤10 minutes demo path with provenance.
- Ranking quality improves with Scoring (Task 5) once available.
