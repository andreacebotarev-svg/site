/**
 * @fileoverview Settings Applicator - Reactive side-effects handler
 * @module SettingsApplicator
 */

import { globalState } from '../core/state-manager.js';
import { logger } from '../utils/logger.js';

export class SettingsApplicator {
  constructor() {
    this.logger = logger.createChild('SettingsApplicator');
    this.unsubscribe = null;
  }

  /**
   * Initialize and subscribe to state changes
   */
  init() {
    // Subscribe to future changes
    this.unsubscribe = globalState.subscribe((state) => {
      this.applyAll(state.settings || {});
    }, ['settings']);

    // Apply initial state immediately
    const initialSettings = globalState.getState('settings') || {};
    this.applyAll(initialSettings);

    this.logger.info('SettingsApplicator initialized');
  }

  /**
   * Apply all settings based on current state
   * @param {Object} settings 
   */
  applyAll(settings) {
    if (!settings) return;

    Object.entries(settings).forEach(([key, value]) => {
      this.applySetting(key, value);
    });
  }

  /**
   * Apply individual setting effect
   * @param {string} key 
   * @param {*} value 
   */
  applySetting(key, value) {
    switch (key) {
      case 'theme':
        this.applyTheme(value);
        break;
      case 'eyeComfort':
        this.applyEyeComfort(value);
        break;
      case 'blueLightFilter':
        this.applyBlueLightFilter(value);
        break;
      case 'readingWidth':
        this.applyReadingWidth(value);
        break;
      case 'fontFamily':
        this.applyFontFamily(value);
        break;
      case 'fontSmoothing':
        // Future implementation: set smoothing class
        break;
    }
  }

  applyTheme(value) {
    if (value === 'auto') {
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', systemPreference);
    } else {
      document.documentElement.setAttribute('data-theme', value);
    }
  }

  applyEyeComfort(value) {
    document.documentElement.removeAttribute('data-eye-comfort');
    if (value !== 'off') {
      document.documentElement.setAttribute('data-eye-comfort', value);
    }
    document.body.classList.toggle('eye-comfort-enabled', value !== 'off');
  }

  applyBlueLightFilter(value) {
    if (value === 'auto') {
      const systemNightMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-blue-light-filter', systemNightMode ? 'night' : 'day');
    } else {
      document.documentElement.setAttribute('data-blue-light-filter', value);
    }
  }

  applyFontFamily(value) {
    const fontMap = {
      'serif-georgia': 'var(--font-serif-georgia)',
      'serif-times': 'var(--font-serif-times)',
      'serif-garamond': 'var(--font-serif-garamond)',
      'serif-baskerville': 'var(--font-serif-baskerville)',
      'serif-crimson': 'var(--font-serif-crimson)',
      'sans-arial': 'var(--font-sans-arial)',
      'sans-verdana': 'var(--font-sans-verdana)',
      'sans-tahoma': 'var(--font-sans-tahoma)',
      'sans-helvetica': 'var(--font-sans-helvetica)',
      'mono-courier': 'var(--font-mono-courier)',
      'mono-consolas': 'var(--font-mono-consolas)',
      'mono-menlo': 'var(--font-mono-menlo)'
    };
    const fontValue = fontMap[value] || 'var(--font-serif-georgia)';
    document.documentElement.style.setProperty('--selected-font', fontValue);
  }

  applyReadingWidth(value) {
    const widthMap = {
      'narrow': '600px',
      'optimal': '672px',
      'wide': '800px'
    };
    document.documentElement.style.setProperty('--reader-max-width', widthMap[value] || '672px');
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

// Singleton
export const settingsApplicator = new SettingsApplicator();
