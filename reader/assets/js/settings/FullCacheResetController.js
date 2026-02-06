/**
 * @fileoverview Full Cache Reset Controller - Handles dangerous reset operations
 * @module FullCacheResetController
 */

import { fullCacheResetService } from '../services/full-cache-reset-service.js';
import { toastManager } from '../ui/managers/ToastManager.js';
import { logger } from '../utils/logger.js';

export class FullCacheResetController {
  constructor(container) {
    this.container = container;
    this.logger = logger.createChild('FullCacheResetController');
    this.digits = [];
    this.btn = null;
  }

  attach() {
    const pinRoot = this.container.querySelector('#pin-reset');
    if (!pinRoot) return;

    this.digits = Array.from(pinRoot.querySelectorAll('.pin-digit'));
    this.btn = this.container.querySelector('#full-cache-reset-btn');

    if (!this.digits.length || !this.btn) return;

    this.attachListeners();
    this.setBtnState();
  }

  getCode() {
    return this.digits.map(input => (input.value || '')).join('');
  }

  setBtnState() {
    if (this.btn) {
      this.btn.disabled = (this.getCode() !== '000');
    }
  }

  sanitizeDigit(value) {
    return (value || '').replace(/\D/g, '').slice(0, 1);
  }

  attachListeners() {
    this.digits.forEach((input, idx) => {
      input.addEventListener('input', (e) => {
        const value = this.sanitizeDigit(e.target.value);
        e.target.value = value;

        if (value && idx < this.digits.length - 1) {
          this.digits[idx + 1].focus();
        }
        this.setBtnState();
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
          this.digits[idx - 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        const text = (e.clipboardData || window.clipboardData).getData('text');
        const nums = (text || '').replace(/\D/g, '').slice(0, 3).split('');
        if (!nums.length) return;

        e.preventDefault();
        for (let i = 0; i < this.digits.length; i++) {
          this.digits[i].value = nums[i] || '';
        }
        this.setBtnState();
        const focusIdx = Math.min(nums.length, 3) - 1;
        (this.digits[focusIdx] || this.digits[2]).focus();
      });
    });

    this.btn.addEventListener('click', () => this.handleReset());
  }

  async handleReset() {
    if (this.getCode() !== '000') return;

    const confirmed = confirm('Full reset will delete ALL local data (books, progress, vocabulary, settings). Continue?');
    if (!confirmed) return;

    this.btn.disabled = true;
    this.btn.textContent = 'Clearing...';

    try {
      await fullCacheResetService.fullReset();
      toastManager.success('Cache cleared. Reloading...');
      this.logger.info('Full cache reset completed');

      // Clear inputs
      this.digits.forEach(d => (d.value = ''));
      this.digits[0].focus();

      setTimeout(() => {
        location.reload();
      }, 1000);
    } catch (err) {
      this.logger.error('Full cache reset failed', err);
      toastManager.error('Failed to clear cache');
      this.btn.disabled = false;
      this.btn.textContent = '🗑️ Clear cache';
      this.setBtnState();
    }
  }
}
