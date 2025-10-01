# Codex Instructions: Discovery Signals Section Polish

## 🎯 Goal
Improve the legibility and visual hierarchy of the Discovery Signals sections by increasing font sizes, improving contrast, and making the content easier to scan.

---

## 📋 Current Problems

Looking at the screenshot:
1. **Font too small** - Body text is difficult to read (appears to be 14px or smaller)
2. **Poor contrast** - Gray text on light background is hard to read
3. **Weak hierarchy** - Headings don't stand out enough from body text
4. **Evidence links hard to scan** - URLs blend into surrounding text

---

## 🎨 Typography & Contrast Improvements

### Section Headers
**Current:** Appears to use `text-lg` or `text-xl` with medium weight
**New:**
```tsx
className="text-2xl font-bold text-gray-900 mb-3"
```

### Confidence Badges
**Current:** Yellow background with dark text
**Keep as-is** - This works well

### Description Text (Below heading)
**Current:** Appears small and gray
**New:**
```tsx
className="text-base text-gray-700 leading-relaxed mb-6"
```

### "Evidence:" Label
**Current:** Gray text, blends in
**New:**
```tsx
className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3"
```

### Evidence Bullet Points
**Current:** Small gray text with gray bullets
**New:**
```tsx
<ul className="space-y-2 mb-4">
  <li className="flex items-start gap-2">
    <span className="text-blue-600 font-bold mt-1">•</span>
    <span className="text-base text-gray-800">
      <span className="font-medium text-gray-600">Possible:</span>{' '}
      <a href="https://stripe.com/careers"
         className="text-blue-600 hover:text-blue-800 hover:underline"
         target="_blank"
         rel="noopener noreferrer">
        https://stripe.com/careers
      </a>
    </span>
  </li>
</ul>
```

### "Source:" Label
**Current:** Gray text at bottom
**New:**
```tsx
className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200"
```

---

## 📝 Implementation Checklist

### Step 1: Update Discovery Signals Rendering

**File:** `frontend/src/app/start/page.tsx`

Find the Discovery Signals rendering section (after ICP preview) and update typography classes:

```tsx
{discoverySignals && discoverySignals.length > 0 && (
  <div className="mt-12">
    <h2 className="text-3xl font-bold text-gray-900 mb-6">Discovery Signals</h2>

    <div className="space-y-6">
      {discoverySignals.map((signal, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          {/* Header with signal type and confidence */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-2xl font-bold text-gray-900">
              {signal.type}
            </h3>
            {signal.confidence && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                signal.confidence > 70 ? 'bg-green-100 text-green-800' :
                signal.confidence > 40 ? 'bg-yellow-100 text-yellow-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {signal.confidence}% confidence
              </span>
            )}
          </div>

          {/* Description */}
          {signal.description && (
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              {signal.description}
            </p>
          )}

          {/* Evidence Section */}
          {signal.evidence && signal.evidence.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Evidence:
              </h4>
              <ul className="space-y-2 mb-4">
                {signal.evidence.map((ev, evIdx) => (
                  <li key={evIdx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span className="text-base text-gray-800">
                      {ev.type && (
                        <span className="font-medium text-gray-600">{ev.type}:</span>
                      )}{' '}
                      {ev.url ? (
                        <a
                          href={ev.url}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {ev.value || ev.url}
                        </a>
                      ) : (
                        <span className="text-gray-800">{ev.value}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source */}
          {signal.source && (
            <div className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
              <span className="font-medium">Source:</span>{' '}
              {signal.sourceUrl ? (
                <a
                  href={signal.sourceUrl}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {signal.source}
                </a>
              ) : (
                <span>{signal.source}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
```

---

## 🎨 Design Specifications

### Typography Scale
- **Section title ("Discovery Signals")**: `text-3xl font-bold text-gray-900` (30px)
- **Signal type heading**: `text-2xl font-bold text-gray-900` (24px)
- **Description text**: `text-base text-gray-700` (16px)
- **Evidence label**: `text-sm font-semibold text-gray-900 uppercase` (14px)
- **Evidence items**: `text-base text-gray-800` (16px)
- **Source text**: `text-sm text-gray-600` (14px)

### Color Contrast
- **Primary text**: `text-gray-900` (#111827) - High contrast
- **Secondary text**: `text-gray-700` (#374151) - Medium contrast
- **Tertiary text**: `text-gray-600` (#4B5563) - Lower contrast for labels
- **Links**: `text-blue-600 hover:text-blue-800` - Clear clickable indication
- **Bullets**: `text-blue-600` - Accent color to draw eye

### Spacing
- Between signals: `space-y-6` (24px)
- Card padding: `p-6` (24px)
- Between elements: `mb-3, mb-4, mb-6` (progressive spacing)
- Evidence list spacing: `space-y-2` (8px between items)

---

## ✅ Testing Requirements

1. **Readability Test**
   - View page from 2 feet away from screen
   - All text should be comfortably readable without squinting

2. **Contrast Test**
   - Gray text on white background should have clear distinction
   - Links should be obviously clickable (blue color)

3. **Hierarchy Test**
   - Signal type heading should be largest and boldest
   - Evidence items should be clearly subordinate but still readable
   - Source should be de-emphasized but visible

4. **Link Test**
   - All URLs should be clickable
   - Hover states should show underline
   - Links open in new tab

---

## 📦 Expected Output

**Before:**
- Small gray text (~14px) on light background
- Poor visual hierarchy
- URLs not obviously clickable

**After:**
- Clear 16px base text with high contrast (gray-800/gray-900)
- Bold 24px signal headings
- Blue clickable links with hover states
- Improved spacing and breathing room
- Professional, scannable appearance

---

## 🚨 Important Notes

1. **Don't change data structure** - Only update CSS classes and HTML structure
2. **Preserve existing logic** - Keep all conditional rendering as-is
3. **Mobile responsive** - These classes should work on mobile (they're already responsive)
4. **Accessibility** - Links have proper rel attributes, good color contrast

---

**This is purely a visual polish pass - no backend changes needed.**
