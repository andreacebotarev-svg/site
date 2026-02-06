/**
 * Context Translation Service
 * Translates sentences for contextual understanding
 */

import { logger } from '../utils/logger.js';

const contextLogger = logger.createChild('ContextTranslation');

export class ContextTranslationService {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50; // Limit in-memory cache size
    this.currentProvider = 'google'; // Default provider
    this.providers = {
      google: this.translateWithGoogle.bind(this),
      yandex: this.translateWithYandex.bind(this),
      libre: this.translateWithLibre.bind(this)
    };

    // IndexedDB для персистентного кеширования
    this.dbName = 'ContextTranslationsDB';
    this.storeName = 'translations';
    this.dbVersion = 1;
    this.db = null;

    // Инициализируем IndexedDB
    this.initDB();
  }

  /**
   * Инициализация IndexedDB для персистентного кеширования
   */
  async initDB() {
    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        contextLogger.warn('IndexedDB not available, using in-memory cache only');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        contextLogger.debug('Context translations DB initialized');
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          contextLogger.info('Created translations object store');
        }
      };
    } catch (error) {
      contextLogger.warn('Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Получить перевод из персистентного кеша (IndexedDB)
   */
  async getFromPersistentCache(key) {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Сохранить перевод в персистентный кеш (IndexedDB)
   */
  async saveToPersistentCache(key, value) {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      await new Promise((resolve, reject) => {
        const request = store.put({
          key: key,
          value: value,
          timestamp: Date.now()
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Очищаем старые записи при превышении лимита
      await this.cleanupOldEntries();
    } catch (error) {
      contextLogger.warn('Failed to save to persistent cache:', error);
    }
  }

  /**
   * Очистка старых записей в IndexedDB
   */
  async cleanupOldEntries() {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');

      // Удаляем записи старше 30 дней
      const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const range = IDBKeyRange.upperBound(cutoffTime);

      const request = index.openCursor(range);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (error) {
      contextLogger.warn('Failed to cleanup old entries:', error);
    }
  }

  /**
   * Установить значение в in-memory кеш
   */
  setInMemoryCache(key, value) {
    // Управляем размером in-memory кеша
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Translate a sentence with context
   * @param {string} sentence - Sentence to translate
   * @param {Object} options - Translation options
   * @returns {Promise<string>} Translated text
   */
  async translateSentence(sentence, options = {}) {
    if (!sentence || sentence.trim().length === 0) {
      return '';
    }

    // Генерируем ключ для кеширования
    const cacheKey = this.generateCacheKey(sentence, options);

    // 1. Сначала проверяем in-memory кеш
    if (this.cache.has(cacheKey)) {
      contextLogger.debug('Using in-memory cache for:', sentence.substring(0, 50));
      return this.cache.get(cacheKey);
    }

    // 2. Проверяем IndexedDB (персистентный кеш)
    try {
      const persistentCache = await this.getFromPersistentCache(cacheKey);
      if (persistentCache) {
        // Сохраняем в in-memory кеш для быстрого доступа
        this.setInMemoryCache(cacheKey, persistentCache);
        contextLogger.debug('Using persistent cache for:', sentence.substring(0, 50));
        return persistentCache;
      }
    } catch (error) {
      contextLogger.warn('Failed to check persistent cache:', error);
    }

    // Try translation providers in order
    const providers = options.providers || [this.currentProvider, 'google', 'yandex', 'libre'];

    for (const providerName of providers) {
      try {
        const provider = this.providers[providerName];
        if (!provider) continue;

        contextLogger.debug(`Trying ${providerName} for:`, sentence.substring(0, 50));
        const translation = await provider(sentence, options);

        if (translation && translation.trim()) {
          // Сохраняем в оба кеша
          this.setInMemoryCache(cacheKey, translation);
          await this.saveToPersistentCache(cacheKey, translation);
          contextLogger.info(`Successfully translated with ${providerName}`);
          return translation;
        }
      } catch (error) {
        contextLogger.warn(`${providerName} translation failed:`, error.message);
        // Continue to next provider
      }
    }

    // All providers failed
    const fallback = `Translation unavailable: ${sentence}`;
    this.setCache(cacheKey, fallback);
    return fallback;
  }

  /**
   * Google Translate API
   */
  async translateWithGoogle(text, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      // Use official Google Cloud Translation API if key is available
      const apiKey = options.apiKey || this.getGoogleApiKey();
      if (apiKey) {
        return await this.translateWithGoogleCloud(text, apiKey, controller);
      }

      // Fallback to free endpoint (unreliable)
      return await this.translateWithGoogleFree(text, controller);

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Google translation timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Google Cloud Translation API (paid)
   */
  async translateWithGoogleCloud(text, apiKey, controller) {
    const response = await fetch(
      `https://translation.googleapis.com/v3/projects/${this.getGoogleProjectId()}/locations/global:translateText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          contents: [text],
          sourceLanguageCode: 'en',
          targetLanguageCode: 'ru'
        }),
        signal: controller.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Google Cloud API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translations?.[0]?.translatedText || '';
  }

  /**
   * Google Translate free endpoint (unreliable)
   */
  async translateWithGoogleFree(text, controller) {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(text)}`,
      {
        signal: controller.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Google free API error: ${response.status}`);
    }

    const data = await response.json();
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }

    throw new Error('Invalid Google free API response');
  }

  /**
   * Yandex Translate API
   */
  async translateWithYandex(text, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // Use official Yandex API if key is available
      const apiKey = options.apiKey || this.getYandexApiKey();
      if (apiKey) {
        return await this.translateWithYandexCloud(text, apiKey, controller);
      }

      // Fallback to free endpoint if available
      const freeKey = this.getYandexFreeKey();
      if (freeKey) {
        return await this.translateWithYandexFree(text, controller);
      }

      // No keys available
      throw new Error('No Yandex API keys configured');

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Yandex translation timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Yandex Cloud Translation API (paid)
   */
  async translateWithYandexCloud(text, apiKey, controller) {
    const response = await fetch('https://translate.api.cloud.yandex.net/translate/v2/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${apiKey}`
      },
      body: JSON.stringify({
        texts: [text],
        sourceLanguageCode: 'en',
        targetLanguageCode: 'ru'
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Yandex Cloud API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translations?.[0]?.text || '';
  }

  /**
   * Yandex Translate free endpoint (limited)
   */
  async translateWithYandexFree(text, controller) {
    const response = await fetch(
      `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${this.getYandexFreeKey()}&text=${encodeURIComponent(text)}&lang=en-ru`,
      {
        signal: controller.signal
      }
    );

    if (!response.ok) {
      throw new Error(`Yandex free API error: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.text && data.text[0]) {
      return data.text[0];
    }

    throw new Error('Invalid Yandex free API response');
  }

  /**
   * LibreTranslate API (free, self-hosted)
   */
  async translateWithLibre(text, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const endpoints = [
        'https://libretranslate.com/translate',
        'https://translate.argosopentech.com/translate',
        'https://libretranslate.de/translate'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              q: text,
              source: 'en',
              target: 'ru'
            }),
            signal: controller.signal
          });

          if (!response.ok) continue;

          const data = await response.json();
          if (data && data.translatedText) {
            return data.translatedText;
          }
        } catch (error) {
          // Try next endpoint
          continue;
        }
      }

      throw new Error('All LibreTranslate endpoints failed');

    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get API keys from settings (implement in settings manager)
   */
  getGoogleApiKey() {
    // TODO: Implement in settings manager
    return null;
  }

  getGoogleProjectId() {
    // TODO: Implement in settings manager
    return null;
  }

  getYandexApiKey() {
    // TODO: Implement in settings manager
    return null;
  }

  getYandexFreeKey() {
    // Free Yandex key (limited usage)
    // WARNING: This key is exposed in source code and should not be used in production
    // For production, configure via settings or environment variables
    return null;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(text, options) {
    const provider = options.provider || this.currentProvider;
    return `${provider}:${text.length}:${text.substring(0, 100)}`;
  }

  /**
   * Set cache with size limit
   */
  setCache(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry (simple FIFO)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    contextLogger.info('Translation cache cleared');
  }

  /**
   * Set current provider
   */
  setProvider(provider) {
    if (this.providers[provider]) {
      this.currentProvider = provider;
      contextLogger.info(`Translation provider set to: ${provider}`);
    }
  }
}

// Create singleton instance
export const contextTranslationService = new ContextTranslationService();
