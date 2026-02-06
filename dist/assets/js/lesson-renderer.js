/**
 * LESSON RENDERER MODULE
 * Handles UI rendering and DOM manipulation
 * Updated: Auto-insert images after paragraphs + highlight saved words + embedded quiz + Kanban board + Theme Switcher
 */

class LessonRenderer {
  constructor(lessonData, tts, storage, themeManager = null) {
    this.data = lessonData;
    this.tts = tts;
    this.storage = storage;
    this.themeManager = themeManager;
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text
   * @returns {string}
   */
  escapeHTML(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * ✨ UPDATED: Render beautiful theme switcher UI
   * @param {string} currentTheme - Currently active theme ('default', 'kids', 'dark')
   * @returns {string} HTML string
   */
  renderThemeSwitcher(currentTheme = 'default') {
    const themes = [
      { id: 'default', emoji: '🌙', label: 'Classic' },
      { id: 'kids', emoji: '🎈', label: 'Kids' },
      { id: 'dark', emoji: '⭐', label: 'Dark' }
    ];

    const buttonsHTML = themes.map(theme => {
      const isActive = theme.id === currentTheme;
      return `
        <button class="theme-btn ${isActive ? 'active' : ''}"
                data-theme="${theme.id}"
                onclick="window.lessonEngine.handleThemeSwitch('${theme.id}')"
                aria-label="Switch to ${theme.label} theme"
                ${isActive ? 'aria-pressed="true"' : ''}>
          <span class="theme-btn-icon">${theme.emoji}</span>
          <span class="theme-btn-text">${theme.label}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="theme-switcher" role="group" aria-label="Theme switcher">
        ${buttonsHTML}
      </div>
    `;
  }

  /**
   * Make all words in text interactive (clickable) with saved words highlighting
   * @param {string} text
   * @returns {string}
   */
  makeWordsInteractive(text) {
    // Regex to match words (letters and apostrophes)
    const wordRegex = /\b([a-zA-Z]+(?:'[a-zA-Z]+)?)\b/g;
    
    return text.replace(wordRegex, (match, word) => {
      // Skip very short words (a, I, is, to, etc.)
      if (word.length <= 2) {
        return this.escapeHTML(match);
      }
      
      const normalized = word.toLowerCase();
      const isSaved = this.storage.isWordSaved(normalized);
      const savedClass = isSaved ? ' word-saved' : '';
      
      // Create interactive word span
      return `<span class="interactive-word${savedClass}" 
                    data-word="${this.escapeHTML(normalized)}"
                    onclick="window.lessonEngine.showWordPopup('${this.escapeHTML(normalized)}', event)">
                ${this.escapeHTML(match)}
              </span>`;
    });
  }

  // ========================================
  // KANBAN BOARD RENDERING
  // ========================================

  /**
   * Render Kanban board HTML
   * @param {Object} groupedWords - Words grouped by status from storage.getWordsByStatus()
   * @param {LessonStorage} storage - Storage instance for checking saved words
   * @returns {string} HTML string
   */
  renderKanbanBoard(groupedWords, storage) {
    const columns = [
      { status: 'to-learn', icon: '📖', label: 'To Learn', color: '#667eea' },
      { status: 'learning', icon: '📚', label: 'Learning', color: '#f093fb' },
      { status: 'known', icon: '✓', label: 'Known', color: '#4facfe' },
      { status: 'favorites', icon: '⭐', label: 'Favorites', color: '#fa709a' }
    ];

    const columnsHTML = columns.map(col => {
      const words = groupedWords[col.status] || [];
      const cardsHTML = words.length > 0
        ? words.map(word => this._renderKanbanCard(word, col.status)).join('')
        : this._renderKanbanEmptyState(col.label);
      
      return `
        <div class="kanban-column" data-status="${col.status}">
          <div class="column-header">
            <div class="column-title">
              <span class="column-icon">${col.icon}</span>
              <span class="column-name">${col.label}</span>
              <span class="column-count">(${words.length})</span>
            </div>
            <button class="column-menu" aria-label="Column menu for ${col.label}">⋮</button>
          </div>
          <div class="column-content">
            ${cardsHTML}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="vocab-kanban-container">
        <div class="kanban-header">
          <h3>📚 Vocabulary Progress</h3>
          <div class="kanban-actions">
            <button class="kanban-reset-btn" title="Reset all progress">🔄 Reset</button>
          </div>
        </div>
        <div class="kanban-board">
          ${columnsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render individual Kanban card
   * @param {Object} word - Word object { en, ru, transcription, ... }
   * @param {string} status - Current status
   * @returns {string} HTML string
   * @private
   */
  _renderKanbanCard(word, status) {
    const wordEn = this.escapeHTML(word.en || '');
    const wordRu = this.escapeHTML(word.ru || '');
    const transcription = word.transcription ? this.escapeHTML(word.transcription) : '';
    const isFavorite = word.isFavorite || false;
    
    return `
      <div class="kanban-card" 
           draggable="true" 
           data-word="${wordEn}"
           data-favorite="${isFavorite}">
        <div class="card-header-small">
          <h4 class="card-word">${wordEn}${isFavorite ? ' ⭐' : ''}</h4>
          <button class="card-drag-handle" 
                  aria-label="Drag to move">⋮⋮</button>
        </div>
        <p class="card-translation">${wordRu}</p>
        ${transcription ? `<p class="card-transcription">${transcription}</p>` : ''}
        <div class="card-footer">
          <button class="card-audio" 
                  title="Play pronunciation">🔊</button>
          <button class="card-move" 
                  title="Move to next stage">→</button>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state for Kanban column
   * @param {string} columnLabel - Column label
   * @returns {string} HTML string
   * @private
   */
  _renderKanbanEmptyState(columnLabel) {
    const messages = {
      'To Learn': 'Great job! All words moved forward.',
      'Learning': 'Drag words here when you start practicing.',
      'Known': 'Move mastered words here.',
      'Favorites': 'Star words to add them here.'
    };
    
    const message = messages[columnLabel] || 'No words yet';
    
    return `
      <div class="kanban-empty-state">
        <div class="kanban-empty-state-icon">📭</div>
        <p>${message}</p>
      </div>
    `;
  }

  // ========================================
  // VOCABULARY RENDERING
  // ========================================

  /**
   * ✨ UPDATED: Render vocabulary list, flashcards, or Kanban board
   * @param {string} mode - 'list', 'flashcard', or 'kanban'
   * @param {Array} myWords - Currently saved words
   * @param {number} flashcardIndex - Index for flashcard mode
   * @returns {string} HTML string
   */
  renderVocabulary(mode, myWords, flashcardIndex = 0) {
    const vocabulary = this.data.vocabulary?.words;
    const phrases = this.data.vocabulary?.phrases;

    if (!vocabulary || !Array.isArray(vocabulary) || vocabulary.length === 0) {
      return '<p class="text-soft">No vocabulary available.</p>';
    }

    const header = `
      <div class="card-header">
        <h2 class="card-title">📚 Vocabulary</h2>
        <div class="vocab-mode-toggle">
          <button class="vocab-mode-btn ${mode === 'list' ? 'active' : ''}" data-mode="list">
            List
          </button>
          <button class="vocab-mode-btn ${mode === 'flashcard' ? 'active' : ''}" data-mode="flashcard">
            Flashcards
          </button>
          <button class="vocab-mode-btn ${mode === 'kanban' ? 'active' : ''}" data-mode="kanban">
            Board
          </button>
        </div>
      </div>
    `;

    // ✅ FIX: Now properly returns header + content for all modes
    if (mode === 'list') {
      return header + this.renderVocabList(vocabulary, phrases, myWords);
    } else if (mode === 'flashcard') {
      return header + this.renderFlashcard(vocabulary, flashcardIndex);
    } else if (mode === 'kanban') {
      const groupedWords = this.storage.getWordsByStatus(vocabulary);
      return header + this.renderKanbanBoard(groupedWords, this.storage);
    }
    
    // Fallback (should never reach here)
    return header + '<p class="text-soft">Unknown vocabulary mode.</p>';
  }

  // ========================================
  // READING RENDERING
  // ========================================

  /**
   * Render reading content with clickable words, automatic images AND embedded quiz
   * @param {Array} myWords - Currently saved words
   * @returns {string} HTML string
   */
  renderReading(myWords) {
    const reading = this.data.content?.reading;
    if (!reading || !Array.isArray(reading) || reading.length === 0) {
      return '<p class="text-soft">No reading content available.</p>';
    }

    const allText = reading.map(para => para.text).join(' ');
    const wordCount = allText.split(/\s+/).length;

    // Get lesson ID for image paths - prioritize lessonEngine's ID
    const lessonId = window.lessonEngine?.lessonId || this.data.id;

    // Build vocabulary map for special highlighting
    const vocabMap = {};
    if (this.data.vocabulary?.words) {
      this.data.vocabulary.words.forEach(item => {
        const word = item.en.toLowerCase();
        vocabMap[word] = {
          word: item.en,
          definition: item.ru,
          phonetic: item.transcription || ''
        };
      });
    }

    // Process text to make words clickable (ALL WORDS now!)
    const processText = (text) => {
      return this.makeWordsInteractive(text);
    };

    // 🔥 IMAGE COUNTER - starts from 1
    let imageCounter = 1;

    const processedParagraphs = reading.map((para, index) => {
      let paraHTML = '';

      // Handle different paragraph types
      if (para.type === 'list') {
        // Handle multi-line text with bullet points
        let processedText = para.text;
        if (processedText.includes('\n• ')) {
          // Multi-line with bullets - split and format as list
          const lines = processedText.split('\n').filter(line => line.trim());
          const titleLine = lines[0];
          const bulletLines = lines.slice(1);

          paraHTML = `
            ${para.title ? `<div style="font-weight: 600; margin-bottom: 8px; color: var(--text-main);">${this.escapeHTML(para.title)}</div>` : ''}
            ${titleLine ? `<p style="margin-bottom: 8px;">${processText(titleLine)}</p>` : ''}
            <ul style="padding-left: 20px; margin-bottom: 12px;">
              ${bulletLines.map(item => `<li>${processText(item.replace(/^•\s*/, ''))}</li>`).join('')}
            </ul>
          `;
        } else {
          // Single line - show as paragraph
          paraHTML = `
            ${para.title ? `<div style="font-weight: 600; margin-bottom: 8px; color: var(--text-main);">${this.escapeHTML(para.title)}</div>` : ''}
            <p class="reading-paragraph">${processText(processedText)}</p>
          `;
        }
      } else if (para.type === 'fact') {
        // Special styling for fact boxes
        paraHTML = `
          <div style="margin: 16px 0; padding: 12px; background: rgba(79, 140, 255, 0.1); border-left: 3px solid var(--accent); border-radius: 8px;">
            ${para.title ? `<div style="font-weight: 600; font-size: 0.85rem; color: var(--accent); margin-bottom: 6px;">${this.escapeHTML(para.title)}</div>` : ''}
            <p style="margin: 0; font-size: 0.9rem; line-height: 1.5;">${processText(para.text)}</p>
          </div>
        `;
      } else {
        // Regular paragraph
        paraHTML = `
          ${para.title ? `<h3 style="font-size: 1rem; font-weight: 600; margin: 16px 0 8px 0; color: var(--text-main);">${this.escapeHTML(para.title)}</h3>` : ''}
          ${para.text ? `<p class="reading-paragraph">${processText(para.text)}</p>` : ''}
        `;
      }

      // 🔥 INSERT IMAGE AFTER PARAGRAPH (skip facts and lists)
      if (para.type !== 'fact' && para.type !== 'list') {
        const imageHTML = `
          <div class="reading-image-container" style="margin: var(--space-xl) 0;">
            <img class="reading-image" 
                 src="../images/${lessonId}(${imageCounter}).jpg" 
                 alt="Illustration for paragraph ${imageCounter}"
                 onerror="if(!this.dataset.fallback){this.dataset.fallback='1'; this.src=this.src.replace('.jpg','.jpeg');} else {this.parentElement.style.display='none';}"
                 loading="lazy"
                 style="width: 100%; max-width: 600px; height: auto; 
                        border-radius: var(--radius-lg); margin: 0 auto; 
                        display: block; box-shadow: var(--shadow-lg); 
                        transition: transform var(--transition-base);"
                 onmouseover="this.style.transform='scale(1.02)'"
                 onmouseout="this.style.transform='scale(1)'">
          </div>
        `;
        imageCounter++;
        return paraHTML + imageHTML;
      }

      return paraHTML;
    }).join('');

    // Get theme switcher HTML if themeManager is available
    // ✅ IMPORTANT: themeSwitcherHTML contains ONLY theme switcher buttons (no audio buttons)
    const themeSwitcherHTML = this.themeManager 
      ? this.themeManager.renderThemeSwitcherHTML() 
      : '';

    // ✅ IMPORTANT: renderAudioButtons() is called ONLY ONCE in .reading-controls-left
    // This is the SINGLE source of truth for audio buttons in Reading section
    return `
      <div class="card-header">
        <div class="reading-header-top">
          <h2 class="card-title">📖 Reading</h2>
          ${themeSwitcherHTML}
        </div>
      </div>
      <div class="reading-controls">
        <div class="reading-controls-left">
          ${this.renderAudioButtons()}
        </div>
        <div class="reading-controls-right">
          ${wordCount} words
        </div>
      </div>
      <div class="reading-body">
        ${processedParagraphs}
        ${this.renderDialogueOrder()}
        ${this.renderReadingQuiz()}
      </div>
    `;
  }

  /**
   * ✨ NEW: Render quiz embedded in reading section
   * @returns {string} HTML string
   */
  renderReadingQuiz() {
    const quiz = this.data.quiz;
    if (!quiz || (Array.isArray(quiz) && quiz.length === 0)) {
      return '';
    }

    const questions = Array.isArray(quiz) ? quiz : (quiz.questions || []);
    if (questions.length === 0) return '';

    const state = window.lessonEngine.quizState;
    const currentIndex = state.currentQuestionIndex;
    const question = questions[currentIndex];

    if (state.completed) {
      return this.renderReadingQuizResults();
    }

    const questionText = question.question || question.q || '';
    const options = question.options || question.opts || [];
    const currentAnswer = state.answers[currentIndex];

    return `
      <div class="reading-quiz-section" id="reading-quiz">
        <div class="reading-quiz-header">
          <h3>💡 Comprehension Check</h3>
          <span class="reading-quiz-progress">
            ${currentIndex + 1} / ${questions.length}
          </span>
        </div>
        
        <div class="reading-quiz-question">
          <p class="quiz-question-text">${this.escapeHTML(questionText)}</p>
          
          <div class="quiz-options">
            ${options.map((opt, i) => `
              <button 
                class="quiz-option ${this.getQuizOptionClass(i, question, currentAnswer)}"
                onclick="window.lessonEngine.selectReadingQuizAnswer(${i})"
                ${currentAnswer ? 'disabled' : ''}
              >
                ${this.escapeHTML(opt)}
              </button>
            `).join('')}
          </div>

          ${currentAnswer ? `
            <div class="quiz-feedback ${currentAnswer.correct ? 'correct' : 'wrong'}">
              ${currentAnswer.correct ? '✓' : '✗'} 
              ${this.escapeHTML(question.explanation || (currentAnswer.correct ? 'Correct!' : 'Incorrect'))}
            </div>
            
            <button 
              class="primary-btn" 
              onclick="window.lessonEngine.nextReadingQuizQuestion()"
              style="margin-top: 16px;"
            >
              ${currentIndex < questions.length - 1 ? 'Next Question →' : 'Finish Quiz'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * ✨ NEW: Render quiz results in reading section
   * @returns {string} HTML string
   */
  renderReadingQuizResults() {
    const answers = window.lessonEngine.quizState.answers;
    const correct = answers.filter(a => a.correct).length;
    const total = answers.length;
    const percentage = Math.round((correct / total) * 100);

    let emoji = '🎉';
    let message = 'Excellent work!';
    let color = '#22c55e';

    if (percentage < 60) {
      emoji = '💪';
      message = 'Keep practicing!';
      color = '#f59e0b';
    } else if (percentage < 80) {
      emoji = '👍';
      message = 'Good job!';
      color = '#3b82f6';
    }

    return `
      <div class="reading-quiz-results" style="border-color: ${color};">
        <div style="font-size: 3rem; margin-bottom: 16px;">${emoji}</div>
        <h3>${message}</h3>
        <div class="quiz-score" style="color: ${color};">
          ${correct} / ${total}
        </div>
        <div style="font-size: 1rem; color: var(--text-soft); margin-bottom: 24px;">
          ${percentage}% correct
        </div>
        <button class="primary-btn" onclick="window.lessonEngine.resetQuiz()">
          🔄 Try Again
        </button>
      </div>
    `;
  }

  /**
   * ✨ NEW: Get CSS class for quiz option button based on state
   * @param {number} index - Option index
   * @param {Object} question - Question object
   * @param {Object} answer - User's answer (if exists)
   * @returns {string} CSS class
   */
  getQuizOptionClass(index, question, answer) {
    if (!answer) return '';
    
    const className = index === question.correct ? 'correct' : 
                      index === answer.answerIndex && !answer.correct ? 'wrong' : '';
    
    console.log(`[Quiz] Option ${index}: class="${className}", correct=${question.correct}, userAnswer=${answer.answerIndex}`);
    
    return className;
  }

  // ========================================
  // VOCAB LIST RENDERING
  // ========================================
  
  renderVocabList(vocabulary, phrases, myWords) {
    const vocabItems = vocabulary.map(item => {
      const { en: word, transcription: phonetic, ru: definition, example, part_of_speech, image } = item;
      const isSaved = myWords.some(w => w.word.toLowerCase() === word.toLowerCase());

      const safeWord = this.escapeHTML(word).replace(/'/g, "\\'");
      const safeDef = this.escapeHTML(definition).replace(/'/g, "\\'");
      const safePhonetic = this.escapeHTML(phonetic || '').replace(/'/g, "\\'");

      return `
        <div class="vocab-item ${isSaved ? 'word-saved' : ''}">
          ${image ? `<div style="margin-bottom: 8px;"><img src="../images/${image}" alt="${this.escapeHTML(word)}" style="max-width: 100%; height: auto; border-radius: 8px;" onerror="this.style.display='none'"></div>` : ''}
          <div class="vocab-top-line">
            <div>
              <span class="vocab-word">${this.escapeHTML(word)}</span>
              ${phonetic ? `<span class="vocab-phonetic">${this.escapeHTML(phonetic)}</span>` : ''}
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="icon-btn primary" onclick="window.lessonEngine.speakWord('${safeWord}')" aria-label="Speak word">
                <span>🔊</span>
              </button>
              <button class="icon-btn ${isSaved ? 'danger' : ''}" 
                      onclick="window.lessonEngine.toggleWordFromVocab('${safeWord}', '${safeDef}', '${safePhonetic}')"
                      aria-label="${isSaved ? 'Remove word' : 'Save word'}">
                <span>${isSaved ? '❌' : '⭐'}</span>
              </button>
            </div>
          </div>
          <div class="vocab-definition">${this.escapeHTML(definition)}</div>
          ${example ? `<div class="vocab-example">"${this.escapeHTML(example)}"</div>` : ''}
          ${part_of_speech ? `<div class="vocab-tags"><span class="tag">${this.escapeHTML(part_of_speech)}</span></div>` : ''}
        </div>
      `;
    }).join('');

    const phrasesSection = phrases && Array.isArray(phrases) && phrases.length > 0 ? `
      <div class="mt-md">
        <h3 class="card-subtitle" style="margin-bottom: 8px;">💬 Common Phrases</h3>
        ${phrases.map(phrase => {
          const safePhrase = this.escapeHTML(phrase.en).replace(/'/g, "\\'");
          return `
            <div class="vocab-item">
              <div class="vocab-top-line">
                <span class="vocab-word">${this.escapeHTML(phrase.en)}</span>
                <button class="icon-btn primary" onclick="window.lessonEngine.tts.speak('${safePhrase}')" aria-label="Speak phrase">
                  <span>🔊</span>
                </button>
              </div>
              <div class="vocab-definition">${this.escapeHTML(phrase.ru)}</div>
              ${phrase.context ? `<div class="vocab-example" style="font-style: italic;">Context: ${this.escapeHTML(phrase.context)}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    ` : '';

    return `
      <div class="vocab-layout">
        <div>
          <div class="vocab-list">
            ${vocabItems}
          </div>
        </div>
        <div>
          ${phrasesSection}
        </div>
      </div>
    `;
  }

  // ========================================
  // FLASHCARD RENDERING
  // ========================================

  renderFlashcard(vocabulary, index) {
    if (!vocabulary || vocabulary.length === 0) {
      return '<p class="text-soft">No vocabulary for flashcards.</p>';
    }

    // Normalize index
    index = Math.max(0, Math.min(index, vocabulary.length - 1));

    const item = vocabulary[index];
    const total = vocabulary.length;
    const safeWord = this.escapeHTML(item.en).replace(/'/g, "\\'");

    return `
      <div class="vocab-layout">
        <div>
          <div class="flashcard-shell">
            <div class="flashcard" id="flashcard" onclick="window.lessonEngine.flipFlashcard()" style="cursor: pointer;">
              <div class="flashcard-face flashcard-front">
                ${item.image ? `<div style="margin-bottom: 12px;"><img src="../images/${item.image}" alt="${this.escapeHTML(item.en)}" style="max-width: 100%; max-height: 120px; object-fit: contain; border-radius: 8px;" onerror="this.style.display='none'"></div>` : ''}
                <div class="flashcard-label">Word</div>
                <div class="flashcard-word">${this.escapeHTML(item.en)}</div>
                ${item.transcription ? `<div class="flashcard-definition">${this.escapeHTML(item.transcription)}</div>` : ''}
                <div style="margin-top: auto; font-size: 0.8rem; color: var(--text-soft);">
                  Click to reveal definition
                </div>
              </div>
              <div class="flashcard-face flashcard-back">
                <div class="flashcard-label">Definition</div>
                <div class="flashcard-word">${this.escapeHTML(item.ru)}</div>
                ${item.example ? `<div class="flashcard-definition" style="margin-top: 12px; font-size: 0.85rem;">"${this.escapeHTML(item.example)}"</div>` : ''}
                ${item.part_of_speech ? `<div style="margin-top: 8px;"><span class="tag">${this.escapeHTML(item.part_of_speech)}</span></div>` : ''}
              </div>
            </div>
            <div class="flashcard-controls">
              <button class="icon-btn" onclick="window.lessonEngine.prevFlashcard(); event.stopPropagation();" aria-label="Previous">
                <span>⬅</span> Prev
              </button>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span class="flashcard-index">${index + 1} / ${total}</span>
                <button class="icon-btn primary" onclick="window.lessonEngine.speakWord('${safeWord}'); event.stopPropagation();" aria-label="Speak">
                  <span>🔊</span>
                </button>
              </div>
              <button class="icon-btn" onclick="window.lessonEngine.nextFlashcard(); event.stopPropagation();" aria-label="Next">
                Next <span>➡</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ========================================
  // GRAMMAR RENDERING
  // ========================================

  renderGrammar() {
    const grammar = this.data.grammar;

    if (!grammar || Object.keys(grammar).length === 0) {
      return '<p class="text-soft">No grammar content available.</p>';
    }

    const { title, explanation, rules, examples } = grammar;

    // Render rules section
    const rulesHTML = rules && Array.isArray(rules) ? rules.map(rule => {
      const examplesList = rule.examples && Array.isArray(rule.examples) 
        ? `<ul style="padding-left: 20px; margin-top: 8px;">
            ${rule.examples.map(ex => `<li style="margin-bottom: 4px; color: var(--text-soft);">${this.escapeHTML(ex)}</li>`).join('')}
          </ul>`
        : '';
      
      return `
        <div style="padding: 12px; background: rgba(9, 13, 32, 0.5); border-radius: var(--radius-md); margin-bottom: 12px; border-left: 3px solid var(--accent);">
          <div style="font-weight: 600; font-size: 0.95rem; color: var(--accent); margin-bottom: 6px;">
            ${this.escapeHTML(rule.rule)}
          </div>
          ${examplesList}
        </div>
      `;
    }).join('') : '';

    // Render examples section
    const examplesHTML = examples ? `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 1rem; font-weight: 650; color: var(--text-main); margin-bottom: 12px;">✏️ Practice Examples</h3>
        ${examples.affirmative && examples.affirmative.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px;">Affirmative</div>
            <ul style="padding-left: 20px;">
              ${examples.affirmative.map(ex => `<li style="margin-bottom: 6px; line-height: 1.5;">${this.escapeHTML(ex)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${examples.negative && examples.negative.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px;">Negative</div>
            <ul style="padding-left: 20px;">
              ${examples.negative.map(ex => `<li style="margin-bottom: 6px; line-height: 1.5;">${this.escapeHTML(ex)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${examples.questions && examples.questions.length > 0 ? `
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 8px;">Questions</div>
            <ul style="padding-left: 20px;">
              ${examples.questions.map(ex => `<li style="margin-bottom: 6px; line-height: 1.5;">${this.escapeHTML(ex)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    ` : '';

    return `
      <div class="card-header">
        <h2 class="card-title">✏️ Grammar</h2>
      </div>
      <div style="margin-top: var(--space-md);">
        ${title ? `<h3 style="font-size: 1.1rem; font-weight: 650; color: var(--text-main); margin-bottom: 12px;">${this.escapeHTML(title)}</h3>` : ''}
        ${explanation ? `<p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px;">${this.escapeHTML(explanation)}</p>` : ''}
        ${rulesHTML}
        ${examplesHTML}
      </div>
    `;
  }

  // ========================================
  // QUIZ RENDERING
  // ========================================

  renderQuiz(quizState) {
    let quiz = this.data.quiz;

    // Handle both formats: array or object with questions
    if (!quiz) {
      return '<p class="text-soft">No quiz available.</p>';
    }

    // If quiz is array, wrap it
    let questions = Array.isArray(quiz) ? quiz : (quiz.questions || []);

    if (questions.length === 0) {
      return '<p class="text-soft">No quiz available.</p>';
    }

    if (quizState.completed) {
      return this.renderQuizResults(quizState, questions.length);
    }

    const question = questions[quizState.currentQuestionIndex];
    const progress = Math.round(((quizState.currentQuestionIndex + 1) / questions.length) * 100);

    // Support both 'q'/'question' and 'opts'/'options'
    const questionText = question.question || question.q || 'No question text';
    const options = question.options || question.opts || [];

    return `
      <div class="card-header">
        <h2 class="card-title">⚡ Quiz</h2>
        <div class="quiz-progress">Question ${quizState.currentQuestionIndex + 1} / ${questions.length}</div>
      </div>
      <div class="quiz-body">
        <p class="quiz-question">${this.escapeHTML(questionText)}</p>
        <div class="quiz-options" id="quiz-options">
          ${options.map((opt, i) => `
            <button class="quiz-option" onclick="window.lessonEngine.selectQuizAnswer(${i})">
              ${this.escapeHTML(opt)}
            </button>
          `).join('')}
        </div>
        <div id="quiz-feedback"></div>
      </div>
      <div class="quiz-footer">
        <div class="quiz-progress">${progress}% Complete</div>
      </div>
    `;
  }

  renderQuizResults(quizState, totalQuestions) {
    const total = totalQuestions || quizState.answers.length;
    const correct = quizState.answers.filter(a => a.correct).length;
    const percentage = Math.round((correct / total) * 100);

    let emoji = '🎉';
    let message = 'Excellent!';
    if (percentage < 60) {
      emoji = '💪';
      message = 'Keep practicing!';
    } else if (percentage < 80) {
      emoji = '👍';
      message = 'Good job!';
    }

    return `
      <div class="card-header">
        <h2 class="card-title">🏆 Quiz Complete!</h2>
      </div>
      <div class="mt-md" style="text-align: center;">
        <div style="font-size: 3rem; margin: 20px 0;">${emoji}</div>
        <div style="font-size: 2rem; font-weight: 600; margin-bottom: 8px;">${percentage}%</div>
        <p style="font-size: 1.1rem; margin-bottom: 8px;">${message}</p>
        <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 20px;">You scored ${correct} out of ${total}</p>
        <button class="primary-btn" onclick="window.lessonEngine.resetQuiz()">
          <span>🔄</span> Try Again
        </button>
      </div>
    `;
  }

  // ========================================
  // AUDIO BUTTONS RENDERING
  // ========================================

  /**
   * ✨ IMPROVED: Render audio buttons with high contrast for Kids theme
   * Returns two buttons: Play (always visible when not playing) and Pause (visible only when playing)
   * 
   * ✅ IMPORTANT: This method should be called ONLY ONCE per Reading section.
   * The single call location is in renderReading() -> .reading-controls-left
   * 
   * ✨ IMPROVED: Uses centralized theme detection
   * ✨ IMPROVED: Initial CSS classes set for proper visibility
   * ✨ IMPROVED: ARIA attributes included for accessibility
   * 
   * @returns {string} HTML string for audio buttons
   */
  renderAudioButtons() {
    // ✨ IMPROVED: Use centralized theme detection method
    const currentTheme = window.lessonEngine?.getCurrentTheme?.() || 
                        window.lessonEngine?.themeManager?.getCurrentTheme() || 
                        'default';
    
    const isKidsTheme = currentTheme === 'kids';
    
    if (isKidsTheme) {
      // Kids theme: Two separate buttons with high contrast
      // ✨ IMPROVED: Initial state set via CSS classes, not inline styles
      const isPlaying = window.lessonEngine?.isAudioPlaying || false;
      
      return `
        <button class="kids-audio-btn-play ${isPlaying ? 'is-hidden' : ''}" 
                onclick="window.lessonEngine.playAudio()"
                aria-label="Play audio"
                aria-hidden="${isPlaying}">
          🔊 Listen
        </button>
        <button class="kids-audio-btn-pause ${isPlaying ? 'is-visible' : ''}" 
                onclick="window.lessonEngine.pauseAudio()"
                aria-label="Pause audio"
                aria-hidden="${!isPlaying}">
          ⏸ Pause
        </button>
      `;
    } else {
      // Other themes: Single button (backward compatible)
      return `
        <button class="primary-btn secondary" onclick="window.lessonEngine.speakAllReading()">
          🔊 Play audio
        </button>
      `;
    }
  }

  // ========================================
  // SIDEBAR RENDERING
  // ========================================

  renderSidebar(myWords) {
    if (myWords.length === 0) {
      return `
        <div class="sidebar-empty">
          No saved words yet. Click on words in the reading to add them here.
        </div>
      `;
    }

    return myWords.map(word => {
      const safeWord = this.escapeHTML(word.word).replace(/'/g, "\\'");
      return `
        <div class="sidebar-word">
          <div class="sidebar-word-main">
            <span class="sidebar-word-text">${this.escapeHTML(word.word)}</span>
          </div>
          <div class="sidebar-word-meta">${this.escapeHTML(word.definition)}</div>
          <div class="sidebar-actions">
            <button class="icon-btn primary" onclick="window.lessonEngine.speakWord('${safeWord}')" aria-label="Speak">
              <span>🔊</span>
            </button>
            <button class="icon-btn danger" onclick="window.lessonEngine.removeWord('${safeWord}')" aria-label="Remove">
              <span>❌</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * ✨ Render Dialogue Order Exercise
   * @returns {string} HTML string for dialogue ordering exercise
   */
  renderDialogueOrder() {
    const reading = this.data.content?.reading;
    if (!Array.isArray(reading)) return '';

    const dialogueBlock = reading.find(x => x && x.type === 'dialogue' && typeof x.text === 'string');
    if (!dialogueBlock) return '';

    // Parse "- line" format
    const lines = dialogueBlock.text
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.startsWith('- '))
      .map(s => s.replace(/^- /, '').trim());

    // Expect alternating turns; pair them as L/S
    const pairs = [];
    for (let i = 0; i < lines.length; i += 2) {
      const L = lines[i] || '';
      const S = lines[i + 1] || '';
      if (L && S) pairs.push({ L, S });
    }

    if (pairs.length === 0) return '';

    return `
      <section class="card dialogue-order-card" id="dialogue-order-section" style="margin: var(--spacing-lg) 0;">
        <div class="card-header">
          <h3 class="card-title">🧩 Dialogue: put it in order</h3>
        </div>

        <div class="card-body">
          <p style="margin-top:0">
            Put the dialogue in the correct order. Then click <strong>Check</strong>.
          </p>

          <ol id="dialogue-sort-list" style="display:grid; gap:12px; padding-left: 20px; margin: 12px 0;"></ol>

          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top: 12px;">
            <button class="primary-btn" id="dialogue-check-btn">✅ Check</button>
            <button class="primary-btn secondary" id="dialogue-reset-btn">🔄 Shuffle</button>
            <button class="primary-btn secondary" id="dialogue-listen-btn">🔊 Listen (full)</button>
          </div>

          <div id="dialogue-result" style="margin-top: 12px; color: var(--text-soft);"></div>
        </div>
      </section>

      <style>
        .dialogue-item {
          list-style: decimal;
          background: rgba(9, 13, 32, 0.5);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--radius-md);
          padding: 12px;
          cursor: grab;
          user-select: none;
        }
        .dialogue-item:active { cursor: grabbing; }
        .dialogue-lines { display: grid; gap: 6px; }
        .dialogue-line { line-height: 1.45; }
        .dialogue-line .speaker {
          display:inline-block;
          min-width: 1.6em;
          font-weight: 700;
          color: var(--accent);
        }

        .dialogue-item.correct {
          outline: 2px solid rgba(34,197,94,0.7);
          background: rgba(34,197,94,0.12);
        }
        .dialogue-item.wrong {
          outline: 2px solid rgba(239,68,68,0.65);
          background: rgba(239,68,68,0.10);
        }
        .dialogue-drop-target {
          outline: 2px dashed rgba(59,130,246,0.7);
        }

        .dialogue-move {
          display:flex; gap:6px; margin-top: 10px;
        }
        .dialogue-move button {
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: inherit;
          border-radius: 10px;
          padding: 6px 10px;
          cursor: pointer;
        }
      </style>

      <script>
      (() => {
        // Initialize dialogue order exercise after DOM is ready
        setTimeout(() => {
          const Exercise = {
            correctOrderIds: [],     // e.g. [0,1,2,3,4]
            itemsById: new Map(),    // id -> { L, S }
            listEl: null,

            init() {
              this.listEl = document.getElementById('dialogue-sort-list');
              if (!this.listEl) return;

              // Parse dialogue data from lesson
              this.buildFromLessonData();
              this.shuffleAndRender();

              // Add event listeners
              document.getElementById('dialogue-check-btn')?.addEventListener('click', () => this.check());
              document.getElementById('dialogue-reset-btn')?.addEventListener('click', () => this.shuffleAndRender());
              document.getElementById('dialogue-listen-btn')?.addEventListener('click', () => this.listenFull());
            },

            buildFromLessonData() {
              const reading = window.lessonEngine?.lessonData?.content?.reading;
              if (!Array.isArray(reading)) return;

              const dialogueBlock = reading.find(x => x && x.type === 'dialogue' && typeof x.text === 'string');
              if (!dialogueBlock) return;

              // Parse "- line" format
              const lines = dialogueBlock.text
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.startsWith('- '))
                .map(s => s.replace(/^- /, '').trim());

              // Expect alternating turns; pair them as L/S
              const pairs = [];
              for (let i = 0; i < lines.length; i += 2) {
                const L = lines[i] || '';
                const S = lines[i + 1] || '';
                if (L && S) pairs.push({ L, S });
              }

              // Store canonical order
              this.itemsById.clear();
              this.correctOrderIds = pairs.map((_, idx) => idx);
              pairs.forEach((p, idx) => this.itemsById.set(idx, p));
            },

            shuffleAndRender() {
              const ids = [...this.correctOrderIds];
              for (let i = ids.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [ids[i], ids[j]] = [ids[j], ids[i]];
              }
              this.render(ids);
              const resultEl = document.getElementById('dialogue-result');
              if (resultEl) resultEl.textContent = 'Drag items to reorder, then press Check.';
            },

            render(orderIds) {
              if (!this.listEl) return;
              this.listEl.innerHTML = '';

              orderIds.forEach(id => {
                const p = this.itemsById.get(id);
                if (!p) return;

                const li = document.createElement('li');
                li.className = 'dialogue-item';
                li.draggable = true;
                li.dataset.id = String(id);

                li.innerHTML = \`
                  <div class="dialogue-lines">
                    <div class="dialogue-line"><span class="speaker">L:</span> \${this.escape(p.L)}</div>
                    <div class="dialogue-line"><span class="speaker">S:</span> \${this.escape(p.S)}</div>
                  </div>
                  <div class="dialogue-move">
                    <button type="button" data-move="up">↑</button>
                    <button type="button" data-move="down">↓</button>
                  </div>
                \`;

                // Drag & drop handlers
                li.addEventListener('dragstart', (e) => {
                  e.dataTransfer.setData('text/plain', li.dataset.id);
                  e.dataTransfer.effectAllowed = 'move';
                });
                li.addEventListener('dragover', (e) => {
                  e.preventDefault();
                  li.classList.add('dialogue-drop-target');
                });
                li.addEventListener('dragleave', () => li.classList.remove('dialogue-drop-target'));
                li.addEventListener('drop', (e) => {
                  e.preventDefault();
                  li.classList.remove('dialogue-drop-target');
                  const draggedId = e.dataTransfer.getData('text/plain');
                  if (!draggedId) return;
                  this.moveDraggedBefore(draggedId, li.dataset.id);
                });

                // Mobile-friendly up/down
                li.querySelectorAll('button[data-move]').forEach(btn => {
                  btn.addEventListener('click', (e) => {
                    const dir = e.currentTarget.dataset.move;
                    this.moveByButtons(li.dataset.id, dir);
                  });
                });

                this.listEl.appendChild(li);
              });
            },

            moveDraggedBefore(draggedId, targetId) {
              if (draggedId === targetId) return;
              const nodes = [...this.listEl.querySelectorAll('.dialogue-item')];
              const dragged = nodes.find(n => n.dataset.id === draggedId);
              const target = nodes.find(n => n.dataset.id === targetId);
              if (!dragged || !target) return;
              this.listEl.insertBefore(dragged, target);
            },

            moveByButtons(id, dir) {
              const nodes = [...this.listEl.querySelectorAll('.dialogue-item')];
              const idx = nodes.findIndex(n => n.dataset.id === id);
              if (idx === -1) return;
              if (dir === 'up' && idx > 0) this.listEl.insertBefore(nodes[idx], nodes[idx - 1]);
              if (dir === 'down' && idx < nodes.length - 1) this.listEl.insertBefore(nodes[idx + 1], nodes[idx]);
            },

            check() {
              const nodes = [...this.listEl.querySelectorAll('.dialogue-item')];
              const current = nodes.map(n => Number(n.dataset.id));

              let correctCount = 0;
              nodes.forEach((node, position) => {
                node.classList.remove('correct', 'wrong');
                const shouldBe = this.correctOrderIds[position];
                if (Number(node.dataset.id) === shouldBe) {
                  node.classList.add('correct');
                  correctCount++;
                } else {
                  node.classList.add('wrong');
                }
              });

              const total = this.correctOrderIds.length;
              const resultEl = document.getElementById('dialogue-result');
              if (resultEl) resultEl.textContent = \`Result: \${correctCount}/\${total} in the correct position.\`;

              window.lessonEngine?.showNotification?.(
                correctCount === total ? '🎉 Perfect! Dialogue order is correct.' : '🧠 Almost! Keep rearranging.'
              );
            },

            listenFull() {
              // Speak the full dialogue in correct order, L then S for each pair
              const texts = this.correctOrderIds.flatMap(id => {
                const p = this.itemsById.get(id);
                return [\`\${p.L}\`, \`\${p.S}\`];
              });
              if (window.lessonEngine?.tts?.speakSequence) {
                window.lessonEngine.tts.speakSequence(texts, 900);
              } else if (window.lessonEngine?.tts?.speak) {
                window.lessonEngine.tts.speak(texts.join(' '));
              }
            },

            escape(s) {
              const div = document.createElement('div');
              div.textContent = String(s);
              return div.innerHTML;
            }
          };

          Exercise.init();
        }, 100);
      })();
      </script>
    `;
  }
}