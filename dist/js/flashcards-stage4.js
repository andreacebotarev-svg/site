/**
 * Flashcards Module - Stage 4
 * Advanced features: Progress tracking, Quiz mode, Shuffle, Themes
 */

class FlashcardsManagerStage4 {
    constructor(vocabularyData) {
        this.vocabulary = vocabularyData || [];
        this.originalVocabulary = [...vocabularyData]; // Keep original order
        this.currentMode = 'list'; // 'list' or 'flashcards' or 'quiz'
        this.currentCardIndex = 0;
        this.flashcardsContainer = null;
        this.listContainer = null;
        
        // Touch/swipe handling
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50;
        
        // User progress tracking (Stage 4)
        this.favoriteWords = new Set(JSON.parse(localStorage.getItem('favoriteWords') || '[]'));
        this.knownWords = new Set(JSON.parse(localStorage.getItem('knownWords') || '[]'));
        this.studySessions = JSON.parse(localStorage.getItem('studySessions') || '[]');
        this.wordStats = JSON.parse(localStorage.getItem('wordStats') || '{}');
        
        // Quiz mode (Stage 4)
        this.quizMode = false;
        this.quizScore = 0;
        this.quizTotal = 0;
        this.quizAnswered = new Set();
        
        // Theme (Stage 4)
        this.currentTheme = localStorage.getItem('flashcardTheme') || 'purple';
        
        // Shuffle state (Stage 4)
        this.isShuffled = false;
        
        console.log('🎮 FlashcardsManager Stage 4 initialized');
        console.log('⭐ Favorites:', this.favoriteWords.size, '| ✓ Known:', this.knownWords.size);
        console.log('📊 Study sessions:', this.studySessions.length);
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
        
        // Apply theme
        this.applyTheme(this.currentTheme);
        
        // Start session tracking
        this.startSession();
        
        console.log('✅ Flashcards Stage 4 initialized');
    }

    /**
     * Start new study session (Stage 4)
     */
    startSession() {
        this.sessionStartTime = Date.now();
        this.sessionCardsViewed = new Set();
        console.log('📚 Study session started');
    }

    /**
     * End study session and save stats (Stage 4)
     */
    endSession() {
        const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const session = {
            date: new Date().toISOString(),
            duration: duration,
            cardsViewed: this.sessionCardsViewed.size,
            mode: this.quizMode ? 'quiz' : 'flashcards',
            score: this.quizMode ? this.quizScore : null
        };
        
        this.studySessions.push(session);
        localStorage.setItem('studySessions', JSON.stringify(this.studySessions));
        console.log('📊 Session saved:', session);
    }

    /**
     * Track word view (Stage 4)
     */
    trackWordView(wordId) {
        this.sessionCardsViewed.add(wordId);
        
        if (!this.wordStats[wordId]) {
            this.wordStats[wordId] = { views: 0, lastViewed: null };
        }
        
        this.wordStats[wordId].views++;
        this.wordStats[wordId].lastViewed = new Date().toISOString();
        
        localStorage.setItem('wordStats', JSON.stringify(this.wordStats));
    }

    /**
     * Create flashcards container
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
     * Create mode toggle buttons (Stage 4 - added Quiz mode)
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
                <button class="vocab-mode-btn" data-mode="quiz">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm0 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-3.5V10H7V6h2v2.5z"/>
                    </svg>
                    Quiz
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
     * Toggle between List, Flashcards, and Quiz modes (Stage 4)
     */
    toggleVocabularyMode(mode) {
        if (!['list', 'flashcards', 'quiz'].includes(mode)) {
            console.error('Invalid mode:', mode);
            return;
        }

        this.currentMode = mode;
        this.quizMode = (mode === 'quiz');
        
        document.querySelectorAll('.vocab-mode-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');

        if (mode === 'list') {
            this.listContainer.style.display = 'block';
            this.flashcardsContainer.style.display = 'none';
            this.endSession();
        } else {
            this.listContainer.style.display = 'none';
            this.flashcardsContainer.style.display = 'flex';
            this.currentCardIndex = 0;
            
            if (mode === 'quiz') {
                this.startQuiz();
            } else {
                this.renderFlashcardsContainer();
            }
        }

        console.log(`🔄 Switched to ${mode} mode`);
    }

    /**
     * Start Quiz Mode (Stage 4)
     */
    startQuiz() {
        this.quizScore = 0;
        this.quizTotal = 0;
        this.quizAnswered = new Set();
        
        // Shuffle vocabulary for quiz
        this.vocabulary = this.shuffleArray([...this.originalVocabulary]);
        
        this.renderQuizContainer();
        console.log('🎮 Quiz mode started');
    }

    /**
     * Render Quiz Container (Stage 4)
     */
    renderQuizContainer() {
        if (this.vocabulary.length === 0) {
            this.flashcardsContainer.innerHTML = `
                <div class="flashcards-wrapper">
                    <div class="flashcard-placeholder">
                        <div class="placeholder-icon">⚠️</div>
                        <p class="placeholder-title">No vocabulary loaded</p>
                    </div>
                </div>
            `;
            return;
        }

        this.flashcardsContainer.innerHTML = `
            <div class="flashcards-wrapper quiz-mode">
                <div class="flashcards-header">
                    <h3>🎮 Quiz Mode</h3>
                    <div class="quiz-stats">
                        <div class="quiz-score">
                            <span class="score-label">Score:</span>
                            <span class="score-value" id="quiz-score">0 / 0</span>
                        </div>
                        <div class="quiz-accuracy" id="quiz-accuracy">0%</div>
                    </div>
                </div>

                <div class="quiz-card-container" id="quiz-card"></div>

                <div class="flashcards-progress">
                    <div class="progress-text" id="progress-text">
                        ${this.currentCardIndex + 1} / ${this.vocabulary.length}
                    </div>
                </div>
            </div>
        `;

        this.renderQuizCard();
    }

    /**
     * Render Quiz Card (Stage 4)
     */
    renderQuizCard() {
        const quizCard = document.getElementById('quiz-card');
        if (!quizCard) return;

        const word = this.vocabulary[this.currentCardIndex];
        if (!word) return;

        const wordId = word.word || this.currentCardIndex;
        
        // Generate 3 wrong answers
        const wrongAnswers = this.generateWrongAnswers(word, 3);
        const allAnswers = this.shuffleArray([word.translation, ...wrongAnswers]);

        const cardHTML = `
            <div class="quiz-question-card">
                <div class="quiz-word">${word.word}</div>
                <div class="quiz-transcription">${word.transcription || ''}</div>
                
                <div class="quiz-hint">Choose the correct translation:</div>
                
                <div class="quiz-options">
                    ${allAnswers.map((answer, index) => `
                        <button class="quiz-option" data-answer="${answer}" data-correct="${answer === word.translation}">
                            ${String.fromCharCode(65 + index)}. ${answer}
                        </button>
                    `).join('')}
                </div>
                
                <div class="quiz-feedback" id="quiz-feedback"></div>
            </div>
        `;

        quizCard.innerHTML = cardHTML;
        
        // Track view
        this.trackWordView(wordId);
        
        // Attach listeners
        this.attachQuizListeners();
    }

    /**
     * Generate wrong answers for quiz (Stage 4)
     */
    generateWrongAnswers(correctWord, count) {
        const wrongAnswers = [];
        const availableWords = this.vocabulary.filter(w => w.word !== correctWord.word);
        
        for (let i = 0; i < count && i < availableWords.length; i++) {
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            const wrongWord = availableWords.splice(randomIndex, 1)[0];
            wrongAnswers.push(wrongWord.translation);
        }
        
        return wrongAnswers;
    }

    /**
     * Attach Quiz Listeners (Stage 4)
     */
    attachQuizListeners() {
        const options = document.querySelectorAll('.quiz-option');
        const feedback = document.getElementById('quiz-feedback');
        
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const isCorrect = button.dataset.correct === 'true';
                
                // Disable all options
                options.forEach(opt => opt.disabled = true);
                
                this.quizTotal++;
                
                if (isCorrect) {
                    this.quizScore++;
                    button.classList.add('correct');
                    feedback.innerHTML = '<span class="feedback-correct">✓ Correct!</span>';
                    
                    // Play audio
                    const word = this.vocabulary[this.currentCardIndex];
                    if (word) this.playAudio(word.word);
                } else {
                    button.classList.add('wrong');
                    // Highlight correct answer
                    options.forEach(opt => {
                        if (opt.dataset.correct === 'true') {
                            opt.classList.add('correct');
                        }
                    });
                    feedback.innerHTML = '<span class="feedback-wrong">✗ Wrong. Try again!</span>';
                }
                
                // Update stats
                this.updateQuizStats();
                
                // Auto-advance after 1.5 seconds
                setTimeout(() => {
                    if (this.currentCardIndex < this.vocabulary.length - 1) {
                        this.currentCardIndex++;
                        this.renderQuizCard();
                        this.updateProgress();
                    } else {
                        this.showQuizResults();
                    }
                }, 1500);
            });
        });
    }

    /**
     * Update Quiz Stats (Stage 4)
     */
    updateQuizStats() {
        const scoreElement = document.getElementById('quiz-score');
        const accuracyElement = document.getElementById('quiz-accuracy');
        
        if (scoreElement) {
            scoreElement.textContent = `${this.quizScore} / ${this.quizTotal}`;
        }
        
        if (accuracyElement && this.quizTotal > 0) {
            const accuracy = Math.round((this.quizScore / this.quizTotal) * 100);
            accuracyElement.textContent = `${accuracy}%`;
            
            // Color coding
            if (accuracy >= 80) {
                accuracyElement.style.color = '#4CAF50';
            } else if (accuracy >= 60) {
                accuracyElement.style.color = '#FF9800';
            } else {
                accuracyElement.style.color = '#F44336';
            }
        }
    }

    /**
     * Show Quiz Results (Stage 4)
     */
    showQuizResults() {
        const accuracy = Math.round((this.quizScore / this.quizTotal) * 100);
        const emoji = accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪';
        const message = accuracy >= 80 ? 'Excellent!' : accuracy >= 60 ? 'Good job!' : 'Keep practicing!';
        
        this.flashcardsContainer.innerHTML = `
            <div class="flashcards-wrapper">
                <div class="quiz-results">
                    <div class="results-icon">${emoji}</div>
                    <h2>Quiz Complete!</h2>
                    <div class="results-stats">
                        <div class="stat-item">
                            <div class="stat-value">${this.quizScore} / ${this.quizTotal}</div>
                            <div class="stat-label">Correct Answers</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${accuracy}%</div>
                            <div class="stat-label">Accuracy</div>
                        </div>
                    </div>
                    <p class="results-message">${message}</p>
                    <div class="results-actions">
                        <button class="action-btn-large" onclick="location.reload()">Try Again</button>
                        <button class="action-btn-large secondary" onclick="flashcards.toggleVocabularyMode('list')">Back to List</button>
                    </div>
                </div>
            </div>
        `;
        
        // Save session
        this.endSession();
    }

    /**
     * Render Flashcards Container (Stage 4 - with controls)
     */
    renderFlashcardsContainer() {
        if (this.vocabulary.length === 0) {
            this.flashcardsContainer.innerHTML = `
                <div class="flashcards-wrapper">
                    <div class="flashcard-placeholder">
                        <div class="placeholder-icon">📚</div>
                        <p class="placeholder-title">No vocabulary loaded</p>
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
                        <button class="control-btn" id="shuffle-btn" title="Shuffle cards">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M14 4l4 4-4 4V9H9V7h5V4zM6 11l-4 4 4 4v-3h5v-2H6v-3z"/>
                            </svg>
                        </button>
                        <button class="control-btn" id="theme-btn" title="Change theme">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 14V4a6 6 0 1 1 0 12z"/>
                            </svg>
                        </button>
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
        this.attachControlListeners();
        this.setupTouchSwipe();
    }

    /**
     * Attach Control Listeners (Stage 4)
     */
    attachControlListeners() {
        const shuffleBtn = document.getElementById('shuffle-btn');
        const themeBtn = document.getElementById('theme-btn');
        
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        }
        
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.cycleTheme());
        }
    }

    /**
     * Toggle Shuffle (Stage 4)
     */
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        
        if (this.isShuffled) {
            this.vocabulary = this.shuffleArray([...this.originalVocabulary]);
            console.log('🔀 Cards shuffled');
        } else {
            this.vocabulary = [...this.originalVocabulary];
            console.log('📋 Cards restored to original order');
        }
        
        this.currentCardIndex = 0;
        this.renderCurrentCard();
        this.renderProgressDots();
        this.updateNavigationButtons();
        
        // Visual feedback
        const shuffleBtn = document.getElementById('shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.isShuffled);
        }
    }

    /**
     * Shuffle Array (Stage 4)
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Cycle Theme (Stage 4)
     */
    cycleTheme() {
        const themes = ['purple', 'blue', 'green', 'orange', 'pink'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];
        
        this.applyTheme(nextTheme);
        this.currentTheme = nextTheme;
        localStorage.setItem('flashcardTheme', nextTheme);
        
        console.log('🎨 Theme changed to:', nextTheme);
    }

    /**
     * Apply Theme (Stage 4)
     */
    applyTheme(theme) {
        const themes = {
            purple: { primary: '#667eea', secondary: '#764ba2' },
            blue: { primary: '#4A90E2', secondary: '#357ABD' },
            green: { primary: '#11998e', secondary: '#38ef7d' },
            orange: { primary: '#f2994a', secondary: '#f2c94c' },
            pink: { primary: '#f093fb', secondary: '#f5576c' }
        };
        
        const colors = themes[theme] || themes.purple;
        
        document.documentElement.style.setProperty('--flashcard-secondary', colors.primary);
        document.documentElement.style.setProperty('--flashcard-accent', colors.secondary);
        
        console.log('🎨 Applied theme:', theme);
    }

    /**
     * Render current card (from Stage 3)
     */
    renderCurrentCard() {
        const cardContainer = document.getElementById('flashcard-current');
        if (!cardContainer) return;

        const word = this.vocabulary[this.currentCardIndex];
        if (!word) return;

        const wordId = word.word || word.id || this.currentCardIndex;
        const isFavorite = this.favoriteWords.has(wordId);
        const isKnown = this.knownWords.has(wordId);
        
        // Track view
        this.trackWordView(wordId);

        const cardHTML = `
            <div class="flashcard-flip-container" data-index="${this.currentCardIndex}">
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <div class="flashcard-word">${word.word || ''}</div>
                        <div class="flashcard-transcription">${word.transcription || ''}</div>
                        <div class="flashcard-hint">👆 Click to flip</div>
                    </div>
                    
                    <div class="flashcard-back">
                        <div class="flashcard-translation">${word.translation || ''}</div>
                        ${word.example ? `<div class="flashcard-example">"${word.example}"</div>` : ''}
                        
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
        
        setTimeout(() => {
            const flipContainer = cardContainer.querySelector('.flashcard-flip-container');
            if (flipContainer) flipContainer.classList.add('flashcard-enter');
        }, 10);

        this.attachCardListeners();
    }

    // [Rest of methods from Stage 3: attachCardListeners, playAudio, toggleFavorite, etc.]
    // Keeping them identical to maintain compatibility

    attachCardListeners() {
        const inner = document.querySelector('.flashcard-inner');
        const audioBtn = document.querySelector('.audio-btn');
        const favoriteBtn = document.querySelector('.favorite-btn');
        const knownBtn = document.querySelector('.known-btn');

        const frontSide = document.querySelector('.flashcard-front');
        if (frontSide) {
            frontSide.addEventListener('click', () => {
                inner.classList.toggle('flipped');
            });
        }

        if (audioBtn) {
            audioBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const word = e.currentTarget.dataset.word;
                this.playAudio(word);
            });
        }

        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wordId = e.currentTarget.dataset.wordId;
                this.toggleFavorite(wordId, e.currentTarget);
            });
        }

        if (knownBtn) {
            knownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wordId = e.currentTarget.dataset.wordId;
                this.toggleKnown(wordId, e.currentTarget);
            });
        }
    }

    playAudio(word) {
        console.log('🔊 Playing audio:', word);
        if (typeof window.speak === 'function') {
            window.speak(word);
        } else {
            this.fallbackSpeak(word);
        }
        const audioBtn = document.querySelector('.audio-btn');
        if (audioBtn) {
            audioBtn.classList.add('playing');
            setTimeout(() => audioBtn.classList.remove('playing'), 1000);
        }
    }

    fallbackSpeak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        } else {
            const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`);
            audio.play().catch(e => console.log('Audio play error:', e));
        }
    }

    toggleFavorite(wordId, button) {
        if (this.favoriteWords.has(wordId)) {
            this.favoriteWords.delete(wordId);
            button.classList.remove('active');
            button.querySelector('svg').setAttribute('fill', 'none');
        } else {
            this.favoriteWords.add(wordId);
            button.classList.add('active');
            button.querySelector('svg').setAttribute('fill', 'currentColor');
        }
        localStorage.setItem('favoriteWords', JSON.stringify([...this.favoriteWords]));
        this.updateStatsBadge();
    }

    toggleKnown(wordId, button) {
        if (this.knownWords.has(wordId)) {
            this.knownWords.delete(wordId);
            button.classList.remove('active');
        } else {
            this.knownWords.add(wordId);
            button.classList.add('active');
        }
        localStorage.setItem('knownWords', JSON.stringify([...this.knownWords]));
        this.updateStatsBadge();
    }

    updateStatsBadge() {
        const badge = document.querySelector('.stats-badge');
        if (badge) {
            badge.innerHTML = `
                <span>⭐ ${this.favoriteWords.size}</span>
                <span>✓ ${this.knownWords.size}</span>
            `;
        }
    }

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

    updateNavigationButtons() {
        const prevBtn = document.getElementById('flashcard-prev');
        const nextBtn = document.getElementById('flashcard-next');

        if (prevBtn) prevBtn.disabled = this.currentCardIndex === 0;
        if (nextBtn) nextBtn.disabled = this.currentCardIndex === this.vocabulary.length - 1;
    }

    attachNavigationListeners() {
        const prevBtn = document.getElementById('flashcard-prev');
        const nextBtn = document.getElementById('flashcard-next');

        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateCard('prev'));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateCard('next'));
    }

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

    goToCard(index) {
        if (index < 0 || index >= this.vocabulary.length) return;
        
        this.currentCardIndex = index;
        this.renderCurrentCard();
        this.updateProgress();
        this.updateNavigationButtons();
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.currentMode === 'list') return;

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
                    if (this.currentMode === 'flashcards') {
                        const inner = document.querySelector('.flashcard-inner');
                        if (inner) inner.classList.toggle('flipped');
                        e.preventDefault();
                    }
                    break;
            }
        });
    }

    setupTouchSwipe() {
        const cardContainer = document.getElementById('flashcard-current') || document.getElementById('quiz-card');
        if (!cardContainer) return;

        cardContainer.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        cardContainer.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });
    }

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
    module.exports = FlashcardsManagerStage4;
}
