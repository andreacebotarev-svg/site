# 🎮 English Trainers

**Interactive grammar practice** with game-based learning, adaptive difficulty, and professional haptic feedback.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://andreacebotarev-svg.github.io/english-trainers/)
[![Version](https://img.shields.io/badge/version-3.0.0-blue)](https://github.com/andreacebotarev-svg/english-trainers/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/andreacebotarev-svg/english-trainers.git

# Open in browser (no build step required)
open index.html
```

**Live demo:** [https://andreacebotarev-svg.github.io/english-trainers/](https://andreacebotarev-svg.github.io/english-trainers/)

---

## 🎯 Mixed Tenses Demo

### Level Progression Example

```
Level 1: Basics (+) → Gap Fill & Choice only
├── 5x Present Simple: "She ___ to school." → [goes]
├── 5x Present Continuous: "They ___ playing." → [are]
└── 5x Present Perfect: "I ___ finished." → [have]

Level 2: Negation (-)
├── 5x PS Negative: "He ___ play tennis." → [doesn't]
├── 5x PC Negative: "She ___ sleeping now." → [isn't]
└── 5x PP Negative: "They ___ visited Paris." → [haven't]

Level 3: Questions (?)
├── 5x PS Questions: "___ she like pizza?" → [Does]
├── 5x PC Questions: "___ he working?" → [Is]
└── 5x PP Questions: "___ you eaten?" → [Have]

Exam Mode: 60 Questions (20+/20-/20?)
├── Random tense selection
├── Strict type distribution
└── Time pressure for certification
```

### Find Error Mode Examples

**Present Simple Error:**
```
Find the mistake:
Do she do?
[Do] [she] [do?]  ← Click "Do" (should be "Does")
```

**Present Continuous Error:**
```
Find the mistake:
The cat are sleeping now.
[The cat] [are] [sleeping] [now.]  ← Click "are" (should be "is")
```

**Present Perfect Error:**
```
Find the mistake:
She have visited London.
[She] [have] [visited] [London.]  ← Click "have" (should be "has")
```

---

## 🎯 Available Trainers

### 🔵 To Be Trainer
- **Focus:** am/is/are forms with 5 question types
- **Difficulty:** Manual control (0/Easy/Medium/Hard) + Auto mode
- **Timer:** Optional 10s/15s/30s challenges
- **Features:** Pronoun agreement, contractions, question transformations
- **Effects:** Aurora particles, adaptive haptics, milestone celebrations

### 🟢 Present Simple Trainer
- **Focus:** Subject-verb agreement with do/does
- **Verbs:** 18 irregular verbs (go→goes, have→has, study→studies)
- **Forms:** Positive, negative, question
- **Difficulty:** Auto-scaling (easy→medium→hard based on 75%/85% accuracy)
- **Effects:** Northern lights particles, streak-aware haptics

### 🟣 Have/Have Got Trainer
- **Focus:** British possession forms (have got/has got)
- **Vocabulary:** 45+ items (family, pets, objects, abilities)
- **Structures:** Both "have got" and "have" with do/does
- **Features:** Negative forms (haven't/hasn't), questions
- **Effects:** Canvas glow animations, professional haptic patterns

### 🎯 Mixed Tenses Master
- **Focus:** All 3 present tenses together (Simple/Continuous/Perfect)
- **Levels:** 5 progressive levels (basics → negative → questions → exam)
- **Task Types:** Gap Fill, Choice, Find Error (grammar correction)
- **Features:** Smart quota balancing, adaptive difficulty, exam mode
- **Grammar Coverage:** Subject-verb agreement, auxiliary verbs, irregular forms
- **Effects:** Full aurora + haptic + audio integration
- **Completion:** 60 questions in exam mode (20+/20-/20?)

---

## ✨ Visual & Haptic System

### 🌌 Aurora Effect (Canvas-based)
Replaces static green flash with **northern lights particles**:

```javascript
// Dynamic particle system
- 30 particles (20 on mobile) with random colors
- Cyan/blue/purple/green color palette  
- Glow effect via ctx.shadowBlur = 15
- Wave trails for depth
- Auto-cleanup after 1.5s
- 60fps RAF animation loop
```

### 📳 Haptic Feedback (Android-grade)
**Material Design 3 compliant** vibration patterns:

```javascript
// Streak-aware feedback
streak >= 10 → milestone  [30,50,30,50,30,50]ms  // 🏆 Triple celebration
streak 5-9   → streak     [20,30,20,30,20]ms     // 🔥 Double-tap power
streak 3-4   → impact     [50]ms                 // ⚡ Medium buzz
streak 1-2   → success    [30]ms                 // ✅ Light tap
error        → error      [100]ms                // ❌ Heavy fail state
```

**Platform optimization:**
- **Android:** Full multi-tap pattern support
- **iOS:** Single pulse (iOS API limitation, sums duration)
- **Windows Phone:** Single vibration fallback

**Features:**
- Debouncing (50ms min interval)
- Intensity scaling (0.5-1.5x multiplier)
- Background prevention (`visibilityState` check)
- Device capability detection
- 13 predefined patterns + custom builder

### 🎊 Milestone Effects
- **Streak ≥3:** Aurora + particle burst (layered)
- **Streak 5/10/15/20:** Aurora + confetti explosion + extra haptic
- **Audio:** `correct.mp3` / `milestone.mp3` / `error.mp3`

---

## 🏛️ Architecture

### Core Design Patterns

#### 1. Template Method Pattern
```javascript
class Trainer {
  generateQuestion() { throw new Error('Implement in child'); }
  start() { /* inherited */ }
  submitAnswer(index) { /* inherited */ }
}

class PresentSimpleTrainer extends Trainer {
  generateQuestion() {
    return { question: '...', options: [...], correctIndex: 0 };
  }
}
```

#### 2. State Machine
```
IDLE → PLAYING → FEEDBACK → GAME_OVER
         ↑           ↓
         ←───────────┘
```

#### 3. Effects Orchestrator
```javascript
class EffectsManager {
  constructor() {
    this._aurora = new AuroraEffect();           // Visual
    this._audio = new AudioEffectsManager();     // Sound
    this._haptic = new HapticFeedback();         // Vibration
  }
  
  triggerSuccessEffects(streak, container) {
    this._aurora.trigger(container);
    this._triggerSuccessHaptic(streak);          // Adaptive intensity
    if (streak >= 5) this._audio.play('milestone');
  }
}
```

#### 4. Haptic Engine
```javascript
class HapticFeedback {
  _detectCapabilities() {
    return {
      platform: 'android',                       // Auto-detect
      supported: 'vibrate' in navigator,
      hasHapticEngine: true
    };
  }

  _optimizeForPlatform(pattern) {
    if (platform === 'ios') {
      return [pattern.reduce((sum, val) => sum + val)]; // Single pulse
    }
    return pattern;                               // Multi-tap on Android
  }
}
```

#### 5. Mixed Tenses Strategy Pattern
```javascript
// Level configuration with quotas and constraints
export const LEVELS = {
  1: {
    id: 1,
    title: "Level 1: Basics",
    quota: { PS: 5, PC: 5, PP: 5 },           // Tense distribution
    allowedTypes: ['affirmative'],              // Sentence types
    allowedTasks: ['gap', 'choice']             // Task types
  },
  'exam': {
    id: 'exam',
    mode: 'strict_count',                       // Special mode
    totalQuota: { affirmative: 20, negative: 20, question: 20 }
  }
};

// Generator aggregator dispatches to specific tense generators
export function generateMixedQuestion(tense, type, taskType) {
  switch(tense) {
    case 'present-simple': return generatePS(type, taskType);
    case 'present-continuous': return generatePresentContinuous(type, taskType);
    case 'present-perfect': return generatePresentPerfect(type, taskType);
  }
}
```

#### 6. Shared Verb Database
```javascript
// assets/js/generators/utils/verbs.js
export const VERBS = [
  { base: "do", v2: "did", v3: "done", ing: "doing", trans: "делать" },
  { base: "go", v2: "went", v3: "gone", ing: "going", trans: "идти" },
  // ... 50+ verbs with all forms
];

export const SUBJECTS = [
  { text: "I", type: "I" },
  { text: "You", type: "pl" },
  { text: "She", type: "sg" },
  // ... complete subject set
];

export function getRandom(arr) { /* ... */ }
export function getAux(tense, subjectType, isNegative = false) { /* ... */ }
```

---

## 📁 Project Structure

```
english-trainers/
├── index.html                  # Hub page with trainer cards
├── to-be.html                  # To Be trainer
├── present-simple.html         # Present Simple trainer
├── have-got.html               # Have Got trainer
├── mixed-tenses.html           # Mixed Tenses Master ⭐ NEW
├── assets/
│   ├── css/
│   │   ├── core.css            # CSS variables, reset
│   │   ├── components.css      # Buttons, cards, stats
│   │   ├── trainers.css        # Trainer layouts
│   │   ├── mixed-tenses.css    # Mixed Tenses specific styles ⭐ NEW
│   │   └── effects.css         # Confetti, particles, animations
│   ├── js/
│   │   ├── effects/
│   │   │   ├── AuroraEffect.js         # Canvas particle system ⭐
│   │   │   ├── HapticFeedback.js       # Android-grade haptics ⭐
│   │   │   ├── EffectsManager.js       # Effect orchestrator
│   │   │   └── AudioEffectsManager.js  # Sound system
│   │   ├── generators/
│   │   │   ├── utils/
│   │   │   │   └── verbs.js            # Shared verb database ⭐ NEW
│   │   │   ├── present-simple/         # PS question generators (refactored)
│   │   │   ├── present-continuous/     # PC question generators ⭐ NEW
│   │   │   ├── present-perfect/        # PP question generators ⭐ NEW
│   │   │   └── mixed/                  # Mixed tenses logic ⭐ NEW
│   │   │       ├── strategies.js       # Level configurations ⭐ NEW
│   │   │       └── index.js            # Generator aggregator ⭐ NEW
│   │   ├── modules/
│   │   │   ├── to-be.js                # ToBeTrainer class
│   │   │   ├── present-simple.js       # PresentSimpleTrainer
│   │   │   ├── have-got.js             # HaveGotTrainer
│   │   │   └── mixed-tenses.js         # MixedTensesTrainer ⭐ NEW
│   │   ├── trainer-core.js             # Base Trainer class
│   │   ├── trainer-ui.js               # DOM rendering (RAF-batched)
│   │   ├── trainer-timer-tts.js        # Timer + Text-to-Speech
│   │   └── trainer-dom-events-utils.js # Event system
│   └── audio/
│       ├── correct.mp3                 # Success sound
│       ├── milestone.mp3               # Streak celebration
│       └── error.mp3                   # Wrong answer
└── README.md
```

---

## 🔧 Adding a New Trainer

### Step 1: Create Module
```javascript
// assets/js/modules/your-trainer.js
class YourTrainer extends Trainer {
  constructor(config = {}) {
    super({ name: 'Your Trainer', maxLives: 3, ...config });
    this.data = [...];
  }
  
  generateQuestion() {
    return {
      question: 'Your question text',
      options: ['A', 'B', 'C'],
      correctIndex: 1,
      metadata: { hint: 'Grammar rule here' }
    };
  }
}
```

### Step 2: Create HTML Page
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Your Trainer | English Trainers</title>
  <link rel="stylesheet" href="assets/css/core.css">
  <link rel="stylesheet" href="assets/css/components.css">
  <link rel="stylesheet" href="assets/css/trainers.css">
  <link rel="stylesheet" href="assets/css/effects.css">
</head>
<body>
  <div id="question-container"></div>
  
  <!-- Load effects first (dependency order) -->
  <script src="assets/js/effects/AuroraEffect.js"></script>
  <script src="assets/js/effects/AudioEffectsManager.js"></script>
  <script src="assets/js/effects/HapticFeedback.js"></script>
  <script src="assets/js/effects/EffectsManager.js"></script>
  
  <!-- Load trainer core -->
  <script src="assets/js/trainer-core.js"></script>
  <script src="assets/js/trainer-ui.js"></script>
  <script src="assets/js/trainer-timer-tts.js"></script>
  <script src="assets/js/trainer-dom-events-utils.js"></script>
  
  <!-- Load your module -->
  <script src="assets/js/modules/your-trainer.js"></script>
  
  <script>
    window.trainer = new YourTrainer({
      hapticIntensity: 1.2  // Optional: boost haptics
    });
    trainer.init();
    
    // Load audio
    trainer._effects.loadAudioAssets({
      correct: 'assets/audio/correct.mp3',
      milestone: 'assets/audio/milestone.mp3',
      error: 'assets/audio/error.mp3'
    });
  </script>
</body>
</html>
```

### Step 3: Add to Hub
Edit `index.html`:
```html
<a href="your-trainer.html" class="trainer-card">
  <span class="trainer-icon">🔴</span>
  <h2>Your Trainer</h2>
  <p>Grammar focus description</p>
</a>
```

---

## 🔧 Adding a Mixed Tenses Generator

### Step 1: Create Tense Generator
```javascript
// assets/js/generators/present-continuous/index.js
import { VERBS, SUBJECTS, getRandom, getAux } from '../utils/verbs.js';

export function generatePresentContinuous(sentenceType, taskType) {
  const verb = getRandom(VERBS);
  const subject = getRandom(SUBJECTS);

  if (taskType === 'gap') {
    const aux = getAux('continuous', subject.type);
    const question = `${subject.text} ___ ${verb.ing} now.`;
    const options = [aux, getWrongAux(aux), 'will', 'would'];
    return { type: 'gap', question, options, correct: aux };
  }

  if (taskType === 'find_error') {
    // Error: wrong auxiliary
    const wrongAux = getWrongAux(getAux('continuous', subject.type));
    const options = [
      { text: subject.text, correct: false },
      { text: wrongAux, correct: true },      // ERROR
      { text: verb.ing, correct: false },
      { text: 'now.', correct: false }
    ];
    const fullSentence = options.map(opt => opt.text).join(' ');
    return { type: 'find_error', question: fullSentence, options };
  }
}
```

### Step 2: Update Mixed Aggregator
```javascript
// assets/js/generators/mixed/index.js
import { generatePresentContinuous } from '../present-continuous/index.js';

export function generateMixedQuestion(tense, type, taskType) {
  switch(tense) {
    case 'present-simple': return generatePS(type, taskType);
    case 'present-continuous': return generatePresentContinuous(type, taskType);
    case 'present-perfect': return generatePresentPerfect(type, taskType);
  }
}
```

### Step 3: Add to Strategies
```javascript
// assets/js/generators/mixed/strategies.js
export const LEVELS = {
  2: {
    id: 2,
    title: "Level 2: Continuous Focus",
    quota: { PC: 8, PS: 4, PP: 4 },        // More continuous practice
    allowedTypes: ['affirmative', 'negative'],
    allowedTasks: ['gap', 'choice', 'error']
  }
};
```

### Step 4: Add Verb Forms to Database
```javascript
// assets/js/generators/utils/verbs.js
export const VERBS = [
  // Add new verbs with all required forms
  { base: "run", v2: "ran", v3: "run", ing: "running", trans: "бегать" },
  { base: "write", v2: "wrote", v3: "written", ing: "writing", trans: "писать" },
  // ... existing verbs
];
```

---

## ⚡ Performance Optimizations

### 1. RAF Batching
DOM updates grouped into single frame:
```javascript
_scheduleUpdate(component) {
  this._pendingUpdates.add(component);
  if (!this._rafHandle) {
    this._rafHandle = requestAnimationFrame(() => this._flushUpdates());
  }
}
```

### 2. Lazy DOM Cache
```javascript
_cacheDOMElements() {
  this._dom = {
    score: document.getElementById('score'),
    lives: document.getElementById('lives')
  }; // Cached once on init
}
```

### 3. Mobile Particle Reduction
```javascript
const count = window.matchMedia('(max-width: 768px)').matches ? 20 : 30;
```

### 4. Memory-Safe Cleanup
```javascript
_destroy() {
  if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  if (this.canvas) this.canvas.remove();
  this.particles = [];
}
```

### 5. Haptic Debouncing
```javascript
if ((Date.now() - this._lastVibration) < 50) return; // Skip rapid calls
```

---

## 🎨 Features

✅ **Aurora Effects** — Northern lights particles on correct answers
✅ **Android-grade Haptics** — Material Design 3 vibration patterns
✅ **Streak-aware Feedback** — Dynamic intensity (light→impact→celebration)
✅ **Platform Detection** — iOS/Android/Windows optimization
✅ **Adaptive Difficulty** — Auto-scales based on 75%/85% accuracy thresholds
✅ **Lives System** — 3 hearts, game over on 0
✅ **Timer Challenges** — Optional 10s/15s/30s time limits
✅ **Audio Feedback** — Correct/milestone/error sounds
✅ **Confetti Celebrations** — Milestone explosions (5/10/15/20 streaks)
✅ **Grammar Tips** — Context-aware explanations
✅ **Mixed Tenses Master** — Complete Present Simple/Continuous/Perfect trainer ⭐ NEW
✅ **Progressive Levels** — 5 levels from basics to exam mode ⭐ NEW
✅ **Find Error Mode** — Grammar correction with full sentence context ⭐ NEW
✅ **Smart Quota System** — Balanced tense distribution per level ⭐ NEW
✅ **Exam Mode** — 60 questions (20+/20-/20?) for certification ⭐ NEW
✅ **Modular Generators** — ES6 architecture with shared verb database ⭐ NEW
✅ **Accessibility** — ARIA labels, semantic HTML
✅ **Responsive** — Mobile-first design (480px breakpoint)
✅ **Zero Dependencies** — Pure vanilla JS
✅ **Memory-safe** — Automatic cleanup, no leaks  

---

## 🛠️ Tech Stack

- **Vanilla JS (ES6+)** — Classes, arrow functions, destructuring
- **Canvas API** — Aurora particle rendering with shadowBlur
- **Vibration API** — Material Design 3 haptic patterns
- **Web Audio API** — Sound effects with preloading
- **CSS Variables** — Dynamic theming
- **CSS Grid/Flexbox** — Responsive layouts
- **RequestAnimationFrame** — 60fps animations
- **WeakSet/WeakMap** — Memory-efficient DOM tracking

---

## 📝 Recent Updates

### v3.0.0 (Jan 2026) - Mixed Tenses Revolution
- 🎯 **Mixed Tenses Master** — Comprehensive 3-tense trainer (Simple/Continuous/Perfect)
- 📚 **5 Progressive Levels** — From basics to exam mode (60 questions)
- 🔍 **Find Error Mode** — Grammar correction with full sentence context
- 🏗️ **Modular Architecture** — ES6 generators with shared verb database
- 🎮 **Smart Quota System** — Balanced tense distribution per level
- 📊 **Exam Mode** — Strict count mode (20+/20-/20?) for final testing
- 🔧 **Generator Refactor** — Present Simple rewritten, PC/PP enhanced
- 🎨 **UI Improvements** — Better question rendering, hover effects
- 🐛 **Critical Bug Fixes** — Find Error sentence display, ESM compatibility

### v2.2.0 (Dec 2025)
- 🎮 **Professional Haptics** — Android-grade patterns with platform detection
- 📳 Streak-aware vibration intensity (light→impact→milestone)
- 🔧 Debouncing (50ms) + intensity scaling (0.5-1.5x)
- 🎯 13 predefined patterns + custom builder API
- 🔊 Error sound integration (`error.mp3` on mistakes)
- 🐛 iOS optimization (single pulse instead of multi-tap)

### v2.1.0 (Dec 2025)
- ✨ **Aurora Effect System** — Canvas-based northern lights particles
- 🎨 Replaced green flash with dynamic glow animations
- 📱 Mobile optimization (20 particles vs 30 desktop)
- 🧹 Auto-cleanup after 1.5s to prevent memory leaks

### v2.0.0 (Nov 2025)
- 🎮 Modular effects system (Audio/Haptic/Visual)
- 🏗️ Refactored generators into separate files
- ⚡ RAF batching for DOM updates
- 🎯 Auto-difficulty scaling for Present Simple

---

## 🧪 Testing & Debugging

### Haptic Testing
```javascript
// In browser console (requires mobile device or emulator)
trainer._effects.testHaptics();  // Cycles through all patterns

// Check capabilities
trainer._effects.getHapticInfo();
/* Returns:
{
  enabled: true,
  capabilities: { platform: 'android', supported: true, hasHapticEngine: true },
  patterns: ['light', 'success', 'error', 'milestone', ...],
  intensityScale: 1.0
}
*/

// Manual pattern test
trainer._effects._haptic.vibrate('milestone'); // Triple-tap
trainer._effects._haptic.vibrate([50, 30, 50]); // Custom pattern
```

### Aurora Effect Testing
```javascript
// Trigger on any element
const btn = document.querySelector('.option');
new AuroraEffect().trigger(btn);

// Check canvas creation
$0.querySelector('canvas'); // Should exist during animation
```

### Debug Hooks
```javascript
// Enable debug logging
window.debugEffects = (event, data) => {
  console.log(`[Effects] ${event}`, data);
};

// Events logged:
// - haptic_init, haptic, haptic_debounced
// - aurora_particles, confetti, particles
// - motivational, audio_played
```

### Mixed Tenses Testing
```javascript
// Test level strategy
const trainer = new MixedTensesTrainer(2);
console.log('Level 2 quota:', trainer.config.quota);
console.log('Allowed types:', trainer.config.allowedTypes);

// Test question generation
trainer.initLevel(1);
const question = await trainer.generateQuestion();
console.log('Generated question:', question);

// Test tense balancing
for(let i = 0; i < 20; i++) {
  const params = trainer.getNextParams();
  console.log(`Question ${i+1}:`, params);
}

// Test exam mode
const examTrainer = new MixedTensesTrainer('exam');
console.log('Exam config:', examTrainer.config);
```

---

## 📝 License

MIT © [andreacebotarev-svg](https://github.com/andreacebotarev-svg)

---

## 🤝 Contributing

PRs welcome! To add a new trainer:

1. Fork the repo
2. Create module in `assets/js/modules/`
3. Follow existing trainer patterns
4. Test on mobile + desktop
5. Submit PR with:
   - Demo GIF/video showing effects
   - Grammar focus description
   - Question count estimate
   - Haptic test results on real device

**Development tips:**
- Load `AuroraEffect.js` before `EffectsManager.js`
- Use `window.debugEffects` for event logging
- Test haptics on real Android device (not emulator)
- Verify particle count on mobile (Chrome DevTools device mode)
- Check memory leaks with Chrome Performance profiler

---

## 📧 Contact

- **Issues:** [GitHub Issues](https://github.com/andreacebotarev-svg/english-trainers/issues)
- **Email:** andreacebotarev@gmail.com
- **Live Demo:** [https://andreacebotarev-svg.github.io/english-trainers/](https://andreacebotarev-svg.github.io/english-trainers/)

---

## 🎓 Educational Use

Free for:
- Personal learning
- Classroom teaching
- Educational institutions
- Open-source projects

Commercial use requires attribution.

---

## 🙏 Acknowledgments

- **Material Design 3** — Haptic pattern timings
- **Canvas API** — Particle rendering inspiration
- **Android Vibrator** — Pattern design reference
