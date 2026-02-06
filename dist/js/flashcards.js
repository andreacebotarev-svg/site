/**
 * Flashcards Module - Stage 3
 * Vocabulary learning with card-based interface
 * Added: 3D flip animation, audio playback, favorites, mark as known
 */

class FlashcardsManager {
    constructor(vocabularyData) {
        this.vocabulary = vocabularyData || [];
        this.currentMode = 'list'; // 'list' or 'flashcards'
        this.currentCardIndex = 0;
        this.flashcardsContainer = null;
        this.listContainer = null;
        
        // Touch/swipe handling
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50;
        
        // User progress tracking
        this.favoriteWords = new Set(JSON.parse(localStorage.getItem('favoriteWords') || '[]'));
        this.knownWords = new Set(JSON.parse(localStorage.getItem('knownWords') || '[]'));
        
        console.log('🎴 FlashcardsManager initialized with', this.vocabulary.length, 'words');
        console.log('⭐ Favorites:', this.favoriteWords.size, '| ✓ Known:', this.knownWords.size);
    }

    /**
     * Initialize the flashcards system
     */
    init(listContainerId = 'vocabulary-list-container') {
        this.listContainer = document.getElementById(listContainerId);
        
        if (!this.listContainer) {
            console.error('List container not found:', listContainerId);
            return;
        }

        // Create flashcards container
        this.createFlashcardsContainer();
        
        // Create mode toggle buttons
        this.createModeToggle();
        
        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        console.log('✅ Flashcards module initialized');
    }

    /**
     * Create HTML structure for flashcards container
     */
    createFlashcardsContainer() {
        let container = document.getElementById('flashcards-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'flashcards-container';
            container.className = 'flashcards-container';
            container.style.display = 'none';
            
            if (this.listContainer.parentNode) {
                this.listContainer.parentNode.insertBefore(container, this.listContainer.nextSibling);
            }
        }
        
        this.flashcardsContainer = container;
    }

    /**
     * Create mode toggle buttons
     */
    createModeToggle() {
        let header = this.listContainer.previousElementSibling;
        
        if (!header || !header.classList.contains('vocabulary-header')) {
            header = document.createElement('div');
            header.className = 'vocabulary-header';
            this.listContainer.parentNode.insertBefore(header, this.listContainer);
        }

        const toggleHTML = `
            <div class="vocab-mode-toggle">
                <button class="vocab-mode-btn active" data-mode="list">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/>
                    </svg>
                    List
                </button>
                <button class="vocab-mode-btn" data-mode="flashcards">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3 2h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/>
                    </svg>
                    Flashcards
                </button>
            </div>
        `;

        header.insertAdjacentHTML('beforeend', toggleHTML);

        header.querySelectorAll('.vocab-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.toggleVocabularyMode(mode);
            });
        });
    }

    /**
     * Toggle between List and Flashcards modes
     */
    toggleVocabularyMode(mode) {
        if (mode !== 'list' && mode !== 'flashcards') {
            console.error('Invalid mode:', mode);
            return;
        }

        this.currentMode = mode;
        
        document.querySelectorAll('.vocab-mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');

        if (mode === 'list') {
            this.listContainer.style.display = 'block';
            this.flashcardsContainer.style.display = 'none';
        } else {
            this.listContainer.style.display = 'none';
            this.flashcardsContainer.style.display = 'flex';
            this.currentCardIndex = 0;
            this.renderFlashcardsContainer();
        }

        console.log(`🔄 Switched to ${mode} mode`);
    }

    /**
     * Render flashcards container
     */
    renderFlashcardsContainer() {
        if (this.vocabulary.length === 0) {
            this.flashcardsContainer.innerHTML = `
                <div class="flashcards-wrapper">
                    <div class="flashcard-placeholder">
                        <div class="placeholder-icon">⚠️</div>
                        <p class="placeholder-title">No vocabulary loaded</p>
                        <p class="placeholder-subtitle">Please add words to start learning</p>
                    </div>
                </div>
            `;
            return;
        }

        this.flashcardsContainer.innerHTML = `
            <div class="flashcards-wrapper">
                <div class="flashcards-header">
                    <h3>📚 Vocabulary Flashcards</h3>
                    <div class="flashcards-controls">
                        <div class="stats-badge">
                            <span>⭐ ${this.favoriteWords.size}</span>
                            <span>✓ ${this.knownWords.size}</span>
                        </div>
                    </div>
                </div>

                <div class="flashcard-stage">
                    <button class="flashcard-nav flashcard-nav-prev" id="flashcard-prev" aria-label="Previous card">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>

                    <div class="flashcard-container" id="flashcard-current"></div>

                    <button class="flashcard-nav flashcard-nav-next" id="flashcard-next" aria-label="Next card">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>

                <div class="flashcards-progress">
                    <div class="progress-dots" id="progress-dots"></div>
                    <div class="progress-text" id="progress-text">
                        ${this.currentCardIndex + 1} / ${this.vocabulary.length}
                    </div>
                </div>
            </div>
        `;

        this.renderCurrentCard();
        this.renderProgressDots();
        this.updateNavigationButtons();
        this.attachNavigationListeners();
        this.setupTouchSwipe();
    }

    /**
     * Render current card with flip functionality (Stage 3)
     */
    renderCurrentCard() {
        const cardContainer = document.getElementById('flashcard-current');
        if (!cardContainer) return;

        const word = this.vocabulary[this.currentCardIndex];
        if (!word) return;

        const wordId = word.word || word.id || this.currentCardIndex;
        const isFavorite = this.favoriteWords.has(wordId);
        const isKnown = this.knownWords.has(wordId);

        // Card with front and back
        const cardHTML = `
            <div class="flashcard-flip-container" data-index="${this.currentCardIndex}">
                <div class="flashcard-inner">
                    <!-- FRONT SIDE -->
                    <div class="flashcard-front">
                        <div class="flashcard-word">${word.word || ''}</div>
                        <div class="flashcard-transcription">${word.transcription || ''}</div>
                        <div class="flashcard-hint">👆 Click to flip</div>
                    </div>
                    
                    <!-- BACK SIDE -->
                    <div class="flashcard-back">
                        <div class="flashcard-translation">${word.translation || ''}</div>
                        ${word.example ? `<div class="flashcard-example">"${word.example}"</div>` : ''}
                        
                        <!-- Action Buttons -->
                        <div class="flashcard-actions">
                            <button class="action-btn audio-btn" data-word="${word.word}" title="Play audio">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 3l-6 5H1v4h3l6 5V3zm8.5 7c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM16 2.23v1.7c2.89.86 5 3.54 5 6.57s-2.11 5.71-5 6.57v1.7c3.73-.87 6.5-4.26 6.5-8.27s-2.77-7.4-6.5-8.27z"/>
                                </svg>
                            </button>
                            
                            <button class="action-btn favorite-btn ${isFavorite ? 'active' : ''}" data-word-id="${wordId}" title="Add to favorites">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                                </svg>
                            </button>
                            
                            <button class="action-btn known-btn ${isKnown ? 'active' : ''}" data-word-id="${wordId}" title="Mark as known">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 10l4 4 8-8"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        cardContainer.innerHTML = cardHTML;
        
        // Add entrance animation
        setTimeout(() => {
            const flipContainer = cardContainer.querySelector('.flashcard-flip-container');
            if (flipContainer) flipContainer.classList.add('flashcard-enter');
        }, 10);

        // Attach event listeners
        this.attachCardListeners();
    }

    /**
     * Attach event listeners to card (Stage 3)
     */
    attachCardListeners() {
        const flipContainer = document.querySelector('.flashcard-flip-container');
        const inner = document.querySelector('.flashcard-inner');
        const audioBtn = document.querySelector('.audio-btn');
        const favoriteBtn = document.querySelector('.favorite-btn');
        const knownBtn = document.querySelector('.known-btn');

        // Flip on click (front side)
        const frontSide = document.querySelector('.flashcard-front');
        if (frontSide) {
            frontSide.addEventListener('click', () => {
                inner.classList.toggle('flipped');
            });
        }

        // Audio button
        if (audioBtn) {
            audioBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const word = e.currentTarget.dataset.word;
                this.playAudio(word);
            });
        }

        // Favorite button
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wordId = e.currentTarget.dataset.wordId;
                this.toggleFavorite(wordId, e.currentTarget);
            });
        }

        // Known button
        if (knownBtn) {
            knownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wordId = e.currentTarget.dataset.wordId;
                this.toggleKnown(wordId, e.currentTarget);
            });
        }
    }

    /**
     * Play audio using TTS (integrated with existing speak function)
     */
    playAudio(word) {
        console.log('🔊 Playing audio:', word);
        
        // Use existing speak function if available
        if (typeof window.speak === 'function') {
            window.speak(word);
        } else {
            // Fallback TTS
            this.fallbackSpeak(word);
        }

        // Visual feedback
        const audioBtn = document.querySelector('.audio-btn');
        if (audioBtn) {
            audioBtn.classList.add('playing');
            setTimeout(() => audioBtn.classList.remove('playing'), 1000);
        }
    }

    /**
     * Fallback TTS implementation
     */
    fallbackSpeak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        } else {
            // Google Translate TTS fallback
            const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`);
            audio.play().catch(e => console.log('Audio play error:', e));
        }
    }

    /**
     * Toggle favorite status
     */
    toggleFavorite(wordId, button) {
        if (this.favoriteWords.has(wordId)) {
            this.favoriteWords.delete(wordId);
            button.classList.remove('active');
            button.querySelector('svg').setAttribute('fill', 'none');
            console.log('⭐ Removed from favorites:', wordId);
        } else {
            this.favoriteWords.add(wordId);
            button.classList.add('active');
            button.querySelector('svg').setAttribute('fill', 'currentColor');
            console.log('⭐ Added to favorites:', wordId);
        }

        // Save to localStorage
        localStorage.setItem('favoriteWords', JSON.stringify([...this.favoriteWords]));
        
        // Update stats badge
        this.updateStatsBadge();
    }

    /**
     * Toggle known status
     */
    toggleKnown(wordId, button) {
        if (this.knownWords.has(wordId)) {
            this.knownWords.delete(wordId);
            button.classList.remove('active');
            console.log('✓ Unmarked as known:', wordId);
        } else {
            this.knownWords.add(wordId);
            button.classList.add('active');
            console.log('✓ Marked as known:', wordId);
        }

        // Save to localStorage
        localStorage.setItem('knownWords', JSON.stringify([...this.knownWords]));
        
        // Update stats badge
        this.updateStatsBadge();
    }

    /**
     * Update stats badge
     */
    updateStatsBadge() {
        const badge = document.querySelector('.stats-badge');
        if (badge) {
            badge.innerHTML = `
                <span>⭐ ${this.favoriteWords.size}</span>
                <span>✓ ${this.knownWords.size}</span>
            `;
        }
    }

    /**
     * Render progress dots
     */
    renderProgressDots() {
        const dotsContainer = document.getElementById('progress-dots');
        if (!dotsContainer) return;

        const maxDots = 20;
        const showDots = this.vocabulary.length <= maxDots;

        if (!showDots) {
            dotsContainer.style.display = 'none';
            return;
        }

        dotsContainer.style.display = 'flex';
        dotsContainer.innerHTML = this.vocabulary
            .map((_, index) => {
                const isActive = index === this.currentCardIndex;
                return `<div class="progress-dot ${isActive ? 'active' : ''}" data-index="${index}"></div>`;
            })
            .join('');

        dotsContainer.querySelectorAll('.progress-dot').forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToCard(index));
        });
    }

    /**
     * Update progress
     */
    updateProgress() {
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            progressText.textContent = `${this.currentCardIndex + 1} / ${this.vocabulary.length}`;
        }

        document.querySelectorAll('.progress-dot').forEach((dot, index) => {
            if (index === this.currentCardIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('flashcard-prev');
        const nextBtn = document.getElementById('flashcard-next');

        if (prevBtn) prevBtn.disabled = this.currentCardIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentCardIndex === this.vocabulary.length - 1;
    }

    /**
     * Attach navigation listeners
     */
    attachNavigationListeners() {
        const prevBtn = document.getElementById('flashcard-prev');
        const nextBtn = document.getElementById('flashcard-next');

        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateCard('prev'));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateCard('next'));
    }

    /**
     * Navigate cards
     */
    navigateCard(direction) {
        if (direction === 'prev' && this.currentCardIndex > 0) {
            this.currentCardIndex--;
        } else if (direction === 'next' && this.currentCardIndex < this.vocabulary.length - 1) {
            this.currentCardIndex++;
        } else {
            return;
        }

        this.renderCurrentCard();
        this.updateProgress();
        this.updateNavigationButtons();
    }

    /**
     * Go to specific card
     */
    goToCard(index) {
        if (index < 0 || index >= this.vocabulary.length) return;
        
        this.currentCardIndex = index;
        this.renderCurrentCard();
        this.updateProgress();
        this.updateNavigationButtons();
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.currentMode !== 'flashcards') return;

            switch(e.key) {
                case 'ArrowLeft':
                    this.navigateCard('prev');
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.navigateCard('next');
                    e.preventDefault();
                    break;
                case ' ':
                    // Flip card on spacebar
                    const inner = document.querySelector('.flashcard-inner');
                    if (inner) inner.classList.toggle('flipped');
                    e.preventDefault();
                    break;
            }
        });
    }

    /**
     * Setup touch swipe
     */
    setupTouchSwipe() {
        const cardContainer = document.getElementById('flashcard-current');
        if (!cardContainer) return;

        cardContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        cardContainer.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    }

    /**
     * Handle swipe
     */
    handleSwipe() {
        const swipeDistance = this.touchEndX - this.touchStartX;

        if (Math.abs(swipeDistance) < this.minSwipeDistance) return;

        if (swipeDistance > 0) {
            this.navigateCard('prev');
        } else {
            this.navigateCard('next');
        }
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlashcardsManager;
}
