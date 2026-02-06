/**
 * EFFECTS MANAGER
 * Production-grade visual + audio + haptic effects.
 * Phase 3: Enhanced haptic patterns with streak-aware feedback.
 */

class EffectsManager {
  constructor(config = {}) {
    this.config = {
      enableConfetti: config.enableConfetti ?? true,
      enableParticles: config.enableParticles ?? true,
      enableAudio: config.enableAudio ?? true,
      enableHaptic: config.enableHaptic ?? true,
      confettiCount: config.confettiCount ?? (this._isMobile() ? 25 : 50),
      particleCount: config.particleCount ?? 8,
      hapticIntensity: config.hapticIntensity ?? 1.0, // 0.5-1.5
      ...config
    };

    // Memory-safe timer registry
    this._activeTimers = new Set();
    this._activeElements = new WeakSet();
    this._rafHandles = new Set();
    this._isDestroyed = false;

    // Motivational phrases (localization-ready)
    this.phrases = config.phrases || MOTIVATIONAL_PHRASES_RU;

    // Audio manager
    this._audio = new AudioEffectsManager({
      enabled: this.config.enableAudio,
      volume: config.audioVolume ?? 0.5
    });

    // Haptic manager with intensity scaling
    this._haptic = new HapticFeedback({
      enabled: this.config.enableHaptic,
      intensityScale: this.config.hapticIntensity
    });

    // Aurora effect manager
    this._aurora = new AuroraEffect();

    // Note: CSS now loaded from assets/css/effects.css (not injected)
  }

  /**
   * Load audio files (call after init)
   */
  async loadAudioAssets(sounds) {
    const promises = Object.entries(sounds).map(([name, url]) => 
      this._audio.loadSound(name, url)
    );
    await Promise.all(promises);
  }

  /**
   * Memory-safe setTimeout with auto-cleanup
   */
  _setTimeout(callback, delay) {
    if (this._isDestroyed) return null;

    const timerId = setTimeout(() => {
      this._activeTimers.delete(timerId);
      !this._isDestroyed && callback();
    }, delay);

    this._activeTimers.add(timerId);
    return timerId;
  }

  /**
   * Launch confetti with DocumentFragment (1 reflow vs 50)
   */
  launchConfetti() {
    if (!this.config.enableConfetti || this._isDestroyed) return;

    const fragment = document.createDocumentFragment();
    const colors = ['#0A84FF', '#30D158', '#FFD60A', '#FF375F', '#BF5AF2'];
    const count = this.config.confettiCount;

    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.cssText = `
        left: ${Math.random() * 100}vw;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        animation-delay: ${Math.random() * 0.3}s;
        animation-duration: ${Math.random() * 2 + 2}s;
      `;
      fragment.appendChild(confetti);

      this._activeElements.add(confetti);
      this._setTimeout(() => {
        confetti.remove();
        this._activeElements.delete(confetti);
      }, 3000);
    }

    // Single reflow
    document.body.appendChild(fragment);
    window.debugEffects && window.debugEffects('confetti', { count });
  }

  /**
   * Particle burst with DocumentFragment
   */
  createParticleBurst(container) {
    if (!this.config.enableParticles || !container || this._isDestroyed) return;

    const fragment = document.createDocumentFragment();
    const count = this.config.particleCount;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.setProperty('--angle', `${(360 / count) * i}deg`);
      fragment.appendChild(particle);

      this._activeElements.add(particle);
      this._setTimeout(() => {
        particle.remove();
        this._activeElements.delete(particle);
      }, 600);
    }

    container.appendChild(fragment);
    window.debugEffects && window.debugEffects('particles', { count });
  }

  /**
   * Get contextual motivational phrase
   */
  getMotivationalPraise(context) {
    const { streak, accuracy, questionsAnswered } = context;

    let category;
    if (streak >= 5) {
      category = 'streak';
    } else if (accuracy >= 0.85 && questionsAnswered >= 3) {
      category = 'accuracy';
    } else {
      category = 'random';
    }

    const phrases = this.phrases[category];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    window.debugEffects && window.debugEffects('motivational', { category, phrase });
    return phrase;
  }

  /**
   * Orchestrator for success effects (visual + audio + haptic)
   * Enhanced with streak-aware haptic patterns
   */
  triggerSuccessEffects(streak, container) {
    if (this._isDestroyed) return;

    // Aurora particles (replaces green flash)
    if (container) {
      this._aurora.trigger(container);
    }

    // Audio feedback
    if (streak >= 5) {
      this._audio.play('milestone');
    } else {
      this._audio.play('correct');
    }

    // Enhanced haptic feedback with streak awareness
    this._triggerSuccessHaptic(streak);

    // Confetti on milestones
    if ([5, 10, 15, 20].includes(streak)) {
      this.launchConfetti();
      // Extra haptic for milestone
      this._setTimeout(() => this._haptic.vibrate('notification'), 100);
    }

    // Particles on combos (keep old burst for variety)
    if (streak >= 3) {
      this.createParticleBurst(container);
    }
  }

  /**
   * Streak-aware haptic pattern selection
   */
  _triggerSuccessHaptic(streak) {
    if (streak >= 10) {
      // Epic streak: celebration pattern
      this._haptic.vibrate('milestone');
    } else if (streak >= 5) {
      // Good streak: double-tap
      this._haptic.vibrate('streak');
    } else if (streak >= 3) {
      // Building momentum: impact
      this._haptic.vibrate('impact');
    } else {
      // Standard: light success
      this._haptic.vibrate('success');
    }
  }

  /**
   * Trigger error effects with professional haptic
   */
  triggerErrorEffects() {
    if (this._isDestroyed) return;

    // Audio
    this._audio.play('error');
    
    // Haptic: heavy error pattern (100ms single buzz)
    this._haptic.vibrate('error');
  }

  /**
   * Trigger warning effects (e.g., time running out)
   */
  triggerWarningEffects() {
    if (this._isDestroyed) return;
    
    this._haptic.vibrate('timeWarning');
    window.debugEffects && window.debugEffects('warning_triggered');
  }

  /**
   * Trigger UI interaction feedback
   */
  triggerButtonPress() {
    if (this._isDestroyed) return;
    this._haptic.vibrate('tick');
  }

  /**
   * Test all haptic patterns (debug utility)
   */
  testHaptics() {
    return this._haptic.test();
  }

  /**
   * Get haptic info
   */
  getHapticInfo() {
    return this._haptic.getInfo();
  }

  /**
   * Cleanup: critical for memory safety
   */
  destroy() {
    this._isDestroyed = true;

    // Clear all pending timers
    this._activeTimers.forEach(id => clearTimeout(id));
    this._activeTimers.clear();

    // Cancel RAF
    this._rafHandles.forEach(handle => cancelAnimationFrame(handle));
    this._rafHandles.clear();

    // Cleanup audio + haptic
    this._audio.destroy();
    this._haptic.destroy();

    window.debugEffects && window.debugEffects('destroyed');
  }

  /**
   * Mobile detection for adaptive scaling
   */
  _isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }
}

// Motivational phrases config (localization-ready)
const MOTIVATIONAL_PHRASES_RU = {
  streak: [
    'Огонь! 🔥 Не останавливайся!',
    'Отлично! Продолжай в том же духе!',
    'Ты в ударе! Вперёд к победе!',
    'Превосходно! Ещё немного!',
    'Невероятная серия! 🏆'
  ],
  accuracy: [
    'Молодчина! Ещё чуть-чуть и ты станешь профи!',
    'Отличная работа! Так держать!',
    'Прекрасно! Ты быстро учишься!',
    'Великолепно! Ты на верном пути!'
  ],
  random: [
    'Правильно! ✅',
    'Точно! 🎯',
    'Супер! ⭐',
    'Класс! 👏',
    'Браво! 🎉'
  ]
};
