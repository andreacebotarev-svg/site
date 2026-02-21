/**
 * @fileoverview Settings View - User preferences and configuration interface
 * @module SettingsView
 */

import { settingsManager } from '../settings/settings-manager.js';
import { SettingsConfig } from '../settings/SettingsConfig.js';
import { FullCacheResetController } from '../settings/FullCacheResetController.js';
import { logger } from '../utils/logger.js';
import { toastManager } from '../ui/managers/ToastManager.js';

const settingsLogger = logger.createChild('SettingsView');

/**
 * Settings View - User preferences interface
 * @class SettingsView
 */
export class SettingsView {
  constructor(container) {
    this.container = container;
    this.settings = {};
    this.logger = settingsLogger;
  }

  async render() {
    try {
      // Load current settings
      this.settings = settingsManager.getAll();

      this.container.innerHTML = `
        <main class="settings-container ios-settings">
          <header class="settings-header">
            <h1 class="settings-title ios-title">Настройки</h1>
            <p class="settings-subtitle ios-subtitle">Настрой приложение под себя</p>
          </header>

          <div class="settings-content ios-content">
            ${this.renderGroups()}
            
            ${this.renderAdvancedSection()}
          </div>

          <div class="settings-actions ios-actions">
            <button class="btn btn-secondary ios-btn-secondary" id="reset-settings-btn">
              Сбросить к заводским
            </button>
          </div>
        </main>
      `;

      this.attachEventListeners();
      
      // Initialize sub-controllers
      new FullCacheResetController(this.container).attach();
      
      this.logger.info('Settings view rendered');
    } catch (error) {
      this.logger.error('Failed to render settings view', error);
      this.container.innerHTML = `
        <div class="error-container">
          <p>Failed to load settings. Please try again.</p>
        </div>
      `;
    }
  }

  renderGroups() {
    return SettingsConfig.groups.map(group => `
      <section class="settings-section ios-section">
        <h2 class="settings-section-title ios-section-title">${group.title}</h2>
        ${group.settings.map(key => this.renderSetting(key)).join('')}
      </section>
    `).join('');
  }

  renderSetting(key) {
    const config = SettingsConfig.settings[key];
    if (!config) return '';

    const currentValue = this.settings[key];
    const options = config.options;

    return `
      <div class="setting-item ios-setting-item" data-setting="${key}" data-type="${config.type}">
        <div class="setting-info ios-setting-info">
          <label class="setting-label ios-setting-label">${config.label}</label>
          <p class="setting-description ios-setting-description">${config.description}</p>
        </div>
        <div class="setting-control ios-setting-control">
          ${this.renderControl(config, currentValue)}
        </div>
      </div>
    `;
  }

  renderControl(config, currentValue) {
    if (config.type === 'toggle') {
      return `
        <label class="toggle">
          <input type="checkbox" ${currentValue ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      `;
    }

    if (config.type === 'select' && config.options) {
      return `
        <select class="setting-select">
          ${Object.entries(config.options).map(([value, label]) => `
            <option value="${value}" ${value === String(currentValue) ? 'selected' : ''}>
              ${label}
            </option>
          `).join('')}
        </select>
      `;
    }

    return `<span class="setting-value">${currentValue}</span>`;
  }

  renderAdvancedSection() {
    return `
      <section class="settings-section ios-section">
        <h2 class="settings-section-title ios-section-title">Дополнительно</h2>

        <div class="setting-item ios-setting-item" data-setting="fullCacheReset">
          <div class="setting-info ios-setting-info">
            <label class="setting-label ios-setting-label">Полный сброс кэша</label>
            <p class="setting-description ios-setting-description">
              Введите 000, чтобы удалить все локальные данные.
            </p>
          </div>

          <div class="setting-control ios-setting-control">
            <div class="pin-reset ios-pin-reset" id="pin-reset">
              <input class="pin-digit ios-pin-digit" inputmode="numeric" maxlength="1" pattern="[0-9]" aria-label="Digit 1" placeholder="0">
              <input class="pin-digit ios-pin-digit" inputmode="numeric" maxlength="1" pattern="[0-9]" aria-label="Digit 2" placeholder="0">
              <input class="pin-digit ios-pin-digit" inputmode="numeric" maxlength="1" pattern="[0-9]" aria-label="Digit 3" placeholder="0">
              <button class="btn btn-danger ios-btn-danger" id="full-cache-reset-btn" disabled>
                🗑️ Очистить кэш
              </button>
            </div>
            <p class="danger-note ios-danger-note">
              Внимание: это удалит все книги, прогресс, словарь и настройки на этом устройстве.
            </p>
          </div>
        </div>
      </section>
    `;
  }

  attachEventListeners() {
    // Handle changes via delegation
    this.container.addEventListener('change', async (e) => {
      const target = e.target;
      const settingItem = target.closest('.ios-setting-item');
      
      if (!settingItem) return;

      const key = settingItem.dataset.setting;
      const type = settingItem.dataset.type;
      
      // Skip if not a config setting (e.g., reset pin)
      if (!SettingsConfig.settings[key]) return;

      let value;
      if (type === 'toggle') {
        value = target.checked;
      } else {
        value = target.value;
      }

      await this.updateSetting(key, value);
    });

    // Handle reset button
    const resetBtn = this.container.querySelector('#reset-settings-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (confirm('Сбросить все настройки к заводским?')) {
          await this.resetAllSettings();
        }
      });
    }
  }

  async updateSetting(key, value) {
    try {
      const success = await settingsManager.set(key, value);
      if (success) {
        this.settings[key] = value;
        toastManager.success(`Обновлено: ${SettingsConfig.settings[key].label}`);
      } else {
        toastManager.error('Ошибка обновления');
      }
    } catch (error) {
      toastManager.error('Ошибка обновления');
      this.logger.error('Failed to update setting', error);
    }
  }

  async resetAllSettings() {
    try {
      const success = await settingsManager.resetAll();
      if (success) {
        toastManager.success('Настройки сброшены');
        await this.render();
      } else {
        toastManager.error('Ошибка сброса');
      }
    } catch (error) {
      toastManager.error('Ошибка сброса');
    }
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
