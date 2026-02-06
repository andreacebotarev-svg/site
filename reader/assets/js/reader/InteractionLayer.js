import { logger } from '../utils/logger.js';

/**
 * InteractionLayer (V4 Pure)
 * Единственный источник правды для интерактивных слов.
 * Отвечает за: нарезку текста, клики, подсветку сохраненных слов.
 */
export class InteractionLayer {
  constructor(options = {}) {
    this.vocabularyStorage = options.vocabularyStorage;
    this.wordPopover = options.wordPopover;
    this.logger = options.logger || console;

    // Единый нормализатор для всего проекта
    this.normalizer = (text) => text.toLowerCase().trim().replace(/[^\w\s'-]/g, '');

    // Intl.Segmenter для точного разбиения на предложения
    this.segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });

    // Привязываем обработчик
    this._handleClick = this._handleClick.bind(this);
  }

  /**
   * Главный метод: превращает "мертвый" DOM элемент в интерактивный
   * Вызывается ДО вставки элемента в страницу (Pre-render)
   */
  process(rootElement) {
    if (!rootElement) return;

    // 1. Нарезаем текст на слова (TreeWalker)
    this._wrapWordsInTextNodes(rootElement);

    // 2. Красим сохраненные слова (если есть словарь)
    if (this.vocabularyStorage) {
      this._highlightSavedWords(rootElement);
    }
  }

  /**
   * Подключает слушатели событий к контейнеру страниц
   * Вызывается один раз при старте Reader
   */
  attach(container) {
    if (!container) return;

    // Делегирование: один слушатель на весь контейнер
    container.removeEventListener('click', this._handleClick); // cleanup
    container.addEventListener('click', this._handleClick);

    this.logger.info('InteractionLayer attached to container');
  }

  // --- PRIVATE LOGIC ---

  _handleClick(event) {
    // Ищем ближайшее интерактивное слово
    const wordEl = event.target.closest('.interactive-word');
    if (!wordEl) return;

    event.preventDefault();
    event.stopPropagation();

    const word = wordEl.dataset.word; // Уже нормализовано

    // Динамическое извлечение предложения с помощью Intl.Segmenter
    const sentence = this._extractSentenceFromClick(wordEl);

    this.logger.debug(`Word clicked: ${word}, context: "${sentence?.substring(0, 50)}..."`);

    if (this.wordPopover) {
      this.wordPopover.show(wordEl, wordEl.getBoundingClientRect(), word, sentence);
    }
  }

  _wrapWordsInTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        // Игнорируем уже обработанные или пустые узлы
        if (node.parentElement?.classList.contains('interactive-word')) return NodeFilter.FILTER_REJECT;
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      const text = node.textContent;
      // Пропускаем, если нет букв
      if (!/[a-zA-Z]/.test(text)) return;

      const fragment = document.createDocumentFragment();
      // Разбиваем по пробелам, сохраняя их
      const parts = text.split(/(\s+)/);

      parts.forEach(part => {
        // Если это пробел или мусор - просто текст
        if (!part.trim() || !/[a-zA-Z]/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
          return;
        }

        // Если слово - оборачиваем
        const span = document.createElement('span');
        span.className = 'interactive-word';
        span.textContent = part;
        span.dataset.word = this.normalizer(part); // <--- ВАЖНО: Нормализация при создании

        fragment.appendChild(span);
      });

      node.parentNode.replaceChild(fragment, node);
    });
  }

  /**
   * Динамическое извлечение предложения из DOM в момент клика
   * Использует Intl.Segmenter для точного разбиения на предложения
   */
  _extractSentenceFromClick(wordEl) {
    try {
      // Находим родительский блок (параграф или контентный контейнер)
      const block = wordEl.closest('.reading-paragraph, .page-content > *');
      if (!block) return null;

      const fullText = block.textContent;
      const wordText = wordEl.textContent;

      // Получаем позицию слова в тексте для точного поиска
      const wordOffset = this._getWordOffsetInBlock(block, wordEl);

      return this._findSentenceNative(fullText, wordText, wordOffset);
    } catch (error) {
      this.logger.warn('Failed to extract sentence from click:', error);
      return null;
    }
  }

  /**
   * Вычисляет смещение слова внутри блока текста
   */
  _getWordOffsetInBlock(block, wordEl) {
    try {
      const range = document.createRange();
      range.setStart(block, 0);
      range.setEndBefore(wordEl);
      return range.toString().length;
    } catch (error) {
      // Fallback: простое приближение
      this.logger.warn('Failed to calculate word offset, using fallback');
      return 0;
    }
  }

  /**
   * Находит предложение с помощью Intl.Segmenter
   */
  _findSentenceNative(fullText, wordText, wordOffset) {
    try {
      const segments = this.segmenter.segment(fullText);

      // Ищем сегмент, который содержит наше слово по позиции
      for (const seg of segments) {
        if (seg.index <= wordOffset && (seg.index + seg.segment.length) >= wordOffset) {
          return seg.segment.trim();
        }
      }

      // Fallback: ищем по содержимому
      for (const seg of segments) {
        if (seg.segment.includes(wordText)) {
          return seg.segment.trim();
        }
      }

      // Ultimate fallback: возвращаем весь текст
      return fullText.length > 200 ? fullText.substring(0, 200) + '...' : fullText;
    } catch (error) {
      this.logger.warn('Intl.Segmenter failed, using fallback');
      return wordText; // Минимум - само слово
    }
  }

  _highlightSavedWords(root) {
    const words = root.querySelectorAll('.interactive-word');
    words.forEach(el => {
      // Проверка в словаре должна быть МГНОВЕННОЙ
      if (this.vocabularyStorage.isWordSaved(el.dataset.word)) {
        el.classList.add('word-saved');
      } else {
        el.classList.remove('word-saved'); // Фикс: удаляем класс если слово не сохранено
      }
    });
  }
}