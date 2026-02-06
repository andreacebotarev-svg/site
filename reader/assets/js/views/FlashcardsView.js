/**
 * Flashcards View
 * Modern flashcard interface with SM-2 spaced repetition
 */
import { vocabularyStorage } from '../vocabulary/vocabulary-storage.enhanced.js';
import { eventBus } from '../core/event-bus.js';
import { globalState } from '../core/state-manager.js';

export class FlashcardsView {
  constructor(container) {
    this.container = container;
    this.currentCardIndex = 0;
    this.cards = [];
    this.isFlipped = false;
    this.sessionStats = {
      reviewed: 0,
      correct: 0,
      incorrect: 0
    };
    
    // State subscription
    this.unsubscribe = null;
    
    // Bind methods
    this.handleFlip = this.handleFlip.bind(this);
    this.handleRating = this.handleRating.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleSwipe = this.handleSwipe.bind(this);
  }
  
  async render() {
    // Subscribe to state if not already subscribed
    if (!this.unsubscribe) {
      this.unsubscribe = globalState.subscribe((state) => {
        const previousCards = this.cards;
        // Filter for Learning status (0 < repetitions < 5)
        this.cards = vocabularyStorage.getDueWords().filter(w => w.repetitions > 0 && w.repetitions < 5);
        
        // Reactivity Logic:
        // 1. If we are in empty state but now have cards -> Start Session
        if (this.cards.length > 0 && (document.querySelector('.mode-selection') || document.querySelector('.session-complete'))) {
          this.startNewSession();
          return;
        }

        // 2. If valid session logic:
        // Check if the currently displayed card was deleted
        if (this.cards.length > 0 && this.currentCardIndex < previousCards.length) {
            const currentCardId = previousCards[this.currentCardIndex]?.id;
            const cardStillExists = this.cards.some(c => c.id === currentCardId);
            
            if (!cardStillExists) {
                // Current card was deleted!
                // We should re-render. Since 'currentCardIndex' might now point to a new card or be out of bounds.
                // Safest is to re-render the current index (which is now the next card effectively)
                // ensuring index is within bounds.
                if (this.currentCardIndex >= this.cards.length) {
                    this.currentCardIndex = 0; // Reset if out of bounds
                }
                this.renderCard(); // Re-render immediately
            }
        } else if (this.cards.length === 0 && document.querySelector('.flashcard')) {
            // All cards deleted/finished
            this.renderEmptyState();
        }
      }, ['vocabulary']);
    }

    // Load due cards (only 'Learning' status)
    this.cards = vocabularyStorage.getDueWords().filter(w => w.repetitions > 0 && w.repetitions < 5);
    
    if (this.cards.length === 0) {
      this.renderEmptyState();
      return;
    }
    
    // Shuffle cards
    this.shuffleCards();
    
    this.currentCardIndex = 0;
    this.isFlipped = false;
    this.sessionStats = { reviewed: 0, correct: 0, incorrect: 0 };
    
    this.renderCard();
    this.setupEventListeners();
  }
  
  renderEmptyState() {
    this.container.innerHTML = `
      <div class="flashcard-container">
        <div class="mode-selection">
          <div class="complete-animation">🎉</div>
          <h2 style="font-size: var(--fs-h2); margin-bottom: var(--space-2); color: var(--text-primary);">
            All caught up!
          </h2>
          <p style="color: var(--text-secondary); margin-bottom: var(--space-5);">
            You've reviewed all your flashcards for today. Great job!
          </p>
          <div class="stats-summary">
            <div class="stat-card">
              <div class="stat-number">${vocabularyStorage.getAllWords().length}</div>
              <div class="stat-label">Total Words</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${vocabularyStorage.getDueWords().length}</div>
              <div class="stat-label">Due Today</div>
            </div>
          </div>
          <div class="action-buttons" style="margin-top: var(--space-5);">
            <a href="#/library" class="btn btn-primary" style="text-align: center; display: block;">
              Go to Library
            </a>
          </div>
        </div>
      </div>
    `;
  }
  
  renderCard() {
    if (this.currentCardIndex >= this.cards.length) {
      this.renderSessionComplete();
      return;
    }
    
    const card = this.cards[this.currentCardIndex];
    const progress = ((this.currentCardIndex + 1) / this.cards.length) * 100;
    
    this.container.innerHTML = `
      <div class="flashcard-container">
        <div class="session-info" style="width: 100%; max-width: 640px; margin: 0 auto var(--space-4);">
          <div class="card-counter">
            ${this.currentCardIndex + 1} / ${this.cards.length}
          </div>
          <div class="progress-bar" style="flex: 1; margin: 0 var(--space-3);">
            <div class="progress-fill" style="width: ${progress}%;"></div>
          </div>
        </div>
        
        <div class="flashcard ${this.isFlipped ? 'flipped' : ''}" id="flashcard">
          <div class="flashcard-side flashcard-front">
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
              <div class="word">${this.escapeHtml(card.word)}</div>
              ${card.phonetic ? `<div class="phonetic">${this.escapeHtml(card.phonetic)}</div>` : ''}
              ${card.context ? `<div style="margin-top: var(--space-3); padding: var(--space-2); background: var(--bg-secondary); border-radius: 12px; font-size: var(--fs-caption); color: var(--text-secondary); font-style: italic;">
                "${this.escapeHtml(card.context)}"
              </div>` : ''}
            </div>
            <button class="btn btn-reveal" onclick="window.flashcardView.handleFlip()">
              Tap to reveal
            </button>
          </div>
          
          <div class="flashcard-side flashcard-back">
            <div style="flex: 1; display: flex; flex-direction: column; gap: var(--space-3);">
              <div class="word" style="font-size: clamp(24px, 4vw, 32px);">${this.escapeHtml(card.word)}</div>
              ${card.phonetic ? `<div class="phonetic">${this.escapeHtml(card.phonetic)}</div>` : ''}
              
              <div style="margin-top: var(--space-2);">
                ${card.translation ? `
                  <div style="font-size: var(--fs-h3); font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2);">
                    ${this.escapeHtml(card.translation)}
                  </div>
                ` : ''}
                ${card.definition ? `
                  <div style="font-size: var(--fs-body); color: var(--text-secondary); line-height: var(--lh-normal);">
                    ${this.escapeHtml(card.definition)}
                  </div>
                ` : ''}
              </div>
              
              ${card.context ? `
                <div style="margin-top: var(--space-2); padding: var(--space-2); background: var(--bg-secondary); border-radius: 12px; font-size: var(--fs-caption); color: var(--text-secondary); font-style: italic;">
                  "${this.escapeHtml(card.context)}"
                </div>
              ` : ''}
            </div>
            
            <div class="rating-buttons">
              <div class="btn-group">
                <button class="btn-rating btn-again" onclick="window.flashcardView.handleRating(0)">
                  <span class="rating-label">Again</span>
                  <span class="rating-interval">1m</span>
                </button>
                <button class="btn-rating btn-hard" onclick="window.flashcardView.handleRating(1)">
                  <span class="rating-label">Hard</span>
                  <span class="rating-interval">1d</span>
                </button>
                <button class="btn-rating btn-good" onclick="window.flashcardView.handleRating(2)">
                  <span class="rating-label">Good</span>
                  <span class="rating-interval">${this.getNextInterval(card, 2)}</span>
                </button>
                <button class="btn-rating btn-easy" onclick="window.flashcardView.handleRating(3)">
                  <span class="rating-label">Easy</span>
                  <span class="rating-interval">${this.getNextInterval(card, 3)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="session-controls">
          <button class="btn-icon" onclick="window.flashcardView.handleAudio()" title="Pronounce word" style="font-size: 24px;">
            🔊
          </button>
        </div>
      </div>
    `;
    
    // Store reference for event handlers
    window.flashcardView = this;
  }
  
  renderSessionComplete() {
    const { reviewed, correct, incorrect } = this.sessionStats;
    const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;
    
    this.container.innerHTML = `
      <div class="flashcard-container">
        <div class="session-complete">
          <div class="complete-animation">🎉</div>
          <h2 style="font-size: var(--fs-h2); margin-bottom: var(--space-2); color: var(--text-primary);">
            Session Complete!
          </h2>
          <p style="color: var(--text-secondary); margin-bottom: var(--space-5);">
            You've reviewed ${reviewed} card${reviewed !== 1 ? 's' : ''} today.
          </p>
          
          <div class="session-stats">
            <div class="stat-item">
              <div class="stat-value">${accuracy}%</div>
              <div class="stat-label">Accuracy</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${correct}</div>
              <div class="stat-label">Correct</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${incorrect}</div>
              <div class="stat-label">Incorrect</div>
            </div>
          </div>
          
          <div class="action-buttons" style="margin-top: var(--space-5);">
            <button class="btn btn-primary" onclick="window.flashcardView.startNewSession()">
              Review More
            </button>
            <a href="#/library" class="btn btn-secondary" style="text-align: center; display: block; margin-top: var(--space-2);">
              Go to Library
            </a>
          </div>
        </div>
      </div>
    `;
    
    window.flashcardView = this;
  }
  
  handleFlip() {
    if (!this.isFlipped) {
      this.isFlipped = true;
      const flashcard = document.getElementById('flashcard');
      if (flashcard) {
        flashcard.classList.add('flipped');
      }
    }
  }
  
  async handleRating(quality) {
    if (this.currentCardIndex >= this.cards.length) return;
    
    const card = this.cards[this.currentCardIndex];
    
    // Update card with SM-2 algorithm
    vocabularyStorage.updateWordReview(card.id, quality);
    
    // Update session stats
    this.sessionStats.reviewed++;
    if (quality >= 2) {
      this.sessionStats.correct++;
    } else {
      this.sessionStats.incorrect++;
    }
    
    // Move to next card
    this.currentCardIndex++;
    this.isFlipped = false;
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 200));
    
    this.renderCard();
  }
  
  handleAudio() {
    const card = this.cards[this.currentCardIndex];
    if (!card) return;
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(card.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  }
  
  handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        if (!this.isFlipped) {
          this.handleFlip();
        }
        break;
      case '1':
        if (this.isFlipped) this.handleRating(0);
        break;
      case '2':
        if (this.isFlipped) this.handleRating(1);
        break;
      case '3':
        if (this.isFlipped) this.handleRating(2);
        break;
      case '4':
        if (this.isFlipped) this.handleRating(3);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (this.currentCardIndex > 0) {
          this.currentCardIndex--;
          this.isFlipped = false;
          this.renderCard();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (!this.isFlipped) {
          this.handleFlip();
        } else if (this.currentCardIndex < this.cards.length - 1) {
          // Skip current card
          this.currentCardIndex++;
          this.isFlipped = false;
          this.renderCard();
        }
        break;
    }
  }
  
  handleSwipe(e) {
    // Simple swipe detection for mobile
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0 && this.currentCardIndex > 0) {
        // Swipe right - previous card
        this.currentCardIndex--;
        this.isFlipped = false;
        this.renderCard();
      } else if (deltaX < 0 && !this.isFlipped) {
        // Swipe left - flip card
        this.handleFlip();
      }
    }
  }
  
  setupEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Touch events for mobile
    const flashcard = document.getElementById('flashcard');
    if (flashcard) {
      flashcard.addEventListener('touchstart', (e) => {
        this.touchStartX = e.touches[0].clientX;
      });
      
      flashcard.addEventListener('touchend', this.handleSwipe);
      
      // Click to flip
      flashcard.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-rating') && !e.target.closest('.btn-reveal')) {
          if (!this.isFlipped) {
            this.handleFlip();
          }
        }
      });
    }
  }
  
  startNewSession() {
    this.render();
  }
  
  shuffleCards() {
    // Fisher-Yates shuffle
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  
  getNextInterval(card, quality) {
    const { interval } = vocabularyStorage.calculateSM2(
      card.repetitions,
      card.easeFactor,
      card.interval,
      quality
    );
    
    if (interval < 1) return '1d';
    if (interval < 7) return `${interval}d`;
    if (interval < 30) return `${Math.round(interval / 7)}w`;
    return `${Math.round(interval / 30)}m`;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (window.flashcardView === this) {
      delete window.flashcardView;
    }
  }
}

