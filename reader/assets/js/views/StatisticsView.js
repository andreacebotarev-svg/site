/**
 * Statistics View
 * Displays learning statistics and progress
 */
import { vocabularyStorage } from '../vocabulary/vocabulary-storage.enhanced.js';

export class StatisticsView {
  constructor(container) {
    this.container = container;
  }
  
  async render() {
    const allWords = vocabularyStorage.getAllWords();
    const dueWords = vocabularyStorage.getDueWords();
    const masteredWords = allWords.filter(w => w.repetitions >= 5);
    
    this.container.innerHTML = `
      <div style="padding: var(--space-6); max-width: 1200px; margin: 0 auto;">
        <h1 style="font-size: var(--fs-h1); margin-bottom: var(--space-4); color: var(--text-primary);">
          Statistics
        </h1>
        
        <div class="stats-summary" style="margin-bottom: var(--space-6);">
          <div class="stat-card">
            <div class="stat-number">${allWords.length}</div>
            <div class="stat-label">Total Words</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${dueWords.length}</div>
            <div class="stat-label">Due Today</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${masteredWords.length}</div>
            <div class="stat-label">Mastered</div>
          </div>
        </div>
        
        <div style="background: var(--card-bg); padding: var(--space-4); border-radius: 20px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);">
          <h2 style="font-size: var(--fs-h2); margin-bottom: var(--space-3); color: var(--text-primary);">
            Learning Progress
          </h2>
          <p style="color: var(--text-secondary); margin-bottom: var(--space-4);">
            Keep up the great work! Review your flashcards regularly to improve retention.
          </p>
        </div>
      </div>
    `;
  }
  
  destroy() {
    // Cleanup if needed
  }
}

