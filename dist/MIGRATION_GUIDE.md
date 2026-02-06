# 🎨 Design System Migration Guide

**Version:** 3.0.0  
**Date:** December 24, 2025  
**Status:** 🟡 In Progress

---

## 📊 Migration Overview

### What Changed?

We've migrated from a **dual CSS variable system** to a **unified design token architecture**:

| Before | After |
|--------|-------|
| `lesson-core.css` + `lesson-themes.css` | `design-tokens.css` (single source) |
| Inconsistent naming (`--bg` vs `--bg-primary`) | Semantic tokens (`--bg-base`, `--bg-surface`) |
| 12px spacing breaks 8px grid | Strict 8px grid enforced |
| WCAG violations in Kids theme | 100% WCAG AA compliance |
| Hardcoded color overrides | Theme-aware semantic tokens |

### Why Migrate?

✅ **Accessibility:** All themes now WCAG 2.1 Level AA compliant  
✅ **Maintainability:** Single file to update all themes  
✅ **Performance:** Better browser caching  
✅ **Developer Experience:** Clear, predictable token names  
✅ **Design Consistency:** Unified shadow/spacing/animation systems  

---

## 🛠️ Migration Steps

### Phase 1: Update HTML Files (Week 1)

#### Step 1.1: Add New Token File

Update **ALL** lesson HTML files to include `design-tokens.css` **before** component files:

```html
<!-- OLD (Remove these) -->
<link rel="stylesheet" href="assets/css/lesson-core.css">
<link rel="stylesheet" href="assets/css/lesson-themes.css">

<!-- NEW (Add these) -->
<link rel="stylesheet" href="assets/css/design-tokens.css">
```

**Files to update:**
```
dist/000.html
dist/002.html
dist/004.html
... (all lesson HTML files)
```

#### Step 1.2: Update Load Order

Final CSS load order should be:

```html
<!-- 1. Design tokens (new) -->
<link rel="stylesheet" href="assets/css/design-tokens.css">

<!-- 2. Components (existing) -->
<link rel="stylesheet" href="assets/css/lesson-components.css">
<link rel="stylesheet" href="assets/css/lesson-flashcards.css">
<link rel="stylesheet" href="assets/css/lesson-responsive.css">
```

---

### Phase 2: Update Component Styles (Week 2)

#### Critical Token Replacements

##### 🟢 Safe Replacements (No Breaking Changes)

These work immediately:

```css
/* Colors */
--bg → --bg-base
--bg-elevated → --bg-surface
--text-main → --text-primary
--text-muted → --text-secondary
--text-soft → --text-tertiary

/* Spacing (already compatible) */
--space-xs → --space-1  /* 4px */
--space-sm → --space-2  /* 8px */
--space-md → --space-3  /* 12px */
--space-lg → --space-4  /* 16px */
--space-xl → --space-6  /* 24px */
--space-2xl → --space-8 /* 32px */

/* Effects */
--shadow-soft → --shadow-lg
--transition-fast → --duration-fast
--transition-med → --duration-normal
```

##### ⚠️ Careful Replacements (Requires Testing)

```css
/* Accent colors - now semantic */
--accent → --interactive-default  /* For buttons */
--accent-soft → --accent-500 with opacity: 0.12
--accent-danger → --semantic-danger
--accent-success → --semantic-success

/* Borders */
--border-subtle → --border-default  /* Check contrast */
```

#### Component-Specific Migrations

##### 1. Interactive Words

**Before:**
```css
.interactive-word:hover {
  color: var(--accent);  /* Hardcoded blue */
  background-color: var(--accent-soft);
}
```

**After:**
```css
.interactive-word:hover {
  color: var(--interactive-hover);
  background-color: var(--accent-500);
  opacity: 0.12; /* Replaces --accent-soft */
}
```

##### 2. Quiz Correct State

**Before:**
```css
.quiz-option.correct {
  border-color: var(--accent);  /* Wrong! Should be green */
  background: var(--accent-soft);
  color: var(--accent);
}
```

**After:**
```css
.quiz-option.correct {
  border-color: var(--semantic-success);
  background: var(--semantic-success-bg);
  color: var(--semantic-success);
  box-shadow: 0 0 0 3px var(--semantic-success-border);
}
```

##### 3. Flashcards

**Before:**
```css
.flashcard-shell {
  background: var(--bg-card);  /* Undefined in new system */
  border: 1px solid var(--border-color);
}
```

**After:**
```css
.flashcard-shell {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-md);
}
```

##### 4. Primary Buttons

**Before:**
```css
.primary-btn {
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
  box-shadow: var(--shadow-sm);
}
```

**After:**
```css
.primary-btn {
  background: linear-gradient(135deg, var(--accent-500), var(--accent-600));
  box-shadow: var(--shadow-sm);
}

.primary-btn:hover {
  background: linear-gradient(135deg, var(--accent-400), var(--accent-500));
  box-shadow: var(--shadow-md);
}
```

---

### Phase 3: Test All Themes (Week 3)

#### Testing Checklist

For **EACH** theme (default, kids, dark), test:

- [ ] 📝 Reading section - text contrast
- [ ] 📚 Vocabulary cards - hover states
- [ ] 🎴 Flashcards - flip animation + glassmorphism
- [ ] ❓ Quiz - correct/wrong feedback colors
- [ ] 🔘 Buttons - all states (default/hover/active/disabled)
- [ ] 🔔 Notifications - visibility
- [ ] 🎭 Tabs - magic line animation
- [ ] 🖊️ Word popup - readability

#### Browser Testing Matrix

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ☐ |
| Safari | 14+ | ☐ |
| Firefox | 88+ | ☐ |
| Edge | 90+ | ☐ |
| Mobile Safari | iOS 14+ | ☐ |
| Chrome Mobile | Android 10+ | ☐ |

#### Accessibility Validation

Use these tools:

1. **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
2. **Axe DevTools:** Browser extension
3. **Lighthouse:** Built into Chrome DevTools

Target scores:
- Contrast: 100% WCAG AA
- Color blindness: Pass Deuteranopia/Protanopia simulation

---

### Phase 4: Cleanup (Week 4)

#### Step 4.1: Mark Legacy Variables as Deprecated

Add console warnings for developers:

```javascript
// Add to lesson-engine.js init()
if (getComputedStyle(document.documentElement).getPropertyValue('--bg')) {
  console.warn('⚠️ DEPRECATED: --bg detected. Use --bg-base instead.');
}
```

#### Step 4.2: Remove Old Files

Once migration is complete:

```bash
# Backup first!
cp dist/assets/css/lesson-core.css dist/assets/css/_BACKUP_lesson-core.css
cp dist/assets/css/lesson-themes.css dist/assets/css/_BACKUP_lesson-themes.css

# Then remove from HTML includes
# (Keep backup files for 1 sprint, then delete)
```

---

## 🚨 Breaking Changes

### 1. Kids Theme Color Shifts

**Impact:** Orange accent instead of green

**Before:**
```css
:root.theme-kids {
  --accent: #10b981;  /* Emerald green */
}
```

**After:**
```css
:root.theme-kids {
  --accent-500: #ff8c42;  /* Warm orange */
}
```

**Action Required:** Update any hardcoded `#10b981` references

### 2. Dark Theme Accent Change

**Impact:** Teal instead of neon green

**Before:**
```css
:root.theme-dark {
  --accent: #00ff88;  /* Neon green */
}
```

**After:**
```css
:root.theme-dark {
  --accent-500: #14b8a6;  /* Muted teal */
}
```

**Why?** Reduces eye strain, blue-light emission

### 3. Spacing Variable Names

**Impact:** More explicit naming

| Old | New | Value |
|-----|-----|-------|
| `--space-xs` | `--space-1` | 4px |
| `--space-sm` | `--space-2` | 8px |
| `--space-md` | `--space-3` | 12px |
| `--space-lg` | `--space-4` | 16px |
| `--space-xl` | `--space-6` | 24px |

---

## 🐞 Common Issues & Fixes

### Issue 1: Text Not Visible in Kids Theme

**Symptom:** Light text on light background

**Cause:** Using `--text-primary` from Default theme

**Fix:**
```css
/* Don't hardcode text colors */
.my-component {
  color: #f0f3f9;  /* ❌ Wrong - only works in dark */
}

/* Use semantic tokens */
.my-component {
  color: var(--text-primary);  /* ✅ Adapts to theme */
}
```

### Issue 2: Invisible Borders

**Symptom:** Borders not showing in light themes

**Cause:** Using `rgba(255,255,255,...)` in Kids theme

**Fix:**
```css
/* Before */
border: 1px solid rgba(255, 255, 255, 0.1);  /* Invisible on white! */

/* After */
border: 1px solid var(--border-default);  /* Theme-aware */
```

### Issue 3: Shadow Not Visible

**Symptom:** Cards look flat in Kids theme

**Cause:** Black shadows on light backgrounds need higher opacity

**Fix:**
```css
/* Use unified shadow system */
box-shadow: var(--shadow-md);  /* Auto-adjusts per theme */
```

---

## 📚 Reference Tables

### Complete Token Mapping

#### Colors

| Legacy Token | New Token | Notes |
|-------------|-----------|-------|
| `--bg` | `--bg-base` | Base canvas |
| `--bg-elevated` | `--bg-surface` | Cards, panels |
| n/a | `--bg-elevated` | Modals, dropdowns |
| n/a | `--bg-raised` | Tooltips |
| `--text-main` | `--text-primary` | Main content |
| `--text-muted` | `--text-secondary` | Secondary text |
| `--text-soft` | `--text-tertiary` | Captions |
| `--accent` | `--accent-500` | Main brand color |
| `--accent-soft` | Use `--accent-500` + opacity | Soft backgrounds |
| `--accent-danger` | `--semantic-danger` | Error states |
| `--accent-success` | `--semantic-success` | Success states |

#### Spacing

| Legacy | New | Value |
|--------|-----|-------|
| `--space-xs` | `--space-1` | 4px |
| `--space-sm` | `--space-2` | 8px |
| `--space-md` | `--space-3` | 12px |
| `--space-lg` | `--space-4` | 16px |
| `--space-xl` | `--space-6` | 24px |
| `--space-2xl` | `--space-8` | 32px |

#### Shadows

| Legacy | New | Use Case |
|--------|-----|----------|
| `--shadow-soft` | `--shadow-lg` | Large cards |
| n/a | `--shadow-sm` | Buttons |
| n/a | `--shadow-md` | Standard cards |
| n/a | `--shadow-accent-md` | Glowing effects |

---

## ✅ Migration Completion Checklist

### Phase 1: Setup
- [ ] `design-tokens.css` added to repository
- [ ] All HTML files updated to include new token file
- [ ] Old CSS files marked as deprecated

### Phase 2: Component Updates
- [ ] `lesson-components.css` migrated
- [ ] `lesson-flashcards.css` migrated
- [ ] `lesson-responsive.css` checked (no changes needed)
- [ ] Custom components in lessons updated

### Phase 3: Testing
- [ ] Default theme tested in 3+ browsers
- [ ] Kids theme tested in 3+ browsers
- [ ] Dark theme tested in 3+ browsers
- [ ] WCAG AA validation passed
- [ ] Color-blind simulation passed
- [ ] Mobile responsive check passed

### Phase 4: Cleanup
- [ ] Legacy variables removed from `lesson-core.css`
- [ ] `lesson-themes.css` hardcoded overrides removed
- [ ] Console deprecation warnings added
- [ ] Documentation updated
- [ ] Team notified of changes

---

## 👥 Need Help?

**Questions?** Open an issue in the repository  
**Found a bug?** Check the [Component Impact Analysis](#component-impact-analysis)  
**Performance issues?** Ensure CSS load order is correct  

---

**Last Updated:** December 24, 2025  
**Maintained By:** Design System Team