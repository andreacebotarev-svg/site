# English Tutor Landing Page - Technical Documentation

> **Production URL**: [https://andreacebotarev-svg.github.io/englishlessons/](https://andreacebotarev-svg.github.io/englishlessons/)

**Tech Stack**: HTML5, CSS3 (Custom Properties), Vanilla JavaScript (ES6+), Web3Forms API, GitHub Pages

**Build**: Zero-build static site (no bundlers, no frameworks)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Design System](#design-system)
3. [Component Breakdown](#component-breakdown)
4. [Form Integration](#form-integration)
5. [Performance Optimizations](#performance-optimizations)
6. [Responsive Strategy](#responsive-strategy)
7. [File Structure](#file-structure)
8. [Deployment](#deployment)
9. [Development Guidelines](#development-guidelines)
10. [Maintenance](#maintenance)

---

## Architecture Overview

### Core Principles

**1. Mobile-First Progressive Enhancement**
- Base styles for mobile (320px+)
- Progressive enhancement for tablet (768px+) and desktop (1024px+)
- Touch-optimized interactions with fallbacks for mouse/keyboard

**2. Zero-Dependency Philosophy**
- No jQuery, React, or other frameworks
- Native Web APIs (IntersectionObserver, Fetch API, FormData)
- Modern CSS features (Grid, Flexbox, Custom Properties)
- Graceful degradation for older browsers

**3. JAMstack Architecture**
- **J**avaScript: Client-side interactivity (vanilla JS)
- **A**PIs: Web3Forms for form submissions
- **M**arkup: Static HTML served via GitHub Pages CDN

**4. Performance Budget**
- **Critical CSS**: < 50KB (inline in `<head>`)
- **JavaScript**: < 10KB (deferred, non-blocking)
- **Images**: WebP with JPEG fallbacks, lazy-loaded
- **Total page weight**: < 500KB on first load
- **Time to Interactive (TTI)**: < 3s on 3G

---

## Design System

### Visual Language

**Design Philosophy**: Glassmorphism + Neumorphism hybrid
- **Glassmorphic cards**: Semi-transparent backgrounds with backdrop blur
- **Neumorphic shadows**: Soft, layered shadows for depth
- **Gradient accents**: Subtle gradients on interactive elements

### CSS Architecture

**Methodology**: BEM-inspired with utility classes

```css
/* Component */
.card { }

/* Modifier */
.card--featured { }

/* State */
.card.is-active { }

/* Utility */
.mt-4 { margin-top: 1rem; }
```

**CSS Custom Properties (Design Tokens)**

```css
:root {
  /* Colors (HSL for easy manipulation) */
  --color-primary: 212 100% 48%;
  --color-secondary: 280 89% 70%;
  
  /* Spacing (8px base grid) */
  --space-1: 0.5rem;  /* 8px */
  --space-2: 1rem;    /* 16px */
  --space-3: 1.5rem;  /* 24px */
  --space-4: 2rem;    /* 32px */
  
  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-size-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  
  /* Shadows (layered for depth) */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
  
  /* Glass effect */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-blur: 10px;
}
```

**Dark Mode Support** (via `prefers-color-scheme`)
```css
@media (prefers-color-scheme: dark) {
  :root {
    --glass-bg: rgba(30, 30, 46, 0.8);
    --glass-border: rgba(255, 255, 255, 0.1);
  }
}
```

---

## Component Breakdown

### 1. Header (Sticky Navigation)

**File**: `index.html` (lines 18-38)

**Features**:
- Fixed positioning with backdrop blur
- Mobile hamburger menu (< 768px)
- Smooth scroll to anchor links
- Active state tracking via IntersectionObserver

**JavaScript Logic** (`main.js` lines 11-55):
```javascript
// Toggle mobile menu
navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  document.body.style.overflow = isOpen ? 'hidden' : ''; // Prevent scroll
});

// Auto-close on resize (mobile → desktop)
window.addEventListener('resize', debounce(() => {
  if (window.innerWidth >= 768) {
    closeMenu();
  }
}, 250));
```

**CSS Strategy**:
```css
.header {
  position: sticky;
  top: 0;
  backdrop-filter: blur(10px); /* Glassmorphism */
  z-index: 1000;
}

/* Mobile menu (off-canvas) */
@media (max-width: 767px) {
  .nav-links {
    position: fixed;
    inset: 0;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .nav-links.is-open {
    transform: translateX(0);
  }
}
```

---

### 2. Hero Section

**File**: `index.html` (lines 42-98)

**Layout**: CSS Grid (2-column on desktop, single-column on mobile)

**Components**:
1. **Left column**: Value proposition, CTAs, badges
2. **Right column**: Portrait + free lesson card

**Key Features**:
- **Clamp-based typography**: `font-size: clamp(2rem, 5vw, 3.5rem)`
- **Progressive image loading**: `<img loading="lazy" />`
- **Glassmorphic cards**: `.glass` class with backdrop blur

**Design Pattern**: F-Shaped Reading Flow
- Users scan left column first (headline → CTA)
- Right column provides social proof (photo + offer)

---

### 3. About Section (3-Column Grid)

**File**: `index.html` (lines 100-130)

**Grid Behavior**:
```css
.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}
```

**Benefits**:
- Auto-responsive (no media queries needed)
- Equal-height cards via Grid
- Graceful stacking on narrow viewports

---

### 4. Method Section (Asymmetric Layout)

**File**: `index.html` (lines 132-198)

**Layout**: Custom grid with 60/40 split

```css
.grid-method-split {
  display: grid;
  grid-template-columns: 1fr; /* Mobile: stack */
  gap: var(--space-6);
}

@media (min-width: 1024px) {
  .grid-method-split {
    grid-template-columns: 1.2fr 1fr; /* Desktop: 60/40 */
  }
}
```

**Components**:
1. **Left**: 4 compact cards (steps)
2. **Right**: Featured platform card (larger, accent color)

**Why This Works**: Eye naturally drawn to asymmetry → increased engagement on platform CTA

---

### 5. Qualifications Section (Lightbox Gallery)

**File**: `index.html` (lines 200-260)

**Features**:
- Certificate thumbnails (3-column grid)
- Click → opens lightbox with full image
- Keyboard navigation (Arrow keys, Escape)

**Lightbox Logic** (`index.html` script block):
```javascript
function openLightbox(index) {
  currentIndex = index;
  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Lock scroll
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});
```

**Accessibility**:
- `role="button"` on thumbnails
- `aria-label` for screen readers
- Focus management on open/close

---

### 6. Pricing Section (Card Comparison)

**File**: `index.html` (lines 262-310)

**Layout**: 3-column grid with visual hierarchy

**Hierarchy Indicators**:
1. **Free trial**: Green badge
2. **Single lesson**: Standard card
3. **Package**: "Выгодно" badge (accent color)

**Psychology**: Anchoring effect (expensive option makes middle option seem reasonable)

---

### 7. FAQ Section (Accordion Pattern - Simplified)

**File**: `index.html` (lines 312-348)

**Current**: Static 2x2 grid (most common questions always visible)

**Rationale**: 
- Reduces JavaScript complexity
- Better for SEO (all content visible)
- Faster perceived performance

**Alternative** (if needed):
```javascript
// Collapsible accordion
faqItems.forEach(item => {
  item.addEventListener('click', () => {
    item.classList.toggle('is-open');
  });
});
```

---

### 8. Lead Form (Conversion Optimization)

**File**: `index.html` (lines 350-420)

**Architecture**: Progressive enhancement with native HTML validation

**Form Strategy**:
1. **Native validation first**: `required`, `type="email"`
2. **JavaScript enhancement**: Loading states, AJAX submission
3. **Fallback**: Works even if JS fails (native form POST)

**Fields**:
- `name`: Text input (autocomplete="name")
- `email`: Text input (autocomplete="email") - Note: Using `type="text"` for flexibility (phone/email/Telegram)
- `goal`: Text input (study objectives)
- `message`: Textarea (optional details)
- `consent`: Checkbox (GDPR compliance)

**Hidden Fields** (Web3Forms config):
```html
<input type="hidden" name="access_key" value="702470cb-beb9-4faa-93e7-595495a5f4da" />
<input type="hidden" name="subject" value="🎓 Новая заявка с лендинга" />
<input type="hidden" name="from_name" value="Лендинг английского" />
<input type="hidden" name="redirect" value="https://andreacebotarev-svg.github.io/englishlessons/#lead" />
<input type="checkbox" name="botcheck" style="display: none;" /> <!-- Honeypot -->
```

**Validation UX**:
```javascript
if (!leadForm.checkValidity()) {
  leadForm.reportValidity(); // Native browser validation UI
  e.preventDefault();
  return;
}
```

**Loading States**:
```javascript
submitBtn.disabled = true;
submitBtn.classList.add('is-loading');
submitBtn.textContent = 'Отправляем...';
```

---

## Form Integration

### Web3Forms API

**Endpoint**: `https://api.web3forms.com/submit`

**Authentication**: Access Key (public, safe to expose)

**Flow**:
```
User submits form
      ↓
Native HTML POST → Web3Forms API
      ↓
Web3Forms validates & sends email
      ↓
Email arrives at andreychebotarevqw@gmail.com
      ↓
User redirected back to landing (via `redirect` field)
```

**Why Web3Forms?**
| Feature | Web3Forms | Formspree | Custom Backend |
|---------|-----------|-----------|----------------|
| Free tier | 250/month | 50/month | Unlimited |
| Setup time | 2 minutes | 5 minutes | 2+ hours |
| Russia access | ✅ No VPN | ❌ VPN needed | ✅ Depends |
| Maintenance | Zero | Zero | High |
| Email delivery | 5-10 sec | 1-5 min | Varies |

**Spam Protection**:
1. **Honeypot field**: `<input name="botcheck" style="display:none" />`
   - Bots auto-fill hidden fields → submission rejected
2. **Rate limiting**: Web3Forms limits submissions per IP
3. **CAPTCHA** (optional): Can enable hCaptcha in Web3Forms dashboard

**Email Template**:
```
From: Лендинг английского <noreply@web3forms.com>
To: andreychebotarevqw@gmail.com
Subject: 🎓 Новая заявка с лендинга englishlessons

Имя: [User input]
Email: [User input]
Цель: [User input]
Сообщение: [User input]
Согласие: [on/off]
```

---

## Performance Optimizations

### 1. Critical CSS Inlining

**Problem**: External CSS blocks rendering

**Solution**: Inline critical CSS in `<head>`, defer non-critical

```html
<head>
  <style>
    /* Critical CSS (above-the-fold) */
    .header { ... }
    .hero { ... }
  </style>
  
  <!-- Non-critical CSS (deferred) -->
  <link rel="preload" href="styles.css" as="style" onload="this.rel='stylesheet'">
</head>
```

**Current**: All CSS in `assets/css/styles.css` (single file, ~40KB)

**Potential Improvement**: Extract critical CSS with tools like Critical or Critters

---

### 2. Image Optimization

**Strategy**: Progressive JPEG → WebP with fallbacks

```html
<picture>
  <source srcset="certificate.webp" type="image/webp">
  <img src="certificate.jpg" alt="Certificate" loading="lazy" />
</picture>
```

**Lazy Loading**:
```javascript
if ('loading' in HTMLImageElement.prototype) {
  // Native lazy loading supported
} else {
  // Fallback: IntersectionObserver polyfill
}
```

**Current**: Native `loading="lazy"` on all below-the-fold images

---

### 3. JavaScript Optimization

**Deferred Loading**:
```html
<script src="main.js" defer></script>
```
- Parsed after HTML
- Non-blocking
- Executed in order

**Event Delegation**:
```javascript
// ❌ Bad: Attaches 50 listeners
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', handleClick);
});

// ✅ Good: Single listener on parent
document.addEventListener('click', (e) => {
  if (e.target.matches('.card')) {
    handleClick(e);
  }
});
```

**Debouncing**:
```javascript
window.addEventListener('resize', debounce(() => {
  // Expensive operation
}, 250));
```

---

### 4. IntersectionObserver for Animations

**Why**: More performant than scroll listeners

```javascript
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target); // Stop observing
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -30px 0px'
});
```

**Benefits**:
- Runs off main thread
- Automatically handles viewport visibility
- Battery-friendly (pauses when tab inactive)

---

### 5. Reduced Motion Support

**Accessibility**: Respect user's motion preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  // Skip animations, show content immediately
  revealElements.forEach(el => el.classList.add('is-visible'));
}
```

---

## Responsive Strategy

### Breakpoints

```css
/* Mobile-first base */
@media (min-width: 48rem)   { /* 768px - Tablet */ }
@media (min-width: 64rem)   { /* 1024px - Desktop */ }
@media (min-width: 80rem)   { /* 1280px - Wide */ }
```

**Why em-based?** Respects user's font-size preferences (accessibility)

---

### Fluid Typography

```css
.h1 {
  font-size: clamp(2rem, 5vw + 1rem, 3.5rem);
}
```

**Breakdown**:
- `2rem`: Minimum (mobile)
- `5vw + 1rem`: Preferred (scales with viewport)
- `3.5rem`: Maximum (desktop)

---

### Touch Targets

**WCAG AAA**: Minimum 44x44px

```css
.btn, .nav-links a {
  min-height: 44px;
  padding: 0.75rem 1.5rem;
}
```

---

### Layout Shifts Prevention

**Problem**: Images load → content jumps (poor CLS score)

**Solution**: Reserve space with aspect-ratio

```css
img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9; /* Prevents layout shift */
}
```

---

## File Structure

```
docs/
├── index.html              # Main landing page (26KB)
├── privacy.html            # Privacy policy (2KB)
├── favicon.ico             # Favicon
├── robots.txt              # SEO directives
├── README.md               # This file
│
├── assets/
│   ├── css/
│   │   └── styles.css      # All styles (40KB)
│   │
│   ├── js/
│   │   ├── main.js         # Core interactions (8KB)
│   │   └── platform-modal.js # Platform preview modal (2KB)
│   │
│   └── img/
│       ├── tutor-portrait.jpg     # Hero image
│       ├── certificate-01.png     # TEFL cert
│       ├── certificate-02.png     # Oxford C2
│       └── certificate-03.png     # University of London
```

**Total Size**: ~500KB (uncompressed), ~150KB (gzipped via GitHub Pages CDN)

---

## Deployment

### GitHub Pages (Current)

**Configuration**:
1. Repository: `andreacebotarev-svg/englishlessons`
2. Source: `main` branch → `/docs` folder
3. URL: `https://andreacebotarev-svg.github.io/englishlessons/`

**Deploy Process**:
```bash
# Make changes
git add docs/
git commit -m "Update landing"
git push origin main

# GitHub Actions auto-deploys in ~2 minutes
# Monitor: https://github.com/andreacebotarev-svg/englishlessons/actions
```

**CDN**: Cloudflare (via GitHub)
- Global edge caching
- Automatic gzip/brotli compression
- Free SSL (HTTPS)

---

### Alternative Hosting Options

**Netlify**:
```bash
netlify deploy --dir=docs --prod
```
- Benefits: Branch previews, form handling, serverless functions

**Vercel**:
```bash
vercel --prod
```
- Benefits: Edge functions, automatic image optimization

**Cloudflare Pages**:
- Benefits: Fastest global CDN, R2 storage integration

---

## Development Guidelines

### Code Style

**HTML**:
```html
<!-- ✅ Good: Semantic, accessible -->
<section id="about" aria-labelledby="about-heading">
  <h2 id="about-heading">About Me</h2>
</section>

<!-- ❌ Bad: Div soup -->
<div class="about-section">
  <div class="heading">About Me</div>
</div>
```

**CSS**:
```css
/* ✅ Good: Mobile-first, utility classes */
.card {
  padding: var(--space-4);
}

@media (min-width: 48rem) {
  .card { padding: var(--space-6); }
}

/* ❌ Bad: Desktop-first, magic numbers */
.card { padding: 32px; }

@media (max-width: 767px) {
  .card { padding: 16px; }
}
```

**JavaScript**:
```javascript
// ✅ Good: Declarative, early returns
function handleSubmit(e) {
  if (!form.checkValidity()) return;
  submitForm();
}

// ❌ Bad: Nested if-else
function handleSubmit(e) {
  if (form.checkValidity()) {
    submitForm();
  } else {
    // ...
  }
}
```

---

### Testing Checklist

**Browser Support**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Device Testing**:
```bash
# Local testing
python3 -m http.server 8000
# Open http://localhost:8000/docs/

# Mobile testing (Chrome DevTools)
# Emulate: iPhone SE, iPad, Pixel 5
```

**Performance**:
```bash
# Lighthouse CI
npx lighthouse https://andreacebotarev-svg.github.io/englishlessons/ --view

# Target scores:
# Performance: 95+
# Accessibility: 100
# Best Practices: 95+
# SEO: 100
```

---

## Maintenance

### Regular Tasks

**Weekly**:
- [ ] Check Web3Forms inbox (verify submissions working)
- [ ] Monitor GitHub Pages uptime

**Monthly**:
- [ ] Update certificate images (if new certs obtained)
- [ ] Review Google Analytics (if integrated)
- [ ] Check for broken links

**Quarterly**:
- [ ] Run Lighthouse audit
- [ ] Update dependencies (if any added)
- [ ] Review and optimize images

---

### Troubleshooting

**Form not working?**
1. Check Web3Forms status: [https://web3forms.com/](https://web3forms.com/)
2. Verify Access Key is correct
3. Check browser console for errors
4. Test with simple curl:
```bash
curl -X POST https://api.web3forms.com/submit \
  -d "access_key=702470cb-beb9-4faa-93e7-595495a5f4da" \
  -d "name=Test" \
  -d "email=test@example.com"
```

**Images not loading?**
1. Check file paths (case-sensitive on Linux servers)
2. Verify images exist in `docs/assets/img/`
3. Check file sizes (< 500KB recommended)

**JavaScript errors?**
1. Check `main.js` syntax
2. Verify DOM elements exist before querying
3. Test with `console.log()` debugging

---

## Future Enhancements

### Phase 2 (Nice-to-Have)

**Analytics Integration**:
```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
```

**A/B Testing**:
- Test different CTAs
- Test form field order
- Test pricing presentation

**SEO Improvements**:
```html
<!-- Structured data (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Андрей Чеботарев - Репетитор английского",
  "url": "https://andreacebotarev-svg.github.io/englishlessons/",
  "priceRange": "$$"
}
</script>
```

**PWA Support**:
```json
// manifest.json
{
  "name": "English Lessons",
  "short_name": "EngLessons",
  "start_url": "/",
  "display": "standalone",
  "icons": [...]
}
```

---

## License

Proprietary - All rights reserved.

---

## Contact

**Developer**: GitHub Copilot + andreacebotarev-svg  
**Tutor**: Андрей Чеботарев  
**Email**: andreychebotarevqw@gmail.com  
**Last Updated**: December 16, 2025
