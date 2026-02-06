/**
 * @fileoverview Settings Manager - Centralized settings management
 * @module SettingsManager
 */

import { globalState } from '../core/state-manager.js';
import { logger } from '../utils/logger.js';
import { SettingsConfig } from './SettingsConfig.js';
import { settingsApplicator } from './SettingsApplicator.js';

const settingsLogger = logger.createChild('SettingsManager');

/**
 * Settings Manager - Handles user preferences and configuration
 * @class SettingsManager
 */
export class SettingsManager {
  constructor() {
    this.logger = settingsLogger;
    this.defaults = SettingsConfig.getDefaults();
    this.logger.info('SettingsManager initialized');
  }

  /**
   * Initialize manager: load from storage and start applicator
   */
  async init() {
    await this.loadFromStorage();
    settingsApplicator.init(); // Start reactive updates
  }

  /**
   * Get setting value
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  get(key) {
    try {
      return globalState.getState(`settings.${key}`) ?? this.defaults[key];
    } catch (error) {
      this.logger.warn(`Failed to get setting ${key}`, error);
      return this.defaults[key];
    }
  }

  /**
   * Set setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value) {
    try {
      // Basic validation based on schema existence
      if (!SettingsConfig.settings[key]) {
        this.logger.warn(`Unknown setting: ${key}`);
        return false;
      }

      // Update state (Applicator will react to this)
      await globalState.setState(state => ({
        ...state,
        settings: {
          ...state.settings,
          [key]: value
        }
      }), `SETTING_${key.toUpperCase()}_CHANGED`);

      // Save to localStorage as backup
      this.saveToLocalStorage(key, value);

      this.logger.info(`Setting ${key} updated:`, value);
      return true;
    } catch (error) {
      this.logger.error(`Failed to set setting ${key}`, error);
      return false;
    }
  }

  /**
   * Get all settings
   * @returns {Object} All settings
   */
  getAll() {
    try {
      const stateSettings = globalState.getState('settings') || {};
      return { ...this.defaults, ...stateSettings };
    } catch (error) {
      this.logger.warn('Failed to get all settings', error);
      return { ...this.defaults };
    }
  }

  /**
   * Reset setting to default
   * @param {string} key - Setting key
   * @returns {Promise<boolean>} Success status
   */
  async reset(key) {
    return this.set(key, this.defaults[key]);
  }

  /**
   * Reset all settings to defaults
   * @returns {Promise<boolean>} Success status
   */
  async resetAll() {
    try {
      const defaults = { ...this.defaults };

      await globalState.setState(state => ({
        ...state,
        settings: defaults
      }), 'SETTINGS_RESET');

      // Clear localStorage backup
      Object.keys(defaults).forEach(key => {
        localStorage.removeItem(`reader-setting-${key}`);
      });

      this.logger.info('All settings reset to defaults');
      return true;
    } catch (error) {
      this.logger.error('Failed to reset all settings', error);
      return false;
    }
  }

  /**
   * Save setting to localStorage
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(`reader-setting-${key}`, JSON.stringify(value));
    } catch (error) {
      this.logger.warn(`Failed to save setting ${key} to localStorage`, error);
    }
  }

  /**
   * Load setting from localStorage
   * @param {string} key - Setting key
   * @returns {*} Setting value or null
   */
  loadFromLocalStorage(key) {
    try {
      const stored = localStorage.getItem(`reader-setting-${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      // Silent fail is okay here
      return null;
    }
  }

  /**
   * Load all settings from localStorage and sync to state
   */
  async loadFromStorage() {
    const settings = {};

    Object.keys(this.defaults).forEach(key => {
      const storedValue = this.loadFromLocalStorage(key);
      if (storedValue !== null) {
        settings[key] = storedValue;
      }
    });

    if (Object.keys(settings).length > 0) {
      await globalState.setState(state => ({
        ...state,
        settings: {
          ...state.settings, // Preserve defaults or previous state
          ...settings
        }
      }), 'SETTINGS_LOADED_FROM_STORAGE');

      this.logger.info('Settings loaded from localStorage');
    }
  }
}

// Create singleton instance
export const settingsManager = new SettingsManager();
