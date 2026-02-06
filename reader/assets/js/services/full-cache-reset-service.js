/**
 * @fileoverview Full Cache Reset Service - Complete cache and data wipe
 * @module FullCacheResetService
 */

import { logger } from '../utils/logger.js';

const log = logger.createChild('FullCacheReset');

/**
 * Delete IndexedDB database
 * @param {string} dbName - Database name to delete
 * @returns {Promise<boolean>} Success status
 */
function deleteIndexedDb(dbName) {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve(true);
      req.onblocked = () => resolve(false); // Blocked is not necessarily failure
      req.onerror = () => reject(req.error || new Error('indexedDB.deleteDatabase failed'));
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Clear all Cache Storage entries
 * @returns {Promise<void>}
 */
async function clearAllCacheStorage() {
  if (!('caches' in window)) return;

  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    log.info(`Cleared ${keys.length} cache storage entries`);
  } catch (error) {
    log.warn('Failed to clear cache storage', error);
  }
}

/**
 * Unregister all service workers
 * @returns {Promise<void>}
 */
async function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    log.info(`Unregistered ${registrations.length} service workers`);
  } catch (error) {
    log.warn('Failed to unregister service workers', error);
  }
}

/**
 * Clear localStorage and sessionStorage
 * @returns {Promise<void>}
 */
async function clearWebStorage() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    log.info('Cleared localStorage and sessionStorage');
  } catch (error) {
    log.warn('Failed to clear web storage', error);
  }
}

/**
 * Full Cache Reset Service
 * Provides complete application data wipe functionality
 */
export const fullCacheResetService = {
  /**
   * Perform complete cache and data reset
   * Clears: Cache Storage, IndexedDB, localStorage, sessionStorage, Service Workers
   * @returns {Promise<void>}
   * @throws {Error} If critical operations fail
   */
  async fullReset() {
    log.info('Starting full cache reset...');

    // 1) Clear Cache Storage (Service Worker caches)
    await clearAllCacheStorage();

    // 2) Clear localStorage and sessionStorage
    await clearWebStorage();

    // 3) Delete IndexedDB database (ReaderDB)
    try {
      const deleted = await deleteIndexedDb('ReaderDB');
      if (deleted) {
        log.info('IndexedDB ReaderDB deleted successfully');
      } else {
        log.warn('IndexedDB deletion was blocked or incomplete');
      }
    } catch (error) {
      log.error('Failed to delete IndexedDB', error);
      throw error; // This is critical, rethrow
    }

    // 4) Unregister Service Workers
    await unregisterServiceWorkers();

    log.info('Full cache reset completed successfully');
  }
};
