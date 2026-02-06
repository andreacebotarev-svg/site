/**
 * TTSService - Text-to-Speech service with multiple fallback methods
 * Handles pronunciation playback using various TTS providers
 */
export class TTSService {
  constructor() {
    this.responsiveVoiceLoaded = false;
    this.initResponsiveVoice();
  }

  /**
   * Initialize ResponsiveVoice library if available
   */
  async initResponsiveVoice() {
    if (!window.responsiveVoice) {
      try {
        await this.loadScriptWithTimeout('https://code.responsivevoice.org/responsivevoice.js', 10000);
        this.responsiveVoiceLoaded = true;
        console.log('✅ ResponsiveVoice loaded successfully');
      } catch (error) {
        console.warn('⚠️ Failed to load ResponsiveVoice, using Web Speech API fallback:', error.message);
      }
    } else {
      this.responsiveVoiceLoaded = true;
    }
  }

  /**
   * Play pronunciation for a word using the best available method
   * @param {string} word - Word to pronounce
   * @returns {Promise<boolean>} Success status
   */
  async playPronunciation(word) {
    const ttsMethods = [
      {
        name: 'ResponsiveVoice',
        func: () => this.tryResponsiveVoiceTTS(word)
      },
      {
        name: 'Google TTS',
        func: () => this.tryGoogleTTS(word)
      },
      {
        name: 'Web Speech API',
        func: () => this.tryWebSpeechAPI(word)
      },
      {
        name: 'Local Pronunciation',
        func: () => this.tryLocalPronunciation(word)
      }
    ];

    for (const method of ttsMethods) {
      try {
        console.log(`🔊 Trying ${method.name} for "${word}"`);
        const success = await method.func();
        if (success) {
          console.log(`✅ ${method.name} succeeded for "${word}"`);
          return true;
        }
      } catch (error) {
        console.warn(`❌ ${method.name} failed:`, error.message);
        // Continue to next method
      }
    }

    // If all methods failed
    console.error('🚫 All TTS methods failed');
    return false;
  }

  /**
   * Try ResponsiveVoice TTS
   * @param {string} word - Word to pronounce
   * @returns {Promise<boolean>} Success status
   */
  async tryResponsiveVoiceTTS(word) {
    return new Promise((resolve, reject) => {
      if (!this.responsiveVoiceLoaded || !window.responsiveVoice) {
        resolve(false);
        return;
      }

      window.responsiveVoice.speak(word, 'UK English Female', {
        onstart: () => resolve(true),
        onerror: (error) => reject(error),
        onend: () => resolve(true)
      });

      // Timeout fallback
      setTimeout(() => {
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Try Google Translate TTS
   * @param {string} word - Word to pronounce
   * @returns {Promise<boolean>} Success status
   */
  async tryGoogleTTS(word) {
    try {
      await this.playGoogleTTS(word);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Play Google TTS using multiple endpoints
   * @param {string} word - Word to pronounce
   * @returns {Promise<void>}
   */
  async playGoogleTTS(word) {
    // Try multiple Google TTS endpoints to bypass CORS issues
    const endpoints = [
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=en&client=tw-ob&ttsspeed=1`,
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=en&client=gtx&ttsspeed=1`,
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=en&total=1&idx=0&textlen=100&client=gtx&prev=input`
    ];

    for (const endpoint of endpoints) {
      try {
        const audio = new Audio();
        audio.src = endpoint;
        audio.crossOrigin = 'anonymous';

        await audio.play();
        console.log('Google TTS succeeded with endpoint:', endpoint);
        return; // Success, exit the loop
      } catch (error) {
        console.warn('Google TTS endpoint failed:', endpoint, error);
        // Continue to next endpoint
      }
    }

    // If all endpoints failed, throw error
    throw new Error('All Google TTS endpoints failed');
  }

  /**
   * Try Web Speech API
   * @param {string} word - Word to pronounce
   * @returns {Promise<boolean>} Success status
   */
  async tryWebSpeechAPI(word) {
    try {
      await this.playEnhancedWebSpeechAPI(word);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enhanced Web Speech API implementation
   * @param {string} word - Word to pronounce
   * @returns {Promise<void>}
   */
  async playEnhancedWebSpeechAPI(word) {
    if (!this.isWebSpeechAPISupported()) {
      throw new Error('Web Speech API not supported');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(word);

      // Select best English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter(voice =>
        voice.lang.startsWith('en') &&
        (voice.name.includes('Female') || voice.name.includes('Male') || voice.name.includes('English'))
      );

      // Prefer female voices, then any English voice
      const preferredVoice = englishVoices.find(voice => voice.name.includes('Female')) ||
                             englishVoices.find(voice => voice.name.includes('US')) ||
                             englishVoices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(`Selected voice: ${preferredVoice.name} (${preferredVoice.lang})`);
      }

      // Configure utterance
      utterance.lang = 'en-US';
      utterance.rate = 0.75; // Slightly slower for better clarity
      utterance.volume = 1;
      utterance.pitch = 1;

      // Event handlers
      utterance.onstart = () => {
        console.log('Web Speech API started speaking');
      };

      utterance.onend = () => {
        console.log('Web Speech API finished speaking');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Web Speech API error:', event.error);
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      // Cancel any ongoing speech and start new one
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);

      // Timeout fallback (in case onend never fires)
      setTimeout(() => {
        resolve();
      }, Math.max(word.length * 150, 3000)); // Estimate based on word length
    });
  }

  /**
   * Try local pronunciation (phonetic reading)
   * @param {string} word - Word to pronounce
   * @returns {Promise<boolean>} Success status
   */
  async tryLocalPronunciation(word) {
    try {
      this.playLocalPronunciation(word);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Play local pronunciation using phonetic rules
   * @param {string} word - Word to pronounce
   */
  playLocalPronunciation(word) {
    console.log(`🎵 Playing local pronunciation for "${word}"`);

    // Create a simple phonetic pronunciation using basic rules
    const phonetic = this.generatePhoneticPronunciation(word);

    // Try to use Web Speech API with phonetic spelling as fallback
    if (this.isWebSpeechAPISupported()) {
      const utterance = new SpeechSynthesisUtterance(phonetic);
      utterance.lang = 'en-US';
      utterance.rate = 0.6; // Very slow for phonetic reading
      utterance.volume = 0.8;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      // Ultimate fallback: just log the phonetic spelling
      console.log(`📝 Phonetic pronunciation: ${phonetic}`);
    }
  }

  /**
   * Check if Web Speech API is supported
   * @returns {boolean} Support status
   */
  isWebSpeechAPISupported() {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API not supported in this browser');
      return false;
    }

    // Check if there are any voices available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Voices might not be loaded yet, try to trigger loading
      window.speechSynthesis.onvoiceschanged = () => {
        console.log('Voices loaded:', window.speechSynthesis.getVoices().length);
      };
      // For now, assume it's supported if the API exists
    }

    // Check if we can create and configure an utterance
    try {
      const testUtterance = new SpeechSynthesisUtterance('test');
      testUtterance.lang = 'en-US';
      return true;
    } catch (error) {
      console.warn('Web Speech API utterance creation failed:', error);
      return false;
    }
  }

  /**
   * Generate phonetic pronunciation using basic rules
   * @param {string} word - Word to convert to phonetic spelling
   * @returns {string} Phonetic representation
   */
  generatePhoneticPronunciation(word) {
    let phonetic = word.toLowerCase();

    // Basic phonetic rules for common English patterns
    const rules = [
      // Vowels
      { pattern: /ee/g, replace: 'ee' },
      { pattern: /ea/g, replace: 'ee' },
      { pattern: /ai/g, replace: 'ay' },
      { pattern: /ay/g, replace: 'ay' },
      { pattern: /oa/g, replace: 'oh' },
      { pattern: /ou/g, replace: 'ow' },
      { pattern: /oo/g, replace: 'oo' },
      { pattern: /au/g, replace: 'aw' },
      { pattern: /aw/g, replace: 'aw' },
      { pattern: /ow/g, replace: 'ow' },
      { pattern: /oi/g, replace: 'oy' },
      { pattern: /oy/g, replace: 'oy' },
      { pattern: /igh/g, replace: 'eye' },
      { pattern: /ie/g, replace: 'ee' },

      // Consonants
      { pattern: /ph/g, replace: 'f' },
      { pattern: /ch/g, replace: 'ch' },
      { pattern: /sh/g, replace: 'sh' },
      { pattern: /th/g, replace: 'th' },
      { pattern: /wh/g, replace: 'w' },
      { pattern: /wr/g, replace: 'r' },
      { pattern: /kn/g, replace: 'n' },
      { pattern: /gn/g, replace: 'n' },

      // Silent letters
      { pattern: /b(?=t$)/g, replace: '' }, // debt, doubt
      { pattern: /c(?=t$)/g, replace: '' }, // connect, correct
      { pattern: /g(?=n$)/g, replace: '' }, // sign, gnaw
      { pattern: /h(?=onor)/g, replace: '' }, // honor, hour
      { pattern: /k(?=n$)/g, replace: '' }, // know, knee
      { pattern: /l(?=f$)/g, replace: '' }, // calf, half
      { pattern: /t(?=en$)/g, replace: '' }, // listen, fasten
      { pattern: /w(?=r)/g, replace: '' }, // write, wrong
    ];

    // Apply phonetic rules
    for (const rule of rules) {
      phonetic = phonetic.replace(rule.pattern, rule.replace);
    }

    // Add syllable breaks for longer words
    if (phonetic.length > 6) {
      phonetic = phonetic.replace(/(.{2,3})(.{2,3})/g, '$1-$2');
    }

    return phonetic;
  }

  /**
   * Load script with timeout
   * @param {string} src - Script URL
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  loadScriptWithTimeout(src, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        script.remove();
        reject(new Error(`Script load timeout after ${timeout}ms: ${src}`));
      }, timeout);

      script.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      script.onerror = (event) => {
        clearTimeout(timeoutId);
        script.remove();
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }
}
