/**
 * Library View
 * Displays available books and reading materials
 */
import { bookService } from '../services/book-service.js';
import { logger } from '../utils/logger.js';
import { DropZone } from '../ui/components/DropZone.js';
import { Skeleton } from '../ui/components/Skeleton.js';
import { toastManager } from '../ui/managers/ToastManager.js';
import { modalManager } from '../ui/managers/ModalManager.js';

const libLogger = logger.createChild('LibraryView');

export class LibraryView {
  constructor(container) {
    this.container = container;
    this.books = [];
    this.dropzone = null;
  }

  async render() {
    // 1. Render Hero Section + Content
    this.container.innerHTML = `
      <main class="library-container">
        <!-- Hero Section -->
        <section class="hero-section">
          <div class="hero-background">
            <div class="hero-gradient"></div>
            <div class="floating-particles"></div>
          </div>

          <div class="hero-content">
            <div class="hero-glass-card">
              <h1 class="hero-title">
                <span class="hero-title-main">Твоя цифровая</span>
                <span class="hero-title-accent">библиотека</span>
              </h1>
              <p class="hero-subtitle">Открывай, читай и собирай любимые книги в своем уютном пространстве</p>

              <div class="hero-stats">
                <div class="stat-item">
                  <span class="stat-number" id="book-count">0</span>
                  <span class="stat-label">Книги</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number" id="reading-hours">0</span>
                  <span class="stat-label">Часы чтения</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number" id="completed-books">0</span>
                  <span class="stat-label">Прочитано</span>
                </div>
              </div>
            </div>

            <!-- Demo Features Grid -->
            <div class="demo-features-grid">
              <div class="demo-feature-card">
                <div class="demo-feature-icon">✨</div>
                <div class="demo-feature-content">
                  <h3>Умный контекст</h3>
                  <p>Нажми на любое слово для перевода с учетом окружающего текста</p>
                </div>
              </div>
              <div class="demo-feature-card">
                <div class="demo-feature-icon">🎴</div>
                <div class="demo-feature-content">
                  <h3>Быстрое заучивание</h3>
                  <p>Сохраняй новые слова в один клик и тренируй их с помощью флеш-карточек</p>
                </div>
              </div>
              <div class="demo-feature-card">
                <div class="demo-feature-icon">📚</div>
                <div class="demo-feature-content">
                  <h3>Свои книги</h3>
                  <p>Загружай книги в форматах FB2, EPUB и TXT и читай их в удобной читалке</p>
                </div>
              </div>
            </div>

            <!-- Floating Action Button -->
            <button class="fab-main" id="fab-main" title="Быстрое действие">
              <span class="fab-icon">⚡</span>
              <span class="fab-label">Добавить</span>
            </button>
          </div>
        </section>

        <!-- Content Section -->
        <section class="content-section">
          <div class="library-content">
            <!-- Search & Filter Bar -->
            <div class="search-bar-glass">
              <div class="search-input-wrapper">
                <input type="text" class="search-input" id="search-input" placeholder="Поиск по библиотеке...">
                <div class="search-icon">🔍</div>
              </div>

              <div class="filter-buttons">
                <button class="filter-btn active" data-filter="all">Все</button>
                <button class="filter-btn" data-filter="reading">Читаю</button>
                <button class="filter-btn" data-filter="completed">Прочитано</button>
                <button class="filter-btn" data-filter="favorites">⭐</button>
              </div>
            </div>

            <!-- Books Grid -->
            <div class="books-masonry">
              <div id="dropzone-container" class="dropzone-wrapper"></div>
              <div id="books-container" class="books-section">
                ${Skeleton.bookGrid(6)}
              </div>
            </div>
          </div>
        </section>
      </main>
    `;

    // 2. Setup Components
    this.setupSearch();
    this.setupFilters();
    this.setupDropZone();
    this.setupFAB();

    // 3. Setup Parallax Effects
    this.setupParallax();

    // 4. Load Books
    await this.loadBooks();
  }

  setupParallax() {
    // Parallax effect for hero background
    const heroBackground = this.container.querySelector('.hero-background');
    if (!heroBackground) return;

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * 0.5;
      heroBackground.style.transform = `translateY(${rate}px)`;
    };

    // Throttle scroll events for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Intersection Observer for enhanced animations
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe book cards for staggered animations
    setTimeout(() => {
      const bookCards = this.container.querySelectorAll('.book-card');
      bookCards.forEach((card) => observer.observe(card));
    }, 100);
  }

  setupSearch() {
    const searchInput = this.container.querySelector('#search-input');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filterBooks(e.target.value);
      }, 300);
    });
  }

  setupFilters() {
    const filterButtons = this.container.querySelectorAll('.filter-btn');
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach((b) => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        this.applyFilter(filter);
      });
    });
  }

  setupFAB() {
    const fab = this.container.querySelector('#fab-main');
    if (!fab) return;

    fab.addEventListener('click', () => {
      const dropzone = this.container.querySelector('#dropzone-container');
      if (dropzone) {
        dropzone.scrollIntoView({ behavior: 'smooth' });
        // Trigger file input click
        const fileInput = dropzone.querySelector('input[type="file"]');
        if (fileInput) fileInput.click();
      }
    });
  }

  setupDropZone() {
    const dropzoneContainer = this.container.querySelector('#dropzone-container');
    if (!dropzoneContainer) return;

    this.dropzone = new DropZone(dropzoneContainer, {
      accept: ['.fb2', '.epub', '.txt'],
      multiple: true,
      onUpload: (file, index, total) => this.handleFileUpload(file, index, total),
      onError: (errors) => {
        toastManager.error(errors[0], {
          title: 'Upload Error',
          actions: [{ label: 'Dismiss', onClick: () => {} }],
        });
      },
    });
  }

  async loadBooks() {
    try {
      // ✅ ADDED: Ensure server books are ingested into IndexedDB before rendering
      await this.loadMetadata();

      this.books = await bookService.getAllBooks();
      this.updateStats();
      this.renderBooks();
      libLogger.info('Books loaded', { count: this.books.length });
    } catch (error) {
      libLogger.error('Failed to load books', error);
      toastManager.error('Failed to load library books');
      this.books = [];
      this.updateStats();
      this.renderBooks(); // Render empty state
    }
  }

  // Add this method to the LibraryView class
  async loadMetadata() {
    try {
      // 1. Fetch the server manifest with cache-busting to bypass SW cache
      const cacheBuster = Date.now();
      const response = await fetch(`books/metadata.json?v=${cacheBuster}`);
      if (!response.ok) {
        libLogger.warn('metadata.json not found, skipping server books');
        return;
      }

      const metadata = await response.json();
      const serverBooks = metadata.books || [];

      // 2. Process books sequentially to prevent race conditions
      let booksAdded = 0;

      for (const serverBook of serverBooks) {
        // Check if book exists in IndexedDB (Source of Truth)
        const existingBook = await bookService.getBook(serverBook.id);

        if (!existingBook) {
          libLogger.info(`Downloading new server book: ${serverBook.title}`);

          try {
            // 3. Fetch the actual EPUB file as a Blob with cache-busting
            const bookResponse = await fetch(`books/${serverBook.file}?v=${cacheBuster}`);
            if (!bookResponse.ok) throw new Error(`Failed to fetch ${serverBook.file}`);

            const blob = await bookResponse.blob();

            // 4. Parse content (Required for the Reader to work)
            // We use the ID from metadata to ensure consistency
            const content = await bookService.parseContent(blob, serverBook.format, serverBook.id);

            // 5. Construct the full book object matching the DB schema
            const newBook = {
              ...serverBook,
              // Ensure essential fields from the parsed content are present
              author: content.metadata.author || serverBook.author,
              description: content.metadata.description || serverBook.description,
              // Important: Mark source as server to distinguish from user uploads
              source: 'server',
              addedAt: Date.now(),
            };

            // 6. Persist to IndexedDB
            await bookService.addBook(newBook);
            await bookService.saveBookContent(newBook.id, content);

            // Optional: Handle images if the parser extracted them (see handleFileUpload)
            const imagesToSave = content.images || bookService.epubParser.imageBlobs;
            if (imagesToSave && imagesToSave.size > 0) {
              const { imageStorage } = await import('../services/image-storage.js');
              const savePromises = Array.from(imagesToSave.entries()).map(([path, imgBlob]) =>
                imageStorage.saveImage(newBook.id, path, imgBlob)
              );
              await Promise.all(savePromises);
            }

            booksAdded++;
            toastManager.success(`Добавлена базовая книга: ${serverBook.title}`);
            
            // Reload books instantly so the grid updates without refresh
            this.books = await bookService.getAllBooks();
            this.updateStats();
            this.renderBooks();

          } catch (err) {
            libLogger.error(`Failed to ingest server book ${serverBook.id}`, err);
            toastManager.error(`Не удалось загрузить книгу: ${serverBook.title}`);
          }
        }
      }

      if (booksAdded > 0) {
        libLogger.info(`Successfully initialized ${booksAdded} server books`);
        // Toast is optional here, usually silent init is better for UX
      }
    } catch (error) {
      libLogger.error('Failed to load metadata pipeline', error);
    }
  }

  updateStats() {
    const bookCount = this.books.length;
    const completedBooks = this.books.filter((book) => book.progress === 100).length;
    const totalReadingTime = this.books.reduce((sum, book) => sum + (book.readingTime || 0), 0);

    // Update hero stats
    const bookCountEl = this.container.querySelector('#book-count');
    const readingHoursEl = this.container.querySelector('#reading-hours');
    const completedBooksEl = this.container.querySelector('#completed-books');

    if (bookCountEl) bookCountEl.textContent = bookCount;
    if (readingHoursEl) readingHoursEl.textContent = Math.round(totalReadingTime / 60);
    if (completedBooksEl) completedBooksEl.textContent = completedBooks;
  }

  filterBooks(query) {
    const booksContainer = this.container.querySelector('#books-container');
    if (!booksContainer) return;

    const cards = booksContainer.querySelectorAll('.book-card');
    const lowerQuery = query.toLowerCase();

    cards.forEach((card) => {
      const title = card.querySelector('.book-title')?.textContent.toLowerCase() || '';
      const author = card.querySelector('.book-author')?.textContent.toLowerCase() || '';

      const matches = title.includes(lowerQuery) || author.includes(lowerQuery);
      card.style.display = matches || !query ? 'block' : 'none';
    });
  }

  applyFilter(filter) {
    const booksContainer = this.container.querySelector('#books-container');
    if (!booksContainer) return;

    const cards = booksContainer.querySelectorAll('.book-card');

    cards.forEach((card) => {
      const bookData = this.books.find((b) => b.id === card.dataset.bookId);
      if (!bookData) return;

      let show = true;

      switch (filter) {
        case 'reading':
          show = bookData.progress > 0 && bookData.progress < 100;
          break;
        case 'completed':
          show = bookData.progress === 100;
          break;
        case 'favorites':
          show = bookData.favorite === true;
          break;
        case 'all':
        default:
          show = true;
          break;
      }

      card.style.display = show ? 'block' : 'none';
    });
  }

  renderBooks() {
    const booksContainer = this.container.querySelector('#books-container');
    const statsElement = this.container.querySelector('.library-stats');

    if (!booksContainer) return;

    // Update stats
    if (statsElement) {
      const bookCount = this.books.length;

      const lastDigit = bookCount % 10;
      const lastTwoDigits = bookCount % 100;
      let word = 'книг';
      if (lastTwoDigits < 11 || lastTwoDigits > 14) {
        if (lastDigit === 1) word = 'книга';
        else if (lastDigit >= 2 && lastDigit <= 4) word = 'книги';
      }

      statsElement.textContent = `${bookCount} ${word}`;
    }

    if (this.books.length === 0) {
      this.renderEmptyState(booksContainer);
      return;
    }

    booksContainer.innerHTML = this.books
      .map((book, index) => this.renderBookCard(book, index))
      .join('');

    // Add click and keyboard handlers
    booksContainer.querySelectorAll('.book-card').forEach((card) => {
      // Click handler
      card.addEventListener('click', (e) => {
        // Prevent click if clicking delete button (if we add one)
        if (e.target.closest('.btn-delete')) return;

        const bookId = card.dataset.bookId;
        const book = this.books.find((b) => b.id === bookId);
        if (book) {
          this.handleBookClick(book);
        }
      });

      // Keyboard handler
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const bookId = card.dataset.bookId;
          const book = this.books.find((b) => b.id === bookId);
          if (book) {
            this.handleBookClick(book);
          }
        }
      });

      // Context menu or delete button could be added here
      const deleteBtn = card.querySelector('.btn-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleDeleteBook(card.dataset.bookId);
        });
      }
    });
  }

  renderEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3 class="empty-state-title">Ваша библиотека пуста</h3>
        <p class="empty-state-text">Начните собирать свою цифровую коллекцию, добавив первую книгу</p>

        <div class="empty-state-actions">
          <a href="#/settings" class="empty-state-action">
            <span>⚙️</span> Настройки
          </a>
          <button class="empty-state-action" onclick="document.querySelector('#fab-main').click()">
            <span>📖</span> Добавьте первую книгу
          </button>
        </div>
      </div>
    `;
  }

  renderBookCard(book, index = 0) {
    const cover = this.getBookCover(book);
    const wordCount = book.wordCount ? this.formatNumber(book.wordCount) : 'Unknown';
    const format = book.format ? book.format.toUpperCase() : 'TXT';

    return `
      <div class="book-card card-interactive ${book.source === 'server' ? 'server-book' : ''}" data-book-id="${book.id}" tabindex="0" role="button" aria-label="Читать ${this.escapeHtml(book.title)}" style="--card-index: ${index}">
        ${book.source === 'server' ? '<div class="server-badge">Учебник</div>' : ''}
        <div class="book-cover">${cover}</div>
        <div class="book-card-header">
          <h3 class="book-title" title="${this.escapeHtml(book.title)}">${this.escapeHtml(book.title || 'Без названия')}</h3>
          <button class="btn-delete" aria-label="Удалить книгу" title="Удалить книгу">
            <span>🗑️</span>
          </button>
        </div>
        <p class="book-author">${this.escapeHtml(book.author || 'Неизвестный автор')}</p>
        ${book.description ? `<p class="book-description">${this.escapeHtml(book.description.substring(0, 120))}${book.description.length > 120 ? '...' : ''}</p>` : ''}
        <div class="book-meta">
          <div class="book-meta-info">
            <span class="book-word-count">${wordCount} слов</span>
          </div>
          <span class="book-format">${format}</span>
        </div>
      </div>
    `;
  }

  getBookCover(book) {
    // Handle different cover formats
    if (!book.cover) {
      return '📖';
    }

    // If cover is a reference to binary data (FB2)
    if (typeof book.cover === 'object' && book.cover.type === 'reference') {
      // For now, use emoji - in future could load from IndexedDB
      return '📚';
    }

    // If cover is a URL or path
    if (typeof book.cover === 'string') {
      // Check if it's a valid image URL
      if (
        book.cover.startsWith('http') ||
        book.cover.startsWith('./') ||
        book.cover.startsWith('../')
      ) {
        return `<img src="${this.escapeHtml(book.cover)}" alt="Book cover" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                 <span style="display: none;">📖</span>`;
      }

      // If it's just a filename, assume it's in books directory
      if (book.cover.includes('.') && !book.cover.includes(' ')) {
        return `<img src="./books/${this.escapeHtml(book.cover)}" alt="Book cover" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                 <span style="display: none;">📖</span>`;
      }

      // Otherwise use as emoji or text
      return book.cover;
    }

    // Default fallback
    return '📖';
  }

  async handleFileUpload(file, index, total) {
    try {
      // 1. Generate book ID first (needed for image blob storage)
      const extension = file.name.split('.').pop().toLowerCase();
      const bookId = this.generateBookId(file.name);

      // Show processing toast if it's a large file or just to give feedback
      // The DropZone handles the progress UI, but we can add logic here

      // We use bookService to parse.
      // Note: We might want to optimize this by only parsing metadata if possible,
      // but parseContent does it all. For big files this might be slow on main thread
      // without the worker (which is in the plan but maybe not fully integrated in `BookService` yet for main thread usage?).
      // The `BookService` we wrote uses `fb2Parser.parse(file)`.

      const content = await bookService.parseContent(file, extension, bookId);

      // 🚨 CRITICAL FIX: Save extracted images to permanent storage
      // EPUB parser extracts images to memory but doesn't save them permanently

      // ✅ FIX: Use images from returned content instead of singleton state
      // This eliminates race conditions when multiple books are loaded simultaneously
      const imagesToSave = content.images || bookService.epubParser.imageBlobs;

      if (extension === 'epub' && imagesToSave && imagesToSave.size > 0) {
        libLogger.info(`Saving ${imagesToSave.size} images for book ${bookId}...`);

        // Import imageStorage and save all extracted images
        const { imageStorage } = await import('../services/image-storage.js');

        const savePromises = Array.from(imagesToSave.entries()).map(([imagePath, blob]) =>
          imageStorage.saveImage(bookId, imagePath, blob)
        );

        await Promise.all(savePromises);
        libLogger.info(`✅ Saved ${imagesToSave.size} images to storage`);
      }

      // 2. Create book object
      const book = {
        id: bookId,
        title: content.metadata.title || file.name.replace(/\.[^/.]+$/, ''),
        author: content.metadata.author || 'Unknown',
        description: content.metadata.description || '',
        file: file, // Store the Blob
        format: extension,
        source: 'upload',
        uploadedAt: Date.now(),
        size: file.size,
        wordCount: content.wordCount || 0,
      };

      // 3. Add to library
      await bookService.addBook(book);

      // 4. Cache content (optional, but good for performance)
      // Save book content to IndexedDB for offline access
      // Use the proper service method that formats data correctly
      await bookService.saveBookContent(book.id, content);

      // 5. Update UI
      // If it's the last file, reload the list
      if (index === total - 1) {
        toastManager.success(`Imported ${total} book${total > 1 ? 's' : ''}`);
        await this.loadBooks();
      }

      libLogger.info('Book uploaded', { id: book.id, title: book.title });
      return book;
    } catch (error) {
      libLogger.error('Upload failed', error);
      throw error; // DropZone catches this
    }
  }

  handleBookClick(book) {
    window.location.hash = `#/reader/${book.id}`;
  }

  async handleDeleteBook(bookId) {
    const book = this.books.find((b) => b.id === bookId);
    if (!book) return;

    // Show confirmation modal
    modalManager.show({
      title: 'Удалить книгу',
      content: `
        <p>Вы уверены, что хотите удалить "<strong>${this.escapeHtml(book.title)}</strong>"?</p>
        <p class="text-muted">Это действие нельзя отменить.</p>
      `,
      actions: [
        {
          label: 'Отмена',
          type: 'secondary',
          onClick: () => modalManager.close(),
        },
        {
          label: 'Удалить',
          type: 'danger',
          onClick: async () => {
            try {
              modalManager.close();

              // Show loading state
              toastManager.info('Deleting book...', { title: 'Deleting' });

              // Remove from service
              const success = await bookService.removeBook(bookId);

              if (success) {
                // Remove from local books array
                this.books = this.books.filter((b) => b.id !== bookId);

                // Re-render the books list
                this.renderBooks();

                // Show success message
                toastManager.success(`"${book.title}" has been deleted`, {
                  title: 'Book Deleted',
                  duration: 3000,
                });

                libLogger.info('Book deleted', { bookId, title: book.title });
              } else {
                throw new Error('Failed to delete book');
              }
            } catch (error) {
              libLogger.error('Failed to delete book', error, { bookId });
              toastManager.error('Failed to delete book. Please try again.', {
                title: 'Delete Failed',
                actions: [
                  {
                    label: 'Retry',
                    onClick: () => this.handleDeleteBook(bookId),
                  },
                ],
              });
            }
          },
        },
      ],
    });
  }

  generateBookId(filename) {
    const base = filename
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    return `${base}-${Date.now()}`;
  }

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.dropzone) {
      this.dropzone.destroy();
    }
    // Remove event listeners if any global ones
  }
}
