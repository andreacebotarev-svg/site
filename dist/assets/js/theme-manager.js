/**
 * APPLE-STYLE THEME MANAGER v3.5.0
 * Theme Bar integrated into Reading tab layout
 * Removed fixed header, now renders HTML for embedding in content
 */

class ThemeManager {
  constructor() {
    // 🔥 SINGLETON ENFORCEMENT - Prevent duplicate switchers
    const existingSwitchers = document.querySelectorAll('.theme-switcher');
    if (existingSwitchers.length > 0) {
      console.warn(`[ThemeManager v3.5.0] Found ${existingSwitchers.length} existing switcher(s), removing for singleton...`);
      existingSwitchers.forEach(s => s.remove());
    }
    
    // Check for existing header to avoid duplicates
    const existingHeader = document.getElementById('theme-bar-header');
    if (existingHeader) existingHeader.remove();

    this.currentTheme = this.loadTheme();
    this.applyTheme(this.currentTheme);
    this.attachKeyboardNav();
    console.log(`[ThemeManager v3.5.0] Initialized with theme: ${this.currentTheme}`);
  }

  /**
   * Load saved theme from localStorage
   * @returns {string} Theme ID ('default', 'kids', 'dark')
   */
  loadTheme() {
    const saved = localStorage.getItem('eng-tutor-theme');
    const theme = saved || 'default';
    return theme;
  }

  /**
   * Save theme to localStorage
   * @param {string} themeId - Theme ID to save
   */
  saveTheme(themeId) {
    localStorage.setItem('eng-tutor-theme', themeId);
  }

  /**
   * Get current theme
   * @returns {string} Current theme ID
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Set and apply new theme
   * @param {string} themeId - 'default', 'kids', or 'dark'
   * @param {HTMLElement} button - Button that triggered the change (for ripple)
   */
  setTheme(themeId, button = null) {
    console.log(`[ThemeManager] Switching to theme: ${themeId}`);
    
    // Validate theme ID
    const validThemes = ['default', 'kids', 'dark'];
    if (!validThemes.includes(themeId)) {
      console.warn(`[ThemeManager] Invalid theme ID: ${themeId}. Falling back to 'default'.`);
      themeId = 'default';
    }
    
    // Remove old theme classes
    document.documentElement.classList.remove(
      'theme-default',
      'theme-kids',
      'theme-dark'
    );
    
    // Add new theme class
    document.documentElement.classList.add(`theme-${themeId}`);
    
    // Set data-theme attribute on both html and body for maximum compatibility
    document.documentElement.setAttribute('data-theme', themeId);
    document.body.setAttribute('data-theme', themeId);
    
    // Load theme-specific CSS if it exists
    this.loadThemeCSS(themeId);
    
    // Update state
    this.currentTheme = themeId;
    this.saveTheme(themeId);
    
    // Update UI
    this.updateThemeSwitcherUI(themeId);
    
    // Trigger ripple effect if button provided
    if (button) {
      this.createRipple(button);
    }
    
    // ✨ IMPROVED: Update audio buttons after theme switch using double RAF
    // This ensures CSS is applied before button update
    if (window.lessonEngine && typeof window.lessonEngine.updateAudioButtons === 'function') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.lessonEngine.updateAudioButtons();
        });
      });
    }
    
    console.log(`[ThemeManager] Theme applied: ${themeId}`);
  }

  /**
   * Apply theme on initialization (no localStorage save)
   * @param {string} themeId - Theme ID to apply
   * @private
   */
  applyTheme(themeId) {
    document.documentElement.classList.add(`theme-${themeId}`);
    document.documentElement.setAttribute('data-theme', themeId);
    document.body.setAttribute('data-theme', themeId);
    this.loadThemeCSS(themeId);
    console.log(`[ThemeManager] Initial theme applied: ${themeId}`);
  }

  /**
   * Load theme-specific CSS file
   * @param {string} themeId - Theme ID
   */
  loadThemeCSS(themeId) {
    // Remove existing theme CSS
    const existingLink = document.getElementById('theme-specific-css');
    if (existingLink) {
      existingLink.remove();
    }

    if (themeId === 'default') return;

    const link = document.createElement('link');
    link.id = 'theme-specific-css';
    link.rel = 'stylesheet';
    link.href = `assets/css/lesson-theme-${themeId}.css`;
    
    // Check if file exists before appending (optional but good)
    link.onerror = () => {
      console.warn(`[ThemeManager] Theme CSS not found: ${link.href}`);
      link.remove();
    };

    document.head.appendChild(link);
  }

  /**
   * Render theme switcher HTML string (for embedding in content)
   * iOS Segmented Control with sliding indicator
   * 
   * ✅ IMPORTANT: This method returns ONLY theme switcher buttons.
   * It does NOT contain any audio buttons or other controls.
   * Audio buttons are rendered separately via renderer.renderAudioButtons()
   * 
   * @returns {string} HTML string for theme switcher (NO audio buttons)
   */
  renderThemeSwitcherHTML() {
    const themes = [
      { id: 'default', icon: '☀️', label: 'Light' },
      { id: 'kids', icon: '🎨', label: 'Kids' },
      { id: 'dark', icon: '🌙', label: 'Dark' }
    ];

    const buttonsHTML = themes.map(theme => {
      const isActive = theme.id === this.currentTheme;
      return `
        <button class="theme-btn-apple ${isActive ? 'active' : ''}"
                data-theme="${theme.id}"
                onclick="window.lessonEngine?.themeManager?.setTheme('${theme.id}', this)"
                aria-label="Switch to ${theme.label} theme"
                ${isActive ? 'aria-pressed="true"' : ''}>
          <span class="theme-icon">${theme.icon}</span>
          <span class="theme-label">${theme.label}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="theme-switcher" 
           role="group" 
           aria-label="Theme selector"
           data-active-theme="${this.currentTheme}">
        <div class="theme-indicator"></div>
        <div class="theme-indicator-glow"></div>
        ${buttonsHTML}
      </div>
    `;
  }

  /**
   * Initialize theme switcher after it's been inserted into DOM
   * Attaches event listeners and positions indicator
   * @param {HTMLElement} switcherElement - The theme switcher DOM element
   */
  initializeThemeSwitcher(switcherElement) {
    if (!switcherElement) return;

    // Attach click handlers to buttons
    const buttons = switcherElement.querySelectorAll('.theme-btn-apple');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const themeId = btn.getAttribute('data-theme');
        this.setTheme(themeId, e.currentTarget);
      });
    });

    // Position indicator after DOM render
    requestAnimationFrame(() => {
      this.updateIndicatorPosition(this.currentTheme, false);
    });

    console.log('[ThemeManager v3.5.0] Theme switcher initialized in content');
  }

  /**
   * Update theme switcher UI (button states + indicator position)
   * @param {string} themeId - Active theme ID
   */
  updateThemeSwitcherUI(themeId) {
    const switcher = document.querySelector('.theme-switcher');
    if (!switcher) return;

    // Update data attribute for CSS
    switcher.setAttribute('data-active-theme', themeId);

    // Update button states
    switcher.querySelectorAll('.theme-btn-apple, .theme-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-theme') === themeId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
      
      // Trigger icon bounce animation for active button
      if (isActive) {
        const icon = btn.querySelector('.theme-icon');
        if (icon) {
          icon.style.animation = 'none';
          requestAnimationFrame(() => {
            icon.style.animation = '';
          });
        }
      }
    });

    // Animate indicator to new position
    this.updateIndicatorPosition(themeId, true);
  }

  /**
   * Update sliding indicator position with spring physics
   * @param {string} themeId - Target theme ID
   * @param {boolean} animated - Whether to animate the transition
   */
  updateIndicatorPosition(themeId, animated = true) {
    const switcher = document.querySelector('.theme-switcher');
    if (!switcher) return;

    const indicator = switcher.querySelector('.theme-indicator');
    const glow = switcher.querySelector('.theme-indicator-glow');
    if (!indicator || !glow) return;

    // Find active button
    const activeBtn = switcher.querySelector(`[data-theme="${themeId}"]`);
    if (!activeBtn) return;

    // Calculate position
    const switcherRect = switcher.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const offsetX = btnRect.left - switcherRect.left - 5; // -5px for padding

    // Apply transform
    const transform = `translateX(${offsetX}px)`;
    indicator.style.transform = transform;
    glow.style.transform = transform;

    // Disable transition if not animated (initial load)
    if (!animated) {
      indicator.style.transition = 'none';
      glow.style.transition = 'none';
      requestAnimationFrame(() => {
        indicator.style.transition = '';
        glow.style.transition = '';
      });
    }
  }

  /**
   * Create ripple effect on button click
   * @param {HTMLElement} button - Button element that was clicked
   */
  createRipple(button) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    // Position ripple at click point
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${rect.width / 2 - size / 2}px`;
    ripple.style.top = `${rect.height / 2 - size / 2}px`;
    
    button.appendChild(ripple);
    ripple.classList.add('animate');
    
    // Remove after animation
    setTimeout(() => ripple.remove(), 600);
  }

  /**
   * Attach keyboard navigation (1/2/3 or Arrow keys)
   */
  attachKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      const themes = ['default', 'kids', 'dark'];
      const currentIndex = themes.indexOf(this.currentTheme);
      let newIndex = currentIndex;

      // Number keys: 1 = Light, 2 = Kids, 3 = Dark
      if (e.key >= '1' && e.key <= '3') {
        newIndex = parseInt(e.key) - 1;
      }
      // Arrow keys: cycle through themes
      else if (e.key === 'ArrowLeft') {
        newIndex = (currentIndex - 1 + themes.length) % themes.length;
      }
      else if (e.key === 'ArrowRight') {
        newIndex = (currentIndex + 1) % themes.length;
      }
      else {
        return; // Not a theme shortcut
      }

      if (newIndex !== currentIndex) {
        e.preventDefault();
        const newTheme = themes[newIndex];
        const button = document.querySelector(`[data-theme="${newTheme}"]`);
        this.setTheme(newTheme, button);
      }
    });

    console.log('[ThemeManager] Keyboard navigation enabled (1/2/3, Arrow keys)');
  }
}
