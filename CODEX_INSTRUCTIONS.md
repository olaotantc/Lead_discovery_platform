# Codex Instructions for Next Tasks

## 🎯 Current Status
- **Completed**: Tasks 1-5 (45% complete)
- **Next Priority**: Task 6 - Generate Evidence-Grounded Drafts (Enhancement)
- **After That**: Task 7 - Export and Handoff Features

## 📋 Task 6: Enhance Draft Generation System

### Context
Draft generation already exists (`backend/src/services/drafts.ts`, `backend/src/routes/drafts.ts`) but needs enhancement to be fully evidence-grounded per PRD requirements.

### Your Mission
Enhance the draft generation to include:

1. **Evidence Linking**: Every claim in drafts must link to source URL + snippet
2. **Reason Codes**: Attach scoring reason codes to draft context
3. **Multiple Tones**: Support 'direct', 'consultative', 'warm' tones
4. **Draft Variations**: Generate 3 variants per sequence (opener, follow-up 1, follow-up 2)
5. **Compliance**: Auto-include List-Unsubscribe placeholder

### Implementation Checklist

#### Backend Changes

**File: `backend/src/services/drafts.ts`**
- [ ] Update `generateDrafts()` to accept `evidenceLinks` parameter
- [ ] Parse contact's `scoreFacets.evidence` array for source URLs
- [ ] Format evidence as `[Source: url]` inline in draft text
- [ ] Add function to inject reason codes into prompt context
- [ ] Support 3 tone variations: direct, consultative, warm
- [ ] Generate 3-email sequence: opener, followUp1, followUp2
- [ ] Include List-Unsubscribe: `<mailto:unsubscribe@example.com>`

**File: `backend/src/routes/drafts.ts`**
- [ ] Update POST `/api/drafts/generate` schema to require `contactId`
- [ ] Fetch contact data including `scoreFacets` from discovery results
- [ ] Pass evidence + reason codes to draft generation
- [ ] Return drafts with embedded evidence links
- [ ] Add GET `/api/drafts/:jobId/evidence` to retrieve linked sources

**New File: `backend/src/types/draft.ts`**
```typescript
export interface EvidenceLink {
  claimText: string;
  sourceUrl: string;
  snippet: string;
  timestamp: string;
}

export interface DraftSequence {
  opener: string;
  followUp1: string;
  followUp2: string;
  evidenceLinks: EvidenceLink[];
  tone: 'direct' | 'consultative' | 'warm';
  listUnsubscribe: string;
}
```

#### Frontend Changes

**File: `frontend/src/app/contacts/page.tsx`**
- [ ] Update draft display to show evidence links as clickable citations
- [ ] Add tone selector radio buttons: Direct | Consultative | Warm
- [ ] Display all 3 emails in sequence with visual separation
- [ ] Show evidence count badge (e.g., "12 sources cited")
- [ ] Add "View Evidence" expandable section below each draft
- [ ] Style evidence links distinctly (blue underline + popup on hover)

**Example UI Enhancement:**
```tsx
<div className="draft-sequence">
  <div className="draft-header">
    <span className="evidence-badge">12 sources cited</span>
    <span className="tone-badge">Direct tone</span>
  </div>
  <div className="draft-content">
    {/* Email with inline [1], [2], [3] citations */}
  </div>
  <details className="evidence-section">
    <summary>View Evidence (12 sources)</summary>
    {/* List of evidence links with snippets */}
  </details>
</div>
```

### Testing Requirements

1. **Test Case 1**: Generate draft for contact with ≥5 evidence items
   - Verify all evidence URLs appear as citations
   - Check tone variations produce different language
   - Confirm 3-email sequence flows logically

2. **Test Case 2**: Check compliance
   - List-Unsubscribe header present in all drafts
   - Evidence links are valid URLs
   - No fabricated claims without sources

3. **Test Case 3**: UI/UX validation
   - Evidence links are clickable and styled
   - Tone selector updates drafts correctly
   - Mobile responsive layout works

### Expected Output

**API Response Example:**
```json
{
  "success": true,
  "data": {
    "jobId": "draft-123",
    "contactId": "c1",
    "sequence": {
      "opener": "Hi Riley, noticed Stripe is hiring for [Role]. Evidence suggests [claim with [1] citation]...",
      "followUp1": "Following up on my previous email about [topic]...",
      "followUp2": "Final follow-up - would love to connect...",
      "tone": "direct",
      "evidenceLinks": [
        {
          "claimText": "hiring for senior engineers",
          "sourceUrl": "https://stripe.com/careers",
          "snippet": "We're looking for experienced engineers...",
          "timestamp": "2025-09-30T10:00:00Z"
        }
      ],
      "listUnsubscribe": "<mailto:unsubscribe@signalrunner.com>"
    }
  }
}
```

### Files to Modify
- `backend/src/services/drafts.ts` (MAJOR changes)
- `backend/src/routes/drafts.ts` (MINOR changes)
- `backend/src/types/draft.ts` (NEW file)
- `frontend/src/app/contacts/page.tsx` (MAJOR UI changes)

### Files to Reference
- `backend/src/services/scoring.ts` - See how evidence is structured
- `backend/src/types/contact.ts` - Contact interface with scoreFacets

---

## 📋 Task 7: Export and Handoff Features (After Task 6)

### Your Mission
Build export functionality for completed discovery runs with compliance enforcement.

### Implementation Checklist

#### Backend Changes

**New File: `backend/src/services/export.ts`**
- [ ] Function `exportToCSV(jobId: string): Promise<string>`
- [ ] Include all contact fields + scores + evidence counts
- [ ] Add compliance gate: only export verified contacts with score ≥70
- [ ] Add List-Unsubscribe header to CSV metadata
- [ ] Function `exportToGmail(contacts[], drafts[])` (OAuth placeholder)
- [ ] Function `exportToOutlook(contacts[], drafts[])` (OAuth placeholder)

**New File: `backend/src/routes/export.ts`**
- [ ] GET `/api/export/:jobId/csv` - Download CSV
- [ ] POST `/api/export/:jobId/gmail` - Push to Gmail (future OAuth)
- [ ] POST `/api/export/:jobId/outlook` - Push to Outlook (future OAuth)
- [ ] GET `/api/export/:jobId/validate` - Check compliance before export

**CSV Format:**
```csv
Name,Email,Role,Score,Fit,Intent,Reachability,Recency,Verification,EvidenceCount,DraftReady,ListUnsubscribe
Riley Garcia,riley@stripe.com,Manager,40,35,20,47,100,verified,5,true,<mailto:unsub@example.com>
```

#### Frontend Changes

**New File: `frontend/src/app/contacts/ExportPanel.tsx`**
- [ ] Export button group: CSV | Gmail | Outlook
- [ ] Show compliance gate status before export
- [ ] Display warnings if contacts don't meet threshold
- [ ] Download CSV client-side or link to backend endpoint
- [ ] OAuth login buttons (non-functional, UI only for now)

**File: `frontend/src/app/contacts/page.tsx`**
- [ ] Add `<ExportPanel />` component below results table
- [ ] Show export summary: "X contacts ready for export (Y below threshold)"
- [ ] Add bulk selection checkboxes to table rows
- [ ] Filter export to only selected contacts

### Testing Requirements

1. **Test Case 1**: CSV Export
   - Export 5 contacts from discovery run
   - Verify CSV has all columns
   - Check List-Unsubscribe in every row
   - Confirm only verified contacts included

2. **Test Case 2**: Compliance Gate
   - Try exporting contacts with score <70
   - Verify warning appears
   - Confirm export blocks unverified emails

3. **Test Case 3**: UI/UX
   - Bulk selection works correctly
   - Export buttons styled consistently
   - Loading states show during export

### Expected Output

**API Response Example:**
```json
{
  "success": true,
  "data": {
    "csvUrl": "/api/export/job-123/download/contacts.csv",
    "stats": {
      "total": 10,
      "exported": 8,
      "skipped": 2,
      "skipReasons": ["score_below_threshold", "unverified"]
    },
    "complianceChecks": {
      "listUnsubscribe": true,
      "verificationRequired": true,
      "scoreThreshold": 70
    }
  }
}
```

### Files to Create
- `backend/src/services/export.ts` (NEW)
- `backend/src/routes/export.ts` (NEW)
- `frontend/src/app/contacts/ExportPanel.tsx` (NEW)

### Files to Modify
- `frontend/src/app/contacts/page.tsx` (add ExportPanel)
- `backend/src/index.ts` (register export routes)

---

## 🚨 Important Notes for Codex

### Code Quality Standards
1. **TypeScript everywhere** - No `any` types, use proper interfaces
2. **Error handling** - Wrap API calls in try-catch, return proper error responses
3. **Validation** - Use Fastify schema validation on all routes
4. **Comments** - Add JSDoc comments for all public functions
5. **Logging** - Use `fastify.log.info/error` for important operations

### Testing Protocol
1. Run TypeScript compilation: `cd backend && npx tsc --noEmit`
2. Test backend endpoints with curl
3. Check frontend compiles: `cd frontend && npm run build`
4. Verify end-to-end flow manually in browser
5. **DO NOT** mark task complete if tests fail

### Git Workflow
1. Make all changes for a task
2. Test thoroughly
3. Commit with message format: `feat: Complete Task X - [brief description]`
4. Include detailed bullet points in commit body
5. Push to main branch

### When You're Stuck
- Read related files first (use grep/find)
- Check `backend/src/types/` for interfaces
- Look at similar existing routes/services
- **ASK** if unclear rather than guessing

### Deliverables
- [ ] All code changes committed
- [ ] TypeScript compiles without errors
- [ ] Manual testing completed with curl/browser
- [ ] Update CODEX_INSTRUCTIONS.md with "✅ COMPLETE" when done

---

## 📊 Progress Tracking

### Task 6: Evidence-Grounded Drafts
- Status: ⏳ Not Started
- Assignee: Codex
- Reviewer: Claude Code
- ETA: 2-3 hours

### Task 7: Export and Handoff
- Status: ⏳ Pending Task 6
- Assignee: Codex
- Reviewer: Claude Code
- ETA: 1-2 hours

---

## 🎯 Success Criteria

**Task 6 Complete When:**
- [ ] Drafts include ≥3 evidence citations per email
- [ ] Evidence links are clickable in UI
- [ ] All 3 tones generate different language
- [ ] List-Unsubscribe appears in all drafts
- [ ] TypeScript compiles cleanly
- [ ] End-to-end test passes (generate draft → view evidence)

**Task 7 Complete When:**
- [ ] CSV export works with compliance gate
- [ ] Export panel UI fully functional
- [ ] Bulk selection works correctly
- [ ] OAuth buttons present (non-functional OK)
- [ ] TypeScript compiles cleanly
- [ ] End-to-end test passes (discovery → export CSV)

---

**Good luck, Codex! Claude Code will review and fix any issues after you're done.**