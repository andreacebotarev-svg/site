/**
 * @fileoverview Application Bootstrap - Central initialization
 */

import { Router } from './router.js';
import { LibraryView } from '../views/LibraryView.js';
import { ReaderView } from '../views/ReaderView.js';
import { VocabularyView } from '../views/VocabularyView.js';
import { FlashcardsView } from '../views/FlashcardsView.js';
import { StatisticsView } from '../views/StatisticsView.js';
import { SettingsView } from '../views/SettingsView.js';
import { toastManager } from '../ui/managers/ToastManager.js';
import { modalManager } from '../ui/managers/ModalManager.js';
import { logger } from '../utils/logger.js';
import { OmniDebugger } from './OmniDebugger.js';
import './OmniDiagnostics.js'; // Auto-initializes diagnostics
import { globalState } from './state-manager.js';
import { settingsManager } from '../settings/settings-manager.js';
import { bookService } from '../services/book-service.js';

export class Application {
  constructor(config) {
    // Prevent browser from auto-restoring scroll position
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    this.config = config;
    this.router = null;
    this.logger = logger.createChild('Application');

    // Инициализируем сервисы
    this.initializeServices();

    // Инициализируем OmniDebugger первым делом!
    this.debugger = new OmniDebugger({
      enabled: true // config.debug
    });

    // Экспортируем в глобальную область для доступа из консоли
    if (typeof window !== 'undefined') {
      window.app = this;
    }
  }

  initializeServices() {
    // В новой архитектуре (OPFS/IndexedDB через imageStorage)
    // инициализация происходит автоматически при первом обращении или импорте.
    // Нет необходимости в явной инициализации.

    // Делаем доступными глобально для отладки
    if (typeof window !== 'undefined') {
      window.bookService = bookService;
    }

    this.logger.info('Services initialized');
  }

  async bootstrap() {
    this.logger.info('Bootstrapping application...');

    try {
      // 1. Initialize managers
      await this.initializeManagers();

      // 2. Initialize router
      await this.initializeRouter();

      // 3. Setup theme
      await this.initializeTheme();
      await this.initializeFont();

      // 4. Hide loading screen
      this.hideLoadingScreen();

      // 5. Show app
      this.showApp();

      this.logger.info('✅ Application bootstrapped successfully');
    } catch (error) {
      this.logger.error('Bootstrap failed', error);
      throw error;
    }
  }

  async initializeManagers() {
    // Toast manager auto-initializes
    // Modal manager auto-initializes
    
    // Initialize settings manager (applies saved settings reactively)
    await settingsManager.init();
    
    this.logger.info('Managers initialized');
  }

  async initializeRouter() {
    this.router = new Router({
      'library': LibraryView,
      'reader': ReaderView,
      'vocabulary': VocabularyView,
      'flashcards': FlashcardsView,
      'statistics': StatisticsView,
      'settings': SettingsView
    });

    // Setup navigation highlighting
    this._setupNavigation();

    // Canonicalize URL for pagination parameters (add paginationV4 if missing)
    const { canonicalizeReaderURL } = await import('./url-canonicalizer.js');
    canonicalizeReaderURL();

    // Navigate to initial route
    if (!window.location.hash) {
      window.location.hash = '#/library';
    }

    this.logger.info('Router initialized');

    // Подключаем OmniDebugger к StateManager
    this._setupStateDebugging();
  }

  _setupNavigation() {
    // Update active nav link on route change
    const updateActiveNav = (route) => {
      // Remove active class from all nav links
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });

      // Add active class to current nav link
      const currentNavLink = document.querySelector(`a[href="#/${route}"]`);
      if (currentNavLink) {
        currentNavLink.classList.add('active');
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      const route = window.location.hash.substring(2).split('/')[0] || 'library';
      updateActiveNav(route);
    });

    // Initial setup
    const initialRoute = window.location.hash.substring(2).split('/')[0] || 'library';
    updateActiveNav(initialRoute);
  }

  _setupStateDebugging() {
    // Подписываемся на все изменения состояния
    globalState.subscribe((newState) => {
      this.debugger._log('🔄 STATE UPDATE', 'Global state changed', newState);
    }, null); // null = подписка на все изменения

    this.logger.info('State debugging initialized');
  }

  async initializeTheme() {
    // Theme is now applied by SettingsApplicator
    // We only need to setup the UI toggle button
    this._setupThemeToggle();
  }

  _setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      // Sync initial button state
      const currentTheme = settingsManager.get('theme') || 'auto';
      this._updateThemeIcon(currentTheme);

      // Listen for click
      themeBtn.addEventListener('click', async () => {
        const current = settingsManager.get('theme') || 'auto';
        // Simple toggle logic: auto/light -> dark, dark -> light
        // For more complex logic, we might want a cycle or modal
        const next = current === 'dark' ? 'light' : 'dark';
        
        await settingsManager.set('theme', next);
        toastManager.info(`Theme changed to ${next} mode`, { duration: 2000 });
      });

      // Listen for changes to update icon
      globalState.subscribe((state) => {
        this._updateThemeIcon(state.settings?.theme);
      }, ['settings']);
    }
  }

  _updateThemeIcon(theme) {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      themeBtn.textContent = isDark ? '☀️' : '🌙';
    }
  }

  async initializeEyeComfort() {
    // Handled by SettingsApplicator
  }

  async initializeFont() {
    // Handled by SettingsApplicator
  }

  hideLoadingScreen() {
    const loading = this.config.loading;
    if (loading) {
      loading.style.opacity = '0';
      loading.style.transition = 'opacity 0.3s';
      setTimeout(() => loading.style.display = 'none', 300);
    }
  }

  showApp() {
    const root = this.config.root;
    if (root) {
      root.style.display = 'block';
      root.style.opacity = '0';
      setTimeout(() => {
        root.style.transition = 'opacity 0.3s';
        root.style.opacity = '1';
      }, 50);
    }
  }

  handleGlobalError(error) {
    this.logger.error('Global error caught', error);

    // Show error boundary
    const errorBoundary = this.config.errorBoundary;
    const errorMessage = document.getElementById('error-message');

    if (errorBoundary && errorMessage) {
      errorBoundary.style.display = 'flex';
      errorMessage.textContent = error.message || 'An unexpected error occurred';
    }

    // Report to monitoring service
    // Sentry.captureException(error);
  }
}
