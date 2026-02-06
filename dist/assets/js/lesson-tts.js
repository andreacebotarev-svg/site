/**
 * LESSON TTS (Text-to-Speech) MODULE
 * Handles audio playback using Web Speech API (native browser TTS)
 */

class LessonTTS {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.voices = [];
    
    // Load voices when available
    this.loadVoices();
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  /**
   * Load available voices
   */
  loadVoices() {
    this.voices = this.synthesis.getVoices();
  }

  /**
   * Get best voice for language
   * @param {string} lang - Language code (e.g., 'en', 'ru')
   * @returns {SpeechSynthesisVoice|null}
   */
  getVoice(lang = 'en') {
    // Prefer Google voices, then any native voice
    const langPrefix = lang.toLowerCase().substring(0, 2);
    
    // Try to find Google voice first
    let voice = this.voices.find(v => 
      v.lang.toLowerCase().startsWith(langPrefix) && 
      v.name.toLowerCase().includes('google')
    );
    
    // Fallback to any voice for the language
    if (!voice) {
      voice = this.voices.find(v => 
        v.lang.toLowerCase().startsWith(langPrefix)
      );
    }
    
    // Last fallback to default
    if (!voice && this.voices.length > 0) {
      voice = this.voices[0];
    }
    
    return voice;
  }

  /**
   * Clean text for TTS
   * @param {string} text - Raw text to clean
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    if (!text) return '';
    
    // Remove translation markers and extra whitespace
    let cleaned = text.replace(/\[translate:|\]/gi, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

  /**
   * Speak a single word or phrase
   * @param {string} text - Text to speak
   * @param {string} lang - Language code (default: 'en')
   * @param {Object} options - Additional options
   * @returns {Promise} Resolves when speech finishes
   */
  speak(text, lang = 'en', options = {}) {
    return new Promise((resolve, reject) => {
      const cleaned = this.cleanText(text);
      if (!cleaned) {
        resolve();
        return;
      }

      // Stop current speech if playing
      this.stop();

      try {
        // Create utterance
        this.currentUtterance = new SpeechSynthesisUtterance(cleaned);
        
        // Set voice
        const voice = this.getVoice(lang);
        if (voice) {
          this.currentUtterance.voice = voice;
        }
        
        // Set language
        this.currentUtterance.lang = lang === 'ru' ? 'ru-RU' : 'en-US';
        
        // Set options
        this.currentUtterance.rate = options.rate || 0.9;
        this.currentUtterance.pitch = options.pitch || 1.0;
        this.currentUtterance.volume = options.volume || 1.0;
        
        // Error handling
        this.currentUtterance.onerror = (event) => {
          console.warn('TTS error:', event.error);
          reject(event.error);
        };
        
        // Success handling
        this.currentUtterance.onend = () => {
          resolve();
        };
        
        // Speak
        this.synthesis.speak(this.currentUtterance);
        
        // Vibrate on mobile
        this.vibrate(10);
        
      } catch (e) {
        console.error('TTS error:', e);
        reject(e);
      }
    });
  }

  /**
   * Speak multiple texts in sequence
   * @param {Array<string>} texts - Array of texts to speak
   * @param {number} delay - Delay between each text in ms (default: 800)
   * @param {string} lang - Language code
   * @returns {Promise} Resolves when all texts are spoken
   */
  async speakSequence(texts, delay = 800, lang = 'en') {
    try {
      for (let i = 0; i < texts.length; i++) {
        // Wait for current utterance to finish
        await this.speak(texts[i], lang);
        
        // Add delay between utterances (except for last one)
        if (i < texts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      console.warn('speakSequence error:', error);
      throw error;
    }
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Check if TTS is supported
   * @returns {boolean}
   */
  isSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * Vibrate device (if supported)
   * @param {number} duration - Vibration duration in ms
   */
  vibrate(duration = 10) {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }
}