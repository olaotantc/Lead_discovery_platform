# Discovery Refinement Analysis

**Date**: 2025-10-02
**Status**: Analysis Complete - Implementation Pending

## Problem Statement

The candidate discovery system is searching too broadly and defaulting to large, well-known companies (Zapier, Figma, Xero) instead of finding specific, reachable SMBs and agencies that are actual potential leads.

### Current Issues

1. **Too broad search** - "Founders, Developers, Project Managers" matches entire tech industry
2. **AI limitations** - GPT can only "know" ~30 famous companies per prompt
3. **No geographical/niche filtering** - Searching globally across all verticals
4. **Defaulting to well-known brands** - AI bias toward famous companies it recognizes
5. **Missing the long tail** - Millions of SMBs/agencies exist but only finding household names

### Discovery Results
- **Current**: ~35 companies, mostly large/famous brands
- **Expected**: Hundreds of specific SMBs, agencies, startups in target segments
- **Gap**: Not finding the long tail of potential customers

---

## 7 Proposed Solutions

### 1. Geographic + Industry Layering
**Concept**: Add location filters and industry sub-categories to the ICP.

**Implementation**:
- Extract city/region from URL or content
- Combine with industry niches: "Software agencies in San Francisco" vs "Software agencies globally"

**Pros**:
- ✅ Dramatically narrows search space
- ✅ Finds local/regional companies
- ✅ More specific, reachable results

**Cons**:
- ❌ Requires location extraction logic
- ❌ May miss remote-first companies
- ❌ Limited by AI's geographic knowledge

**Effort**: Medium | **Impact**: High

---

### 2. Company Size Brackets with Data Sources
**Concept**: Use firmographic data APIs (Clearbit, Apollo, etc.) with strict size filters.

**Implementation**:
- Query: "SaaS companies, 10-50 employees, Series A-B funding"
- Filter by revenue, employee count, funding stage

**Pros**:
- ✅ Real companies from databases
- ✅ No AI hallucination
- ✅ Accurate firmographic data

**Cons**:
- ❌ Costs money per lookup ($$$)
- ❌ Requires API integration
- ❌ Data coverage varies by region

**Effort**: High | **Impact**: Very High

---

### 3. Keyword + Platform Scraping
**Concept**: Scrape industry-specific platforms (Product Hunt, AngelList, Clutch, LinkedIn).

**Implementation**:
- Search "project management" on Product Hunt
- Scrape company profiles from results
- Extract: name, domain, description, size

**Pros**:
- ✅ Real, recent companies
- ✅ Niche-specific platforms
- ✅ Often includes contact info

**Cons**:
- ❌ Scraping complexity
- ❌ Rate limits / IP blocks
- ❌ Legal/ToS concerns
- ❌ Maintenance overhead

**Effort**: Very High | **Impact**: High

---

### 4. Multi-Pass Refinement Strategy ⭐ (RECOMMENDED)
**Concept**: Use AI in stages: broad → narrow → specific.

**Implementation**:
```typescript
// Pass 1: Extract verticals
const verticals = await AI(`Given ICP targeting "Founders, Developers",
  list 5-7 SPECIFIC INDUSTRY VERTICALS that would buy project management tools.
  Examples: "Mobile app development agencies", "E-commerce SaaS startups"
  Return: ["vertical1", "vertical2", ...]`);

// Pass 2: Search each vertical (parallel)
const results = await Promise.all(
  verticals.slice(0, 5).map(vertical =>
    AI(`Find 10 REAL companies in "${vertical}" with 10-200 employees`)
  )
);
// Result: 50 companies (5 verticals × 10 each)
```

**Pros**:
- ✅ AI better at focused searches
- ✅ Gets 50+ specific companies vs 30 generic
- ✅ No external dependencies
- ✅ Works within current architecture
- ✅ Can implement in ~2 hours

**Cons**:
- ❌ 3x API calls (slower, more expensive)
- ❌ Still limited by AI knowledge

**Effort**: Low | **Impact**: High

---

### 5. Seed Company Expansion
**Concept**: Start with 1-2 perfect examples, find similar companies.

**Implementation**:
- User provides: "Thoughtbot is a perfect customer"
- AI: "Find 50 companies similar to Thoughtbot (dev agency, 50-200 employees, Ruby focus)"

**Pros**:
- ✅ AI better at "find similar" than "find from scratch"
- ✅ Results closely match ideal customer
- ✅ Simple user experience

**Cons**:
- ❌ Requires good seed examples
- ❌ May miss diverse opportunities
- ❌ User needs to know example companies

**Effort**: Low | **Impact**: Medium

---

### 6. Vertical-First Discovery ⭐ (RECOMMENDED)
**Concept**: Let user pick a vertical before searching.

**Implementation**:
1. After ICP generation, show:
   ```
   Which segments should we prioritize?
   ☐ Software Development Agencies
   ☐ SaaS Startups (Series A-B)
   ☐ Design & Product Studios
   ☐ E-commerce Tech Teams
   ☐ All of the above
   ```

2. Optional geographic filter:
   ```
   Geographic focus?
   [San Francisco] [New York] [London] [Global]
   ```

3. Search: "Find 30 {selected_vertical} in {location} with 10-200 employees"

**Pros**:
- ✅ User-guided precision
- ✅ Manageable search space
- ✅ Reduces irrelevant results by 80%+
- ✅ User knows their market best

**Cons**:
- ❌ Extra step in workflow
- ❌ User needs to understand their ICP verticals

**Effort**: Medium | **Impact**: Very High

---

### 7. Hybrid: AI + Domain Lists
**Concept**: Combine AI company generation with domain list verification.

**Implementation**:
1. AI generates companies
2. Cross-reference with Tranco top 1M domains or Builtwith.com tech stacks
3. Verify company exists and matches size/stage

**Pros**:
- ✅ Real companies only (validated)
- ✅ No hallucination
- ✅ Can filter by tech stack

**Cons**:
- ❌ Requires domain lists (data source)
- ❌ Complex filtering logic
- ❌ Limited to companies with web presence

**Effort**: High | **Impact**: Medium

---

## 🎯 Recommended Implementation Plan

### **Phase 1: Multi-Pass Industry Refinement** (Week 1) ⭐
**Why**: No external dependencies, immediate improvement, works within current architecture.

**Changes**:
1. Add vertical extraction step to `candidateSourcing.ts`
2. Modify to search each vertical separately (parallel API calls)
3. Increase from 30 → 50 companies (5 verticals × 10 each)

**Expected Results**:
- Before: 30 generic companies (Zapier, Figma, Monday.com)
- After: 50 specific companies (10 dev agencies, 10 SaaS startups, 10 design studios, etc.)

**Implementation Time**: ~2-3 hours

---

### **Phase 2: Vertical Selector with Geographic Filter** (Week 2) ⭐
**Why**: User-guided precision + location filtering = highly targeted results.

**Changes**:
1. Add vertical selector UI component (checkboxes)
2. Add optional geographic filter dropdown
3. Update discovery API to accept vertical + location params
4. Let user choose 1-3 verticals to focus on

**Expected Results**:
- User selects: "Dev Agencies" + "San Francisco"
- Returns: 30 dev agencies in SF Bay Area (not generic global results)

**Implementation Time**: ~4-6 hours

---

## Combined Effect

### Current State
- **Query**: "Find companies matching: Founders, Developers, Project Managers"
- **Results**: 35 companies (mostly famous brands like Zapier, Figma, Xero)
- **Quality**: Low specificity, hard to reach, may not be actual customers

### After Phase 1 (Multi-Pass)
- **Query 1**: "What verticals would buy PM tools?" → [Dev Agencies, SaaS Startups, Design Studios, E-commerce, Mobile Apps]
- **Query 2-6**: "Find 10 companies in each vertical"
- **Results**: 50 companies across 5 specific niches
- **Quality**: Higher specificity, still some famous names

### After Phase 2 (User Selection + Geography)
- **UI**: User selects "Dev Agencies" + "San Francisco"
- **Query**: "Find 30 dev agencies in San Francisco Bay Area with 10-200 employees"
- **Results**: 30 highly specific, local companies
- **Quality**: Very high specificity, reachable, likely actual customers

---

## Technical Implementation Notes

### API Cost Considerations
- **Current**: 1 API call per search (~$0.002)
- **Multi-Pass**: 6 API calls per search (~$0.012)
- **Mitigation**: Cache vertical extraction results, reuse for similar ICPs

### Performance
- **Current**: ~60-80 seconds per search
- **Multi-Pass**: ~60-90 seconds (parallel calls, minimal impact)
- **User Selector**: ~40-60 seconds (more focused search)

### Data Quality
- AI-generated companies may include:
  - ✅ Real companies AI "knows" about
  - ❌ Hallucinated/outdated companies
  - ❌ Companies that no longer exist

**Mitigation**: Add domain verification step (check DNS/HTTP response)

---

## Success Metrics

### Phase 1 Success Criteria
- [ ] Increase unique companies found: 35 → 50+
- [ ] Reduce % of "household name" companies: 80% → 40%
- [ ] Improve diversity across verticals: 1-2 types → 5+ types

### Phase 2 Success Criteria
- [ ] User satisfaction: "These companies make sense" > 80%
- [ ] Reduce irrelevant results: <10% mis-targeted companies
- [ ] Geographic accuracy: >90% of companies match selected region

---

## Next Steps

1. **Immediate**: Implement Phase 1 (Multi-Pass Refinement)
2. **This Week**: Test with 5-10 different ICPs, measure quality improvement
3. **Next Week**: Design + implement Phase 2 (Vertical Selector UI)
4. **Future**: Consider Phase 3 (Data API integration for validation)

---

## Related Files
- `backend/src/services/candidateSourcing.ts` - Main discovery logic
- `backend/src/services/companyScoring.ts` - Scoring algorithm
- `frontend/src/app/discover/summary/page.tsx` - Discovery UI (will add vertical selector)

## Change Log
- **2025-10-02**: Initial analysis and solution proposals
- **Pending**: Implementation of multi-pass refinement
