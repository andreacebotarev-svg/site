/**
 * WordHighlighter - Manages interactive word highlighting and popovers
 * Handles word selection, highlighting, and popover interactions
 */
import { globalState } from '../core/state-manager.js';

export class WordHighlighter {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.container = null;
    this.wordPopover = null;
    this.vocabularyStorage = options.vocabularyStorage || null;

    // Event handlers
    this.wordClickHandler = this.handleWordClick.bind(this);
    this.wordKeyHandler = this.handleWordKey.bind(this);

    this.options = {
      enableAudio: true,
      enableContext: true,
      ...options
    };

    this.unsubscribe = null;
  }

  /**
   * Initialize with container and popover
   */
  initialize(container, wordPopover) {
    this.container = container;
    this.wordPopover = wordPopover;

    // Setup event delegation
    this.setupEventDelegation();

    // Subscribe to vocabulary changes
    this.unsubscribe = globalState.subscribe((state) => {
      if (this.container) {
        this.highlightSavedWords(this.container);
      }
    }, ['vocabulary']);

    this.logger.info('WordHighlighter initialized');
  }

  /**
   * Make text content interactive by adding word highlighting
   */
  makeElementInteractive(rootElement) {
    console.time('Interaction');

    // 1. Нормализация и разбивка на слова (как было)
    rootElement.normalize();
    this.findProcessableTextNodes(rootElement).forEach(textNode => {
      this.processTextNode(textNode);
    });

    // 2. ✅ Явный запуск раскраски сохраненных слов
    // Делаем это отдельным проходом, чтобы не нагружать парсинг
    this.highlightSavedWords(rootElement);

    console.timeEnd('Interaction');
    this.logger.info('Interactive words processing completed');
  }

  /**
   * Setup event delegation for word interactions
   */
  setupEventDelegation() {
    if (!this.container) return;

    // Remove existing listeners to prevent duplicates
    this.container.removeEventListener('click', this.wordClickHandler);
    this.container.removeEventListener('keydown', this.wordKeyHandler);

    // Add new listeners
    this.container.addEventListener('click', this.wordClickHandler);
    this.container.addEventListener('keydown', this.wordKeyHandler);

    this.logger.debug('Event delegation setup completed');
  }


  /**
   * Handle word click events - strict mode (word only)
   */
  handleWordClick(event) {
    const wordEl = event.target.closest('.interactive-word');
    if (!wordEl) return;

    // Skip if not a book word
    if (!this.isBookWordElement(wordEl)) {
      console.log('Skipping non-book word element:', wordEl);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    console.log('Word clicked via delegation:', wordEl.dataset.word);
    this.showWordPopover(wordEl);
  }

  /**
   * Handle keyboard activation of words
   */
  handleWordKey(event) {
    let wordEl = event.target.closest('.interactive-word');

    // For keyboard events, if we're in a paragraph but not on a word,
    // we don't do fallback (unlike clicks) to avoid confusion
    if (!wordEl) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      console.log('Word activated via keyboard:', wordEl.dataset.word);
      this.showWordPopover(wordEl);
    }
  }

  /**
   * Show popover for word
   */
  async showWordPopover(wordElement) {
    if (!this.wordPopover) return;

    const word = wordElement.dataset.word;
    const sentence = wordElement.dataset.sentence || '';
    const context = wordElement.dataset.context || null;

    // Get element rect for positioning
    const rect = wordElement.getBoundingClientRect();

    try {
      // Pass word as textContent, sentence as context for translation
      await this.wordPopover.show(wordElement, rect, word, sentence);
    } catch (error) {
      this.logger.error('Failed to show word popover:', error);
    }
  }

  /**
   * Find text nodes that can be made interactive
   * 🚀 UPDATE: "Total Interactivity" Strategy
   */
  findProcessableTextNodes(container) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 1. Пустые узлы пропускаем
          if (!node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }

          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          // 2. 🚨 ВАЖНО: Если узел уже интерактивный (внутри span.interactive-word) - пропускаем
          // Чтобы не создавать матрешку <span><span>word</span></span>
          if (parent.classList.contains('interactive-word')) {
            return NodeFilter.FILTER_REJECT;
          }

          // 3. UI-элементы пропускаем (через селекторы)
          if (parent.closest('.reading-controls, .pagination-nav, button, input')) {
             return NodeFilter.FILTER_REJECT;
          }

          // Всё остальное (H1, P, LI, BLOCKQUOTE, SPAN...) - БЕРЁМ!
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    return textNodes;
  }

  /**
   * Process a single text node to make words interactive
   */
  processTextNode(textNode) {
    const text = textNode.textContent;
    if (!this.shouldProcessText(text)) return;

    const parent = textNode.parentElement;
    if (!parent) return;

    // Clean existing interactive words in this container
    this.cleanInteractiveWords(parent);

    // Create interactive text
    const interactiveFragment = this.createInteractiveText(text, parent);
    if (interactiveFragment) {
      parent.replaceChild(interactiveFragment, textNode);
    }
  }

  /**
   * Check if text should be processed
   */
  shouldProcessText(text) {
    // Skip very short text
    if (text.length < 3) return false;

    // Skip text with mostly punctuation
    const wordChars = text.replace(/[^\w]/g, '');
    if (wordChars.length < 3) return false;

    // Skip text that looks like code or markup
    if (/[{}[\]<>]/.test(text)) return false;

    return true;
  }

  /**
   * Create interactive text with word highlighting
   */
  createInteractiveText(text, container) {
    const words = text.split(/(\s+)/);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Keep whitespace as-is
      if (/^\s+$/.test(word)) {
        fragment.appendChild(document.createTextNode(word));
        continue;
      }

      // Clean the word for processing
      const cleanWord = word.replace(/[^\w'-]/g, '');
      if (!cleanWord || cleanWord.length < 2) {
        fragment.appendChild(document.createTextNode(word));
        continue;
      }

      // Create interactive word element
      const wordElement = document.createElement('span');
      wordElement.className = 'interactive-word';
      wordElement.textContent = word;
      wordElement.dataset.word = cleanWord.toLowerCase();
      wordElement.tabIndex = 0;
      wordElement.role = 'button';
      wordElement.setAttribute('aria-label', `Click to see definition of "${cleanWord}"`);

      // Add context if available
      const sentence = this.extractSentence(text, i);
      if (sentence) {
        wordElement.dataset.sentence = sentence;
      }

      fragment.appendChild(wordElement);
    }

    return fragment;
  }

  /**
   * Extract sentence containing the word
   */
  extractSentence(text, wordIndex) {
    try {
      // Simple sentence extraction - find boundaries
      const words = text.split(/(\s+)/);
      let start = wordIndex;
      let end = wordIndex;

      // Expand to sentence boundaries
      while (start > 0 && !/[.!?]$/.test(words[start - 1])) {
        start--;
      }
      while (end < words.length - 1 && !/[.!?]$/.test(words[end])) {
        end++;
      }

      const sentence = words.slice(start, end + 1).join('').trim();
      return sentence.length > 10 ? sentence : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if element is a valid target for interaction
   * 🚀 UPDATE: Разрешаем почти всё, кроме явного UI
   */
  isBookWordElement(wordElement) {
    if (!wordElement) return false;

    // Список того, что ТРОГАТЬ НЕЛЬЗЯ (UI элементы)
    const uiSelectors = [
      '.reading-controls', // Панели управления
      '.pagination-nav',   // Кнопки навигации
      '.mode-switcher',    // Переключатели тем
      'button',            // Любые кнопки
      'input', 'select', 'textarea', // Формы
      '[role="button"]',   // ARIA кнопки (кроме самих слов, если они role=button)
      '.no-highlight'      // Специальный класс-исключение (на будущее)
    ];

    // Если элемент находится внутри UI-компонента — игнорируем
    if (wordElement.closest(uiSelectors.join(', '))) {
        // Исключение: само интерактивное слово может иметь role="button", это норм
        if (wordElement.classList.contains('interactive-word')) return true;
        return false;
    }

    return true;
  }

  /**
   * Check if element already has interactive words processed
   */
  hasInteractiveWordsProcessed(element) {
    return element.querySelector('.interactive-word') !== null;
  }

  /**
   * Clean existing interactive words to prevent duplication
   */
  cleanInteractiveWords(element) {
    const interactiveWords = element.querySelectorAll('.interactive-word');
    interactiveWords.forEach(word => {
      const textNode = document.createTextNode(word.textContent);
      word.parentNode.replaceChild(textNode, word);
    });
  }

  /**
   * Enhance images with lazy loading and error handling
   */
  enhanceImages() {
    const images = this.container?.querySelectorAll('img');
    if (!images) return;

    images.forEach(img => {
      // Add error handling
      img.addEventListener('error', () => {
        img.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.textContent = '[Image failed to load]';
        img.parentNode.replaceChild(placeholder, img);
      });

      // Add lazy loading if not already set
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }

  /**
   * Destroy highlighter and cleanup
   */
  destroy() {
    if (this.container) {
      this.container.removeEventListener('click', this.wordClickHandler);
      this.container.removeEventListener('keydown', this.wordKeyHandler);
    }

    this.container = null;
    this.wordPopover = null;

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.logger.info('WordHighlighter destroyed');
  }

  /**
   * Apply highlighting to words that exist in vocabulary
   */
  highlightSavedWords(container) {
    // Если словаря нет - ничего не делаем
    if (!this.vocabularyStorage) return;

    const interactiveWords = container.querySelectorAll('.interactive-word');
    if (interactiveWords.length === 0) return;

    interactiveWords.forEach(wordEl => {
      const cleanWord = wordEl.dataset.word; // Получаем чистое слово (например 'apple')

      // Проверяем наличие в базе (мгновенно, O(1))
      if (this.vocabularyStorage.isWordSaved(cleanWord)) {
        wordEl.classList.add('word-saved');
      } else {
        // На всякий случай убираем класс, если он вдруг там был
        wordEl.classList.remove('word-saved');
      }
    });
  }
}
