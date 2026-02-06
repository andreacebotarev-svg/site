import { logger } from '../../utils/logger.js';

export class PageRenderer {
  constructor(container, options = {}) {
    this.container = container;
    this.interactionLayer = options.interactionLayer; // Обязательная зависимость
    this.logger = options.logger || console;
  }

  /**
   * Единственный публичный метод
   */
  async renderPage(page, chapter) {
    this.logger.debug(`Rendering page ${page.index}`);

    // 1. Создаем DOM элементы (чистая функция, Safe DOM)
    const paragraphElements = this._buildDOM(page, chapter);

    // 2. Создаем временный контейнер (вне DOM)
    const tempDiv = document.createElement('div');
    tempDiv.className = 'page-content'; // Важный класс для стилей

    // 3. Добавляем параграфы безопасно
    paragraphElements.forEach(paragraph => {
      tempDiv.appendChild(paragraph);
    });

    // 4. ✨ MAGICAL STEP: Делаем слова интерактивными ДО вставки
    if (this.interactionLayer) {
      this.interactionLayer.process(tempDiv);
    }

    // 5. Вставляем в реальный DOM (Мгновенная подмена)
    // Очищаем контейнер жестко. Никаких плавных переходов пока не отладим базу.
    this.container.innerHTML = '';

    // Оборачиваем в .page для структуры
    const pageWrapper = document.createElement('div');
    pageWrapper.className = 'page';
    pageWrapper.appendChild(tempDiv);

    this.container.appendChild(pageWrapper);

    // 6. Скролл наверх
    this.container.scrollTop = 0;
  }

  _buildDOM(page, chapter) {
    // Safe DOM construction - create elements instead of HTML strings
    return page.paragraphs.map(p => {
        // Защита от null
        const content = p.html || p.text || '';

        // Create paragraph element safely
        const paragraph = document.createElement('p');
        paragraph.className = 'reading-paragraph';

        // Safe content insertion based on content type
        if (p.html && p.html !== p.text) {
            // Content contains HTML markup (images, spans, etc.) - use innerHTML safely
            // But first clean XML namespaces that cause display issues
            const cleanHtml = content
                .replace(/xmlns="[^"]*"/g, '')  // Remove XML namespaces
                .replace(/<span[^>]*xmlns="[^"]*"[^>]*>/g, '<span>')  // Clean span tags
                .replace(/<\/span>/g, '</span>'); // Ensure closing tags

            paragraph.innerHTML = cleanHtml;
        } else {
            // Plain text content - use textContent for encoding safety
            paragraph.textContent = content;
        }

        return paragraph;
    });
  }
}