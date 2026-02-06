/**
 * Context Extractor Utility
 * Extracts sentence context around clicked words
 */

export class ContextExtractor {
  /**
   * Get sentence context for a clicked word element
   * @param {HTMLElement} wordElement - The clicked word element
   * @returns {Object} Context object with sentence, before, after, and word
   */
  static getSentenceContext(wordElement) {
    console.log('ContextExtractor.getSentenceContext called for element:', wordElement);
    try {
      // Find the closest paragraph or text container
      const container = this.findTextContainer(wordElement);
      console.log('Found container:', container);
      if (!container) {
        console.log('No container found, returning fallback');
        return this.createFallbackContext(wordElement);
      }

      const fullText = container.textContent || '';
      const wordText = (wordElement.dataset.word || wordElement.textContent || '').trim();

      console.log('Full text:', fullText.substring(0, 100) + '...');
      console.log('Word text:', wordText);

      if (!fullText || !wordText) {
        console.log('Empty text or word, returning fallback');
        return this.createFallbackContext(wordElement);
      }

      // Try modern Intl.Segmenter API first
      if (window.Intl?.Segmenter) {
        const result = this.extractWithSegmenter(fullText, wordText);
        if (result) {
          return result;
        }
      }

      // Fallback to simple sentence extraction
      return this.extractWithSimpleHeuristics(fullText, wordText, wordElement);

    } catch (error) {
      console.warn('Context extraction failed:', error);
      return this.createFallbackContext(wordElement);
    }
  }

  /**
   * Find the best text container for context extraction
   */
  static findTextContainer(wordElement) {
    // Try paragraph first
    let container = wordElement.closest('p, .book-content, .reader-content, blockquote');

    // If not found, try parent elements up to 5 levels
    if (!container) {
      let current = wordElement.parentElement;
      let depth = 0;
      while (current && depth < 5) {
        if (current.textContent && current.textContent.length > wordElement.textContent.length) {
          container = current;
          break;
        }
        current = current.parentElement;
        depth++;
      }
    }

    return container;
  }

  /**
   * Extract context using Intl.Segmenter API
   */
  static extractWithSegmenter(fullText, wordText) {
    try {
      const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
      const segments = Array.from(segmenter.segment(fullText));

      // Find segment containing the word
      for (const segment of segments) {
        if (segment.segment.includes(wordText) ||
            segment.segment.toLowerCase().includes(wordText.toLowerCase())) {
          return {
            sentence: segment.segment.trim(),
            before: '',
            after: '',
            word: wordText,
            method: 'segmenter'
          };
        }
      }
    } catch (error) {
      console.warn('Segmenter extraction failed:', error);
    }

    return null;
  }

  /**
   * Extract context using simple heuristics
   */
  static extractWithSimpleHeuristics(fullText, wordText, wordElement) {
    // Split by sentence endings
    const sentences = fullText.split(/(?<=[.!?])\s+/);

    // Find sentence containing the word
    for (const sentence of sentences) {
      if (sentence.includes(wordText) ||
          sentence.toLowerCase().includes(wordText.toLowerCase())) {

        // Try to find word position for before/after context
        const wordIndex = sentence.indexOf(wordText);
        if (wordIndex !== -1) {
          const before = sentence.substring(0, wordIndex).trim();
          const after = sentence.substring(wordIndex + wordText.length).trim();

          return {
            sentence: sentence.trim(),
            before,
            after,
            word: wordText,
            method: 'heuristics'
          };
        }

        // Fallback if word position not found
        return {
          sentence: sentence.trim(),
          before: '',
          after: '',
          word: wordText,
          method: 'heuristics-fallback'
        };
      }
    }

    // If no sentence found, return the word itself
    return {
      sentence: wordText,
      before: '',
      after: '',
      word: wordText,
      method: 'fallback'
    };
  }

  /**
   * Create fallback context when extraction fails
   */
  static createFallbackContext(wordElement) {
    const wordText = (wordElement.dataset.word || wordElement.textContent || '').trim();

    return {
      sentence: wordText,
      before: '',
      after: '',
      word: wordText,
      method: 'fallback'
    };
  }

  /**
   * Highlight word in sentence for display
   * @param {string} sentence - The sentence text
   * @param {string} word - Word to highlight
   * @returns {string} HTML with highlighted word
   */
  static highlightWordInSentence(sentence, word) {
    if (!sentence || !word) return sentence;

    // Escape HTML and create highlight
    const escaped = sentence.replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

    // Simple highlight (could be improved)
    return escaped.replace(
      new RegExp(`\\b${word}\\b`, 'gi'),
      `<mark class="context-highlight">$&</mark>`
    );
  }
}
