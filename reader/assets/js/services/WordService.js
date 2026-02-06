/**
 * WordService - Handles all word-related API operations
 * Centralizes data fetching logic for pronunciation, translation, and definitions
 */
export class WordService {
  constructor() {
    this.abortController = null;
  }

  /**
   * Get comprehensive word data including pronunciation, translation, and definition
   * @param {string} word - The word to look up
   * @returns {Promise<{pronunciation: string, translation: string, definition: object|null}>}
   */
  async getWordData(word) {
    // Cancel any previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    // Create new abort controller for this request batch
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      console.log(`WordService: Fetching data for "${word}"`);

      // Fetch all data in parallel
      const [pronunciation, translation, definition] = await Promise.allSettled([
        this.fetchPronunciation(word, signal),
        this.fetchTranslation(word, signal),
        this.fetchDefinition(word, signal)
      ]);

      // Extract results, using fallbacks for failed requests
      const result = {
        pronunciation: pronunciation.status === 'fulfilled' ? pronunciation.value : `/${word}/`,
        translation: translation.status === 'fulfilled' ? translation.value : 'Перевод недоступен',
        definition: definition.status === 'fulfilled' ? definition.value : null
      };

      console.log(`WordService: Successfully fetched data for "${word}"`, result);
      return result;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`WordService: Request for "${word}" was cancelled`);
        throw error; // Re-throw to let UI know it was cancelled
      }

      console.error(`WordService: Failed to fetch data for "${word}":`, error);
      return this.getFallbackData(word);
    }
  }

  /**
   * Get pronunciation for a word
   * @param {string} word - The word to get pronunciation for
   * @param {AbortSignal} signal - Abort signal for cancellation
   * @returns {Promise<string>} Phonetic pronunciation
   */
  async fetchPronunciation(word, signal) {
    try {
      // Use AbortSignal.timeout if available (modern browsers), otherwise rely on external timeout
      let fetchSignal = signal;
      if (AbortSignal.timeout && !signal.aborted) {
        // Adaptive timeout based on word length
        const BASE_TIMEOUT = 5000;
        const PER_CHAR_TIMEOUT = 100;
        const timeout = BASE_TIMEOUT + (word.length * PER_CHAR_TIMEOUT);
        fetchSignal = AbortSignal.timeout(timeout);
      }

      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { signal: fetchSignal }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].phonetics && data[0].phonetics.length > 0) {
          const phonetic = data[0].phonetics.find(p => p.text);
          if (phonetic && phonetic.text) {
            return phonetic.text;
          }
        }
      }

      // If API fails, throw to trigger fallback
      throw new Error('API returned no phonetic data');

    } catch (error) {
      if (error.name === 'AbortError') {
        throw error; // Re-throw abort errors
      }

      console.warn('WordService: Pronunciation API failed, using fallback:', error.message);

      // Fallback pronunciation using basic phonetic rules
      const pronunciation = word.toLowerCase()
        .replace(/ph/g, 'f')
        .replace(/th/g, 'ð')
        .replace(/ch/g, 'tʃ')
        .replace(/sh/g, 'ʃ')
        .replace(/wh/g, 'w')
        .replace(/wr/g, 'r')
        .replace(/kn/g, 'n')
        .replace(/gn/g, 'n');

      return `/${pronunciation}/`;
    }
  }

  /**
   * Get translation for a word
   * @param {string} word - The word to translate
   * @param {AbortSignal} signal - Abort signal for cancellation
   * @returns {Promise<string>} Translation in Russian
   */
  async fetchTranslation(word, signal) {
    // Try Google Translate first
    try {
      // Use AbortSignal.timeout if available (modern browsers), otherwise rely on external timeout
      let fetchSignal = signal;
      if (AbortSignal.timeout && !signal.aborted) {
        const BASE_TIMEOUT = 5000;
        const PER_CHAR_TIMEOUT = 100;
        const timeout = BASE_TIMEOUT + (word.length * PER_CHAR_TIMEOUT);
        fetchSignal = AbortSignal.timeout(timeout);
      }

      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(word)}`,
        { signal: fetchSignal }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return data[0][0][0];
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      console.warn('WordService: Google Translate failed:', error.message);
    }

    // Try LibreTranslate as fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        body: JSON.stringify({
          q: word,
          source: 'en',
          target: 'ru'
        }),
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.translatedText) {
          return data.translatedText;
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      console.warn('WordService: LibreTranslate failed:', error.message);
    }

    // Final fallback to basic dictionary
    return this.getBasicTranslation(word);
  }

  /**
   * Get definition for a word
   * @param {string} word - The word to define
   * @param {AbortSignal} signal - Abort signal for cancellation
   * @returns {Promise<object|null>} Definition object or null
   */
  async fetchDefinition(word, signal) {
    try {
      // Use AbortSignal.timeout if available (modern browsers), otherwise rely on external timeout
      let fetchSignal = signal;
      if (AbortSignal.timeout && !signal.aborted) {
        const BASE_TIMEOUT = 5000;
        const PER_CHAR_TIMEOUT = 100;
        const timeout = BASE_TIMEOUT + (word.length * PER_CHAR_TIMEOUT);
        fetchSignal = AbortSignal.timeout(timeout);
      }

      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { signal: fetchSignal }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].meanings && data[0].meanings.length > 0) {
          const meaning = data[0].meanings[0];
          if (meaning && meaning.definitions && meaning.definitions.length > 0) {
            return {
              partOfSpeech: meaning.partOfSpeech,
              definition: meaning.definitions[0].definition,
              example: meaning.definitions[0].example
            };
          }
        }
      }

      return null; // No definition available

    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }

      console.warn('WordService: Definition API failed:', error.message);
      return null;
    }
  }

  /**
   * Get basic translation from hardcoded dictionary
   * @param {string} word - Word to translate
   * @returns {string} Translation or fallback message
   */
  getBasicTranslation(word) {
    const translations = {
      'the': 'определенный артикль',
      'and': 'и',
      'or': 'или',
      'but': 'но',
      'if': 'если',
      'then': 'тогда',
      'when': 'когда',
      'where': 'где',
      'what': 'что',
      'how': 'как',
      'why': 'почему',
      'who': 'кто',
      'which': 'который',
      'this': 'этот',
      'that': 'тот',
      'here': 'здесь',
      'there': 'там',
      'now': 'сейчас',
      'then': 'тогда',
      'good': 'хороший',
      'bad': 'плохой',
      'big': 'большой',
      'small': 'маленький',
      'fast': 'быстрый',
      'slow': 'медленный',
      'hot': 'горячий',
      'cold': 'холодный',
      'new': 'новый',
      'old': 'старый',
      'right': 'правый/правильный',
      'wrong': 'неправильный',
      'yes': 'да',
      'no': 'нет',
      'please': 'пожалуйста',
      'thank': 'спасибо',
      'hello': 'привет',
      'goodbye': 'до свидания'
    };

    return translations[word.toLowerCase()] || 'Перевод не найден';
  }

  /**
   * Get fallback data when all APIs fail
   * @param {string} word - Word that failed to load
   * @returns {object} Basic fallback data
   */
  getFallbackData(word) {
    return {
      pronunciation: `/${word}/`,
      translation: 'Перевод временно недоступен',
      definition: null
    };
  }

  /**
   * Cancel any ongoing requests
   */
  cancelRequests() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
