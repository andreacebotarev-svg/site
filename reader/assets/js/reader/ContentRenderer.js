/**
 * ContentRenderer - Responsible for rendering book content
 * Handles different content types and formats
 */
export class ContentRenderer {
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.blobUrls = new Set();
    this.options = {
      enableImages: true,
      enableInteractiveWords: true,
      ...options
    };

    // Setup global error handling for images
    this.setupGlobalErrorHandling();
  }

  /**
   * Setup global error handling for images
   */
  setupGlobalErrorHandling() {
    // Listen for image load errors globally
    document.addEventListener('error', (event) => {
      if (event.target.tagName === 'IMG' && event.target.src.startsWith('/book-images/')) {
        this.handleImageError(event.target);
      }
    }, true); // Use capture phase to catch all image errors
  }

  /**
   * Handle image loading errors
   * @param {HTMLImageElement} img
   */
  handleImageError(img) {
    const src = img.src;
    const urlParts = src.split('/book-images/')[1];
    if (!urlParts) return;

    const slashIndex = urlParts.indexOf('/');
    const bookId = urlParts.substring(0, slashIndex);
    const imagePath = urlParts.substring(slashIndex + 1);

    console.warn(`🖼️ Image failed to load: ${bookId}/${imagePath}`);

    // Create error placeholder
    img.classList.add('image-error');
    img.title = `Failed to load image: ${imagePath}`;

    // Replace with error SVG
    const errorSvg = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#fee" stroke="#fcc"/>
        <text x="50" y="45" text-anchor="middle" fill="#c33" font-size="10">Image</text>
        <text x="50" y="60" text-anchor="middle" fill="#c33" font-size="10">Error</text>
      </svg>
    `;

    // Convert SVG to blob URL and replace
    const errorBlob = new Blob([errorSvg], { type: 'image/svg+xml' });
    const errorUrl = URL.createObjectURL(errorBlob);
    img.src = errorUrl;

    // Clean up error URL after some time
    setTimeout(() => URL.revokeObjectURL(errorUrl), 10000);
  }

  /**
   * Render complete book content
   */
  async renderBookContent(content, bookId) {
    console.log('Rendering book content with lesson-renderer approach:', content);

    // Reading mode switcher
    const modeSwitcher = `
      <div class="reading-mode-switcher" style="margin: 1rem 0; text-align: center;">
        <button class="btn btn-secondary mode-btn" data-snap="mandatory" style="margin-right: 0.5rem;">
          📖 Pages
        </button>
        <button class="btn btn-secondary mode-btn" data-snap="proximity">
          📜 Flow
        </button>
        <button class="btn btn-secondary mode-btn" data-snap="none">
          🆓 Free
        </button>
      </div>
    `;

    const contentHtml = await this.renderReadingContent(content, bookId);

    return `
      <div class="reader-viewer">
        <div class="book-content reader-text" id="reading-content">
          ${contentHtml}
        </div>
      </div>
      ${content.sections && content.sections.length > 1 ? `
        <div class="book-navigation">
          <h3 style="font-size: var(--fs-title-2); margin-bottom: var(--space-4); color: var(--text-primary); font-weight: 600;">Table of Contents</h3>
          <nav>
            <ol style="padding-left: var(--space-5);">
              ${content.sections.map((section, index) => `
                <li style="margin-bottom: var(--space-2);">
                  <a href="#section-${section.id || index}" style="color: var(--apple-blue); text-decoration: none; font-weight: 500; transition: color var(--ms-duration-fast) var(--curve-spring);" onmouseover="this.style.color='var(--apple-blue)'" onmouseout="this.style.color='var(--text-secondary)'">
                    ${this.escapeHtml(section.title || `Section ${index + 1}`)}
                  </a>
                </li>
              `).join('')}
            </ol>
          </nav>
        </div>
      ` : ''}
    `;
  }

  /**
   * Render reading content with structured data
   */
  async renderReadingContent(content, bookId) {
    // Check if we have new structured blocks (preferred)
    const blocks = content.blocks || content.content?.reading;

    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      // Fallback to old HTML processing if no structured data
      console.log('No structured reading data, falling back to HTML processing');
      return this.processBookContent(content.html || '', bookId);
    }

    console.log('Using structured reading data with', blocks.length, 'blocks');

    // Log what types of blocks we have
    const blockTypes = blocks.reduce((acc, block) => {
      acc[block.kind] = (acc[block.kind] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 Block types distribution:', blockTypes);

    // Log image blocks specifically
    const imageBlocks = blocks.filter(block => block.kind === 'img');
    if (imageBlocks.length > 0) {
      console.log('🖼️ Found image blocks:', imageBlocks.map((block, i) => ({
        index: i,
        originalSrc: block.originalSrc,
        src: block.src,
        alt: block.alt
      })));
    } else {
      console.warn('⚠️ No image blocks found in structured data!');
    }

    // Render all blocks synchronously (no async operations needed)
    const renderedBlocks = blocks.map((block, index) => this.renderBlock(block, index, bookId));

    const finalHtml = `<div class="lesson-content">${renderedBlocks.join('')}</div>`;

    console.log('📝 [ContentRenderer] Generated final HTML', {
      blocksCount: blocks.length,
      renderedBlocksCount: renderedBlocks.length,
      htmlLength: finalHtml.length,
      htmlPreview: finalHtml.substring(0, 300) + '...',
      paragraphBlocks: renderedBlocks.filter(block => block.includes('<p')).length,
      imageBlocks: renderedBlocks.filter(block => block.includes('<img')).length
    });

    return finalHtml;
  }

  /**
   * Render a single content block
   */
  /**
   * Render a single content block with Semantic Type Handling
   */
  renderBlock(block, index = 0, bookId) {
    console.log(`🎨 Semantic Rendering block ${index}:`, {
      kind: block.kind,
      type: block.type,
      hasText: !!block.text,
      hasHtml: !!block.html,
      hasTitle: !!block.title
    });

    // 🚨 FIX: Расширенный Switch для всех типов блоков
    switch (block.kind) {
      case 'title':
      case 'header':
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        return this.renderTitleBlock(block, index);

      case 'fact':
      case 'note':
      case 'aside':
        return this.renderFactBlock(block, index);

      case 'list':
      case 'ul':
      case 'ol':
        return this.renderListBlock(block, index);

      case 'quote':
      case 'blockquote':
        return this.renderQuoteBlock(block, index);

      case 'img':
      case 'image':
        console.log(`🖼️ Found image block ${index}, calling renderImageBlock`);
        return this.renderImageBlock(block, index, bookId);

      case 'p':
      case 'regular':
      default:
        // Если тип неизвестен, пробуем отрендерить как параграф
        if (block.text || block.html) {
             return this.renderParagraphBlock(block, index);
        }
        console.warn('Unknown empty block type:', block.kind);
        return '';
    }
  }

  /**
   * 1. Render Title (H2)
   */
  renderTitleBlock(block, index) {
      const content = block.html || this.escapeHtml(block.text);
      // data-kind="title" критичен для парсера ReaderView!
      return `<h2 class="reading-header" data-kind="title" style="--block-index: ${index};">${content}</h2>`;
  }

  /**
   * 2. Render Fact/Note (Aside)
   */
  renderFactBlock(block, index) {
      const content = block.html || this.escapeHtml(block.text);
      const titleHtml = block.title ? `<div class="fact-title">${this.escapeHtml(block.title)}</div>` : '<div class="fact-title">Fact</div>';

      return `
        <aside class="fact-box" data-kind="fact" style="--block-index: ${index};">
          ${titleHtml}
          <div class="fact-content">${content}</div>
        </aside>
      `;
  }

  /**
   * 3. Render List (UL)
   */
  renderListBlock(block, index) {
      // Если контент уже содержит <li>, используем как есть
      let content = block.html || '';

      // Если это просто текст с переносами, разбиваем на li
      if (!content.includes('<li')) {
          const items = (block.text || '').split('\n').filter(line => line.trim());
          content = items.map(item => `<li>${this.escapeHtml(item)}</li>`).join('');
      }

      return `<ul class="reading-list" data-kind="list" style="--block-index: ${index};">${content}</ul>`;
  }

  /**
   * 4. Render Quote (Blockquote)
   */
  renderQuoteBlock(block, index) {
      const content = block.html || this.escapeHtml(block.text);
      return `<blockquote class="reading-quote" data-kind="quote" style="--block-index: ${index};">${content}</blockquote>`;
  }

  /**
   * 5. Render Regular Paragraph (P)
   */
  renderParagraphBlock(block, index) {
    let html = block.html || this.escapeHtml(block.text);

    // Если у параграфа вдруг есть заголовок (бывает в старых форматах)
    const titleHtml = block.title ? `<h3 class="para-title">${this.escapeHtml(block.title)}</h3>` : '';

    return `
      ${titleHtml}
      <p class="reading-paragraph" data-kind="regular" style="--block-index: ${index};">${html}</p>
    `;
  }

  /**
   * Render an image block - generates HTML with data-image-id for later processing
   */
  renderImageBlock(block, index, bookId) {
    console.log(`🖼️ ContentRenderer.renderImageBlock called for ${bookId}:`, {
      index,
      originalSrc: block.originalSrc,
      src: block.src,
      alt: block.alt,
      allBlockKeys: Object.keys(block)
    });

    // Use originalSrc as the image path for Service Worker
    const imagePath = block.originalSrc || (block.src && block.src !== 'null' ? block.src : '');
    const alt = block.alt || 'EPUB Image';
    const className = block.className || 'epub-image';

    if (!imagePath) {
      console.warn(`❌ No image path available for block ${index} in book ${bookId}`);
      return `<div class="image-placeholder" style="--block-index: ${index};">[Image not available]</div>`;
    }

    // Generate Service Worker URL
    const imageUrl = `/book-images/${bookId}/${imagePath}`;
    console.log(`🔗 Generating Service Worker URL: "${imageUrl}"`);

    // Return HTML with direct Service Worker URL
    return `
      <div class="image-container" style="--block-index: ${index};">
        <img
          src="${imageUrl}"
          alt="${this.escapeHtml(alt)}"
          class="${className}"
          loading="lazy"
          onload="this.classList.add('loaded')"
          onerror="this.classList.add('image-error')"
        />
        ${block.originalSrc ? `<div class="image-caption">${this.escapeHtml(block.originalSrc)}</div>` : ''}
      </div>
    `;
  }

  /**
   * Legacy method for fallback HTML processing
   */
  processBookContent(html, bookId) {
    console.log('Processing legacy HTML content');
    return html; // Return as-is for now, will be enhanced by WordHighlighter
  }

  /**
   * Cleanup blob URLs
   */
  cleanupBlobUrls() {
    for (const url of this.blobUrls) {
      URL.revokeObjectURL(url);
    }
    this.blobUrls.clear();
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy renderer and cleanup resources
   */
  destroy() {
    this.cleanupBlobUrls();
  }
}
