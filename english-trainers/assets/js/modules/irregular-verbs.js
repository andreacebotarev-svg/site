/**
 * 🎯 Irregular Verbs Trainer
 * Тренажер неправильных глаголов с прогрессивной системой обучения
 * 
 * Режимы ввода:
 * - choice: выбор из 4 вариантов
 * - typing: ручной ввод
 * - hybrid: прогрессивный (choice → typing)
 * 
 * @extends Trainer (from trainer-core.js)
 */

import { 
  PATTERNS, 
  VERBS, 
  getVerbsByPattern, 
  getDistractors, 
  shuffleArray,
  getPatternsWithVerbs
} from '../data/irregular-verbs-db.js';

// ============================================
// КОНФИГУРАЦИЯ
// ============================================

const CONFIG = {
  // Жизни
  maxLives: 5,
  
  // Очки
  points: {
    correct: 10,
    streak3: 5,
    streak5: 10,
    streak10: 20,
    perfectSection: 50
  },
  
  // Режимы
  modes: {
    choice: {
      optionsCount: 4,
      showHintAfter: 2 // показать подсказку после N ошибок
    },
    typing: {
      showHintAfter: 2,
      hintLetters: 2 // показать первые N букв
    },
    hybrid: {
      levels: [
        { level: 1, mode: 'choice', options: 4, requiredAccuracy: 0.7 },
        { level: 2, mode: 'choice', options: 4, requiredAccuracy: 0.75 },
        { level: 3, mode: 'choice', options: 6, requiredAccuracy: 0.8 },
        { level: 4, mode: 'choice', options: 6, requiredAccuracy: 0.85 },
        { level: 5, mode: 'typing', requiredAccuracy: 0.9 }
      ]
    }
  },
  
  // Анимации
  feedbackDelay: 1000, // ms
  nextVerbDelay: 500   // ms
};

// ============================================
// КЛАСС ТРЕНАЖЕРА
// ============================================

export class IrregularVerbsTrainer {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      mode: 'hybrid', // choice | typing | hybrid
      sectionId: null, // null = все глаголы
      ...options
    };
    
    // Состояние
    this.state = {
      screen: 'menu', // menu | playing | results | exam
      currentPattern: null,
      currentVerbs: [],
      currentVerbIndex: 0,
      currentFormIndex: 0, // 0=v2, 1=v3
      lives: CONFIG.maxLives,
      score: 0,
      streak: 0,
      maxStreak: 0,
      mistakes: [],
      correctAnswers: 0,
      totalAnswers: 0,
      hybridLevel: 1,
      startTime: null
    };
    
    // Прогресс (LocalStorage)
    this.progress = this._loadProgress();
    
    // Effects manager (если подключен)
    this._effects = window.EffectsManager ? new window.EffectsManager() : null;
    
    // TTS (Text-to-Speech)
    this._tts = {
      supported: 'speechSynthesis' in window,
      voice: null,
      rate: 0.85,
      pitch: 1.0
    };
    this._initTTS();
    
    // Привязка методов
    this._handleAnswer = this._handleAnswer.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
  }
  
  // ============================================
  // TTS (TEXT-TO-SPEECH)
  // ============================================
  
  _initTTS() {
    if (!this._tts.supported) return;
    
    // Найти английский голос
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      // Предпочитаем UK English (Google UK, Microsoft Hazel и т.д.)
      this._tts.voice = voices.find(v => v.lang === 'en-GB') ||
                        voices.find(v => v.lang.startsWith('en-')) ||
                        voices[0];
    };
    
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }
  
  _speak(text) {
    return new Promise((resolve) => {
      if (!this._tts.supported) {
        resolve();
        return;
      }
      
      // Остановить предыдущее
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this._tts.voice;
      utterance.rate = this._tts.rate;
      utterance.pitch = this._tts.pitch;
      utterance.lang = 'en-GB';
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      speechSynthesis.speak(utterance);
    });
  }
  
  async _speakAllForms(verb) {
    // Последовательное произношение: V1 → V2 → V3
    await this._speak(verb.v1);
    await this._delay(400);
    await this._speak(verb.v2);
    await this._delay(400);
    await this._speak(verb.v3);
  }
  
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ============================================
  // ИНИЦИАЛИЗАЦИЯ
  // ============================================
  
  async init() {
    this._bindGlobalEvents();
    
    // Загрузить звуковые эффекты
    if (this._effects) {
      await this._effects.loadAudioAssets({
        correct: 'assets/audio/correct.mp3',
        milestone: 'assets/audio/milestone.mp3',
        error: 'assets/audio/error.mp3'
      });
    }
    
    this.showMenu();
  }
  
  _bindGlobalEvents() {
    document.addEventListener('keydown', this._handleKeydown);
  }
  
  _handleKeydown(e) {
    if (this.state.screen !== 'playing') return;
    
    // Цифры 1-6 для выбора варианта
    if (this._currentMode === 'choice') {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 6) {
        const btn = this.container.querySelector(`.option-btn[data-index="${num - 1}"]`);
        if (btn) btn.click();
      }
    }
    
    // Enter для проверки ввода
    if (this._currentMode === 'typing' && e.key === 'Enter') {
      this._checkTypingAnswer();
    }
  }
  
  // ============================================
  // ЭКРАНЫ
  // ============================================
  
  showMenu() {
    this.state.screen = 'menu';
    const patterns = getPatternsWithVerbs();
    
    const html = `
      <div class="iv-menu">
        <header class="iv-header">
          <h1>🎯 Неправильные глаголы</h1>
          <p class="iv-subtitle">Выбери секцию или пройди экзамен</p>
        </header>
        
        <div class="iv-mode-selector">
          <label class="iv-mode-option ${this.options.mode === 'choice' ? 'active' : ''}">
            <input type="radio" name="mode" value="choice" ${this.options.mode === 'choice' ? 'checked' : ''}>
            <span class="iv-mode-icon">🎯</span>
            <span class="iv-mode-label">Выбор</span>
          </label>
          <label class="iv-mode-option ${this.options.mode === 'typing' ? 'active' : ''}">
            <input type="radio" name="mode" value="typing" ${this.options.mode === 'typing' ? 'checked' : ''}>
            <span class="iv-mode-icon">⌨️</span>
            <span class="iv-mode-label">Ввод</span>
          </label>
          <label class="iv-mode-option ${this.options.mode === 'hybrid' ? 'active' : ''}">
            <input type="radio" name="mode" value="hybrid" ${this.options.mode === 'hybrid' ? 'checked' : ''}>
            <span class="iv-mode-icon">🔄</span>
            <span class="iv-mode-label">Гибрид</span>
          </label>
        </div>
        
        <div class="iv-sections-grid">
          ${patterns.map(pattern => this._renderSectionCard(pattern)).join('')}
        </div>
        
        <div class="iv-exam-section">
          <button class="iv-exam-btn ${this._canTakeExam() ? '' : 'disabled'}" 
                  ${this._canTakeExam() ? '' : 'disabled'}>
            🏆 Экзамен (все глаголы)
            ${!this._canTakeExam() ? '<span class="iv-exam-hint">Пройди 80% секций</span>' : ''}
          </button>
        </div>
        
        <div class="iv-progress-bar">
          <div class="iv-progress-fill" style="width: ${this._getTotalProgress()}%"></div>
          <span class="iv-progress-text">
            ${this._getMasteredVerbsCount()}/${VERBS.length} глаголов изучено
          </span>
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
    this._bindMenuEvents();
  }
  
  _renderSectionCard(pattern) {
    const sectionProgress = this.progress.sections[pattern.code] || {};
    const unlocked = this._isSectionUnlocked(pattern.code);
    const stars = this._getStars(sectionProgress.accuracy || 0);
    
    return `
      <div class="iv-section-card ${unlocked ? '' : 'locked'}" 
           data-pattern="${pattern.code}"
           style="--section-color: ${pattern.color}">
        <div class="iv-section-emoji">${pattern.emoji}</div>
        <h3 class="iv-section-title">${pattern.name}</h3>
        <p class="iv-section-example">${pattern.example}</p>
        <div class="iv-section-stats">
          <span class="iv-section-count">${pattern.verbCount} глаголов</span>
          <span class="iv-section-stars">${stars}</span>
        </div>
        ${!unlocked ? '<div class="iv-section-lock">🔒</div>' : ''}
        ${sectionProgress.accuracy ? `<div class="iv-section-accuracy">${Math.round(sectionProgress.accuracy * 100)}%</div>` : ''}
      </div>
    `;
  }
  
  _bindMenuEvents() {
    // Выбор режима
    this.container.querySelectorAll('input[name="mode"]').forEach(input => {
      input.addEventListener('change', (e) => {
        this.options.mode = e.target.value;
        this.container.querySelectorAll('.iv-mode-option').forEach(opt => {
          opt.classList.toggle('active', opt.querySelector('input').value === this.options.mode);
        });
      });
    });
    
    // Выбор секции
    this.container.querySelectorAll('.iv-section-card:not(.locked)').forEach(card => {
      card.addEventListener('click', () => {
        const patternCode = card.dataset.pattern;
        this.startSection(patternCode);
      });
    });
    
    // Экзамен
    const examBtn = this.container.querySelector('.iv-exam-btn:not(.disabled)');
    if (examBtn) {
      examBtn.addEventListener('click', () => this.startExam());
    }
  }
  
  // ============================================
  // ИГРОВОЙ ПРОЦЕСС
  // ============================================
  
  startSection(patternCode) {
    this.state.screen = 'playing';
    this.state.currentPattern = PATTERNS[patternCode];
    this.state.currentVerbs = shuffleArray(getVerbsByPattern(patternCode));
    this.state.currentVerbIndex = 0;
    this.state.currentFormIndex = 0;
    this.state.lives = CONFIG.maxLives;
    this.state.score = 0;
    this.state.streak = 0;
    this.state.maxStreak = 0;
    this.state.mistakes = [];
    this.state.correctAnswers = 0;
    this.state.totalAnswers = 0;
    this.state.startTime = Date.now();
    
    // Определить режим
    this._currentMode = this._getCurrentMode();
    
    this._renderGame();
  }
  
  startExam() {
    this.state.screen = 'exam';
    this.state.currentPattern = null;
    this.state.currentVerbs = shuffleArray([...VERBS]);
    this.state.currentVerbIndex = 0;
    this.state.currentFormIndex = 0;
    this.state.lives = CONFIG.maxLives;
    this.state.score = 0;
    this.state.streak = 0;
    this.state.maxStreak = 0;
    this.state.mistakes = [];
    this.state.correctAnswers = 0;
    this.state.totalAnswers = 0;
    this.state.startTime = Date.now();
    
    this._currentMode = 'typing'; // Экзамен всегда typing
    
    this._renderGame();
  }
  
  _getCurrentMode() {
    if (this.options.mode === 'hybrid') {
      const level = CONFIG.modes.hybrid.levels[this.state.hybridLevel - 1];
      return level.mode;
    }
    return this.options.mode;
  }
  
  _getCurrentOptionsCount() {
    if (this.options.mode === 'hybrid') {
      const level = CONFIG.modes.hybrid.levels[this.state.hybridLevel - 1];
      return level.options || 4;
    }
    return CONFIG.modes.choice.optionsCount;
  }
  
  _renderGame() {
    const verb = this.state.currentVerbs[this.state.currentVerbIndex];
    if (!verb) {
      this._showResults();
      return;
    }
    
    const formLabels = {
      0: { label: 'Past Simple (V2)', key: 'v2' },
      1: { label: 'Past Participle (V3)', key: 'v3' }
    };
    
    const currentForm = formLabels[this.state.currentFormIndex];
    const pattern = this.state.currentPattern || PATTERNS[verb.pattern];
    
    const html = `
      <div class="iv-game">
        <header class="iv-game-header">
          <div class="iv-lives">
            ${this._renderLives()}
          </div>
          <div class="iv-game-info">
            <span class="iv-pattern-name">${pattern.emoji} ${pattern.name}</span>
            <span class="iv-progress">${this.state.currentVerbIndex + 1}/${this.state.currentVerbs.length}</span>
          </div>
          <div class="iv-score-streak">
            <span class="iv-score">🏆 ${this.state.score}</span>
            ${this.state.streak > 0 ? `<span class="iv-streak">🔥${this.state.streak}</span>` : ''}
          </div>
        </header>
        
        <main class="iv-game-main">
          <div class="iv-verb-card">
            <div class="iv-verb-v1">${verb.v1.toUpperCase()}</div>
            <div class="iv-verb-transcription">${verb.transcription}</div>
            <div class="iv-verb-translation">${verb.translation}</div>
          </div>
          
          <div class="iv-question">
            <span class="iv-question-label">${currentForm.label}:</span>
            ${this._renderInputArea(verb, currentForm.key)}
          </div>
          
          <div class="iv-pattern-hint">
            <span class="iv-hint-icon">💡</span>
            <span class="iv-hint-text">${pattern.rule}</span>
          </div>
        </main>
        
        <footer class="iv-game-footer">
          <button class="iv-btn iv-btn-secondary iv-btn-back" title="Назад в меню">
            ← Меню
          </button>
          <div class="iv-level-indicator">
            ${this.options.mode === 'hybrid' ? `Уровень ${this.state.hybridLevel}/5` : ''}
          </div>
        </footer>
      </div>
    `;
    
    this.container.innerHTML = html;
    this._bindGameEvents();
    
    // Фокус на поле ввода
    if (this._currentMode === 'typing') {
      setTimeout(() => {
        const input = this.container.querySelector('.iv-typing-input');
        if (input) input.focus();
      }, 100);
    }
  }
  
  _renderLives() {
    return Array(CONFIG.maxLives)
      .fill(0)
      .map((_, i) => `<span class="iv-heart ${i < this.state.lives ? 'active' : 'lost'}">❤️</span>`)
      .join('');
  }
  
  _renderInputArea(verb, formKey) {
    if (this._currentMode === 'typing') {
      return `
        <div class="iv-typing-area">
          <input type="text" 
                 class="iv-typing-input" 
                 placeholder="Введите ответ..." 
                 autocomplete="off"
                 autocapitalize="off"
                 spellcheck="false">
          <button class="iv-btn iv-btn-primary iv-check-btn">Проверить</button>
        </div>
      `;
    } else {
      // Choice mode
      const correctAnswer = verb[formKey].toLowerCase();
      const distractors = getDistractors(verb, formKey, this._getCurrentOptionsCount() - 1);
      const options = shuffleArray([correctAnswer, ...distractors]);
      
      return `
        <div class="iv-options-grid">
          ${options.map((opt, i) => `
            <button class="iv-btn option-btn" data-answer="${opt}" data-index="${i}">
              <span class="iv-option-number">${i + 1}</span>
              <span class="iv-option-text">${opt}</span>
            </button>
          `).join('')}
        </div>
      `;
    }
  }
  
  _bindGameEvents() {
    // Кнопки вариантов
    this.container.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const answer = btn.dataset.answer;
        this._handleAnswer(answer, btn);
      });
    });
    
    // Ввод текста
    const input = this.container.querySelector('.iv-typing-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this._checkTypingAnswer();
        }
      });
    }
    
    const checkBtn = this.container.querySelector('.iv-check-btn');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => this._checkTypingAnswer());
    }
    
    // Кнопка назад
    const backBtn = this.container.querySelector('.iv-btn-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.showMenu());
    }
  }
  
  _checkTypingAnswer() {
    const input = this.container.querySelector('.iv-typing-input');
    if (!input) return;
    
    const answer = input.value.trim().toLowerCase();
    if (!answer) return;
    
    this._handleAnswer(answer, input);
  }
  
  _handleAnswer(answer, element) {
    const verb = this.state.currentVerbs[this.state.currentVerbIndex];
    const formKey = this.state.currentFormIndex === 0 ? 'v2' : 'v3';
    const correctAnswer = verb[formKey].toLowerCase();
    
    // Для глаголов с альтернативами (was/were, burnt/burned)
    const correctAnswers = correctAnswer.split('/').map(a => a.trim());
    const isCorrect = correctAnswers.includes(answer.toLowerCase());
    
    this.state.totalAnswers++;
    
    if (isCorrect) {
      this._handleCorrect(element, correctAnswer);
    } else {
      this._handleWrong(element, correctAnswer, answer, verb, formKey);
    }
  }
  
  _handleCorrect(element, correctAnswer) {
    this.state.correctAnswers++;
    this.state.streak++;
    this.state.maxStreak = Math.max(this.state.maxStreak, this.state.streak);
    
    // Очки
    let points = CONFIG.points.correct;
    if (this.state.streak >= 10) points += CONFIG.points.streak10;
    else if (this.state.streak >= 5) points += CONFIG.points.streak5;
    else if (this.state.streak >= 3) points += CONFIG.points.streak3;
    
    this.state.score += points;
    
    // Визуальный feedback
    if (element) {
      element.classList.add('correct');
      if (element.classList.contains('option-btn')) {
        element.innerHTML += ' ✓';
      }
    }
    
    // Effects
    if (this._effects) {
      this._effects.triggerSuccessEffects(this.state.streak, element);
    }
    
    const verb = this.state.currentVerbs[this.state.currentVerbIndex];
    
    // Следующая форма или показать произношение
    setTimeout(() => {
      if (this.state.currentFormIndex === 0) {
        // Переход к V3
        this.state.currentFormIndex = 1;
        this._renderGame();
      } else {
        // Обе формы угаданы — показать экран произношения
        this._showPronunciationScreen(verb);
      }
    }, CONFIG.feedbackDelay);
  }
  
  // ============================================
  // ЭКРАН ПРОИЗНОШЕНИЯ
  // ============================================
  
  async _showPronunciationScreen(verb) {
    const html = `
      <div class="iv-pronunciation">
        <div class="iv-pronunciation-header">
          <h2>🎧 Давай произнесём!</h2>
          <p class="iv-pronunciation-subtitle">Послушай и повтори все 3 формы</p>
        </div>
        
        <div class="iv-pronunciation-card">
          <div class="iv-pronunciation-translation">${verb.translation}</div>
          
          <div class="iv-pronunciation-forms">
            <div class="iv-form-item" data-form="v1">
              <span class="iv-form-label">V1 (Infinitive)</span>
              <span class="iv-form-word">${verb.v1}</span>
              <span class="iv-form-transcription">${verb.transcription}</span>
            </div>
            
            <div class="iv-form-item" data-form="v2">
              <span class="iv-form-label">V2 (Past)</span>
              <span class="iv-form-word">${verb.v2}</span>
              <span class="iv-form-transcription"></span>
            </div>
            
            <div class="iv-form-item" data-form="v3">
              <span class="iv-form-label">V3 (Participle)</span>
              <span class="iv-form-word">${verb.v3}</span>
              <span class="iv-form-transcription"></span>
            </div>
          </div>
          
          <div class="iv-pronunciation-status">
            <span class="iv-status-icon">🔊</span>
            <span class="iv-status-text">Произношу...</span>
          </div>
        </div>
        
        <div class="iv-pronunciation-actions">
          <button class="iv-btn iv-btn-secondary iv-skip-btn">⏭️ Пропустить</button>
          <button class="iv-btn iv-btn-primary iv-repeat-btn" disabled>🔄 Повторить</button>
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
    
    // Привязка кнопок
    const skipBtn = this.container.querySelector('.iv-skip-btn');
    const repeatBtn = this.container.querySelector('.iv-repeat-btn');
    
    skipBtn.addEventListener('click', () => this._finishPronunciation());
    repeatBtn.addEventListener('click', () => this._playPronunciation(verb));
    
    // Начать произношение
    await this._playPronunciation(verb);
    
    // Включить кнопку повтора
    repeatBtn.disabled = false;
    
    // Автопереход через 1.5 секунды после произношения
    setTimeout(() => {
      this._finishPronunciation();
    }, 1500);
  }
  
  async _playPronunciation(verb) {
    const forms = ['v1', 'v2', 'v3'];
    const statusText = this.container.querySelector('.iv-status-text');
    
    for (const form of forms) {
      // Подсветить текущую форму
      const formItem = this.container.querySelector(`.iv-form-item[data-form="${form}"]`);
      if (formItem) {
        formItem.classList.add('speaking');
        if (statusText) statusText.textContent = `Произношу ${form.toUpperCase()}...`;
      }
      
      // Произнести
      await this._speak(verb[form]);
      await this._delay(300);
      
      // Убрать подсветку
      if (formItem) {
        formItem.classList.remove('speaking');
        formItem.classList.add('spoken');
      }
    }
    
    if (statusText) statusText.textContent = 'Готово! 🎉';
  }
  
  _finishPronunciation() {
    // Остановить TTS если ещё говорит
    if (this._tts.supported) {
      speechSynthesis.cancel();
    }
    
    // Следующий глагол
    this.state.currentVerbIndex++;
    this.state.currentFormIndex = 0;
    this._renderGame();
  }
  
  _handleWrong(element, correctAnswer, userAnswer, verb, formKey) {
    this.state.streak = 0;
    this.state.lives--;
    
    // Сохранить ошибку
    this.state.mistakes.push({
      verbId: verb.id,
      verb: verb.v1,
      form: formKey,
      userAnswer,
      correctAnswer,
      timestamp: Date.now()
    });
    
    // Визуальный feedback
    if (element) {
      element.classList.add('wrong');
      if (element.classList.contains('iv-typing-input')) {
        element.parentElement.insertAdjacentHTML('afterend', `
          <div class="iv-correct-answer">
            Правильный ответ: <strong>${correctAnswer}</strong>
          </div>
        `);
      }
    }
    
    // Показать правильный ответ в choice mode
    if (this._currentMode === 'choice') {
      const correctBtn = this.container.querySelector(`.option-btn[data-answer="${correctAnswer}"]`);
      if (correctBtn) {
        correctBtn.classList.add('correct');
      }
    }
    
    // Effects
    if (this._effects) {
      this._effects.triggerErrorEffects(element);
    }
    
    // Проверка game over
    if (this.state.lives <= 0) {
      setTimeout(() => this._showResults(), CONFIG.feedbackDelay);
      return;
    }
    
    // Следующий вопрос (тот же глагол, та же форма - повтор)
    setTimeout(() => {
      this._renderGame();
    }, CONFIG.feedbackDelay * 1.5);
  }
  
  // ============================================
  // РЕЗУЛЬТАТЫ
  // ============================================
  
  _showResults() {
    this.state.screen = 'results';
    
    const accuracy = this.state.totalAnswers > 0 
      ? this.state.correctAnswers / this.state.totalAnswers 
      : 0;
    
    const duration = Math.floor((Date.now() - this.state.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    const stars = this._getStars(accuracy);
    const patternCode = this.state.currentPattern?.code;
    
    // Сохранить прогресс
    if (patternCode) {
      this._saveProgress(patternCode, accuracy);
    }
    
    // Проверить повышение уровня в гибридном режиме
    if (this.options.mode === 'hybrid') {
      this._checkHybridLevelUp(accuracy);
    }
    
    const html = `
      <div class="iv-results">
        <div class="iv-results-header">
          <h2>${this.state.lives > 0 ? '🎉 Отлично!' : '😢 Попробуй ещё раз!'}</h2>
          <div class="iv-stars">${stars}</div>
        </div>
        
        <div class="iv-stats-grid">
          <div class="iv-stat-item">
            <span class="iv-stat-value">${Math.round(accuracy * 100)}%</span>
            <span class="iv-stat-label">Точность</span>
          </div>
          <div class="iv-stat-item">
            <span class="iv-stat-value">${this.state.score}</span>
            <span class="iv-stat-label">Очки</span>
          </div>
          <div class="iv-stat-item">
            <span class="iv-stat-value">${this.state.maxStreak}</span>
            <span class="iv-stat-label">Макс. серия</span>
          </div>
          <div class="iv-stat-item">
            <span class="iv-stat-value">${minutes}:${seconds.toString().padStart(2, '0')}</span>
            <span class="iv-stat-label">Время</span>
          </div>
        </div>
        
        ${this.state.mistakes.length > 0 ? `
          <div class="iv-mistakes-section">
            <h3>📝 Повтори эти глаголы:</h3>
            <div class="iv-mistakes-list">
              ${this._renderMistakesList()}
            </div>
          </div>
        ` : ''}
        
        <div class="iv-results-actions">
          <button class="iv-btn iv-btn-primary iv-retry-btn">
            🔄 Ещё раз
          </button>
          <button class="iv-btn iv-btn-secondary iv-menu-btn">
            ← В меню
          </button>
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
    this._bindResultsEvents();
  }
  
  _renderMistakesList() {
    // Уникальные ошибки
    const uniqueMistakes = [];
    const seen = new Set();
    
    for (const mistake of this.state.mistakes) {
      const key = `${mistake.verbId}-${mistake.form}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMistakes.push(mistake);
      }
    }
    
    return uniqueMistakes.slice(0, 5).map(m => `
      <div class="iv-mistake-item">
        <span class="iv-mistake-verb">${m.verb}</span>
        <span class="iv-mistake-arrow">→</span>
        <span class="iv-mistake-wrong">${m.userAnswer}</span>
        <span class="iv-mistake-arrow">→</span>
        <span class="iv-mistake-correct">${m.correctAnswer}</span>
      </div>
    `).join('');
  }
  
  _bindResultsEvents() {
    const retryBtn = this.container.querySelector('.iv-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        if (this.state.currentPattern) {
          this.startSection(this.state.currentPattern.code);
        } else {
          this.startExam();
        }
      });
    }
    
    const menuBtn = this.container.querySelector('.iv-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => this.showMenu());
    }
  }
  
  // ============================================
  // ПРОГРЕСС
  // ============================================
  
  _loadProgress() {
    try {
      const saved = localStorage.getItem('iv_progress');
      return saved ? JSON.parse(saved) : this._getDefaultProgress();
    } catch {
      return this._getDefaultProgress();
    }
  }
  
  _getDefaultProgress() {
    return {
      sections: {},
      totalScore: 0,
      hybridLevel: 1,
      masteredVerbs: []
    };
  }
  
  _saveProgress(patternCode, accuracy) {
    const current = this.progress.sections[patternCode] || {};
    
    this.progress.sections[patternCode] = {
      attempts: (current.attempts || 0) + 1,
      bestAccuracy: Math.max(current.bestAccuracy || 0, accuracy),
      accuracy: accuracy,
      lastAttempt: new Date().toISOString(),
      bestScore: Math.max(current.bestScore || 0, this.state.score)
    };
    
    this.progress.totalScore += this.state.score;
    
    try {
      localStorage.setItem('iv_progress', JSON.stringify(this.progress));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }
  
  _isSectionUnlocked(patternCode) {
    // Первые 3 секции всегда разблокированы
    const pattern = PATTERNS[patternCode];
    if (pattern.id <= 3) return true;
    
    // Остальные разблокируются при 60%+ в предыдущей
    const prevPatterns = Object.values(PATTERNS).filter(p => p.id < pattern.id);
    const prevCompleted = prevPatterns.filter(p => {
      const progress = this.progress.sections[p.code];
      return progress && progress.accuracy >= 0.6;
    });
    
    return prevCompleted.length >= pattern.id - 2;
  }
  
  _canTakeExam() {
    const completedSections = Object.entries(this.progress.sections)
      .filter(([_, data]) => data.accuracy >= 0.7)
      .length;
    
    return completedSections >= 8; // 80% секций
  }
  
  _getTotalProgress() {
    const masteredCount = this._getMasteredVerbsCount();
    return Math.round((masteredCount / VERBS.length) * 100);
  }
  
  _getMasteredVerbsCount() {
    let count = 0;
    
    for (const [patternCode, data] of Object.entries(this.progress.sections)) {
      if (data.accuracy >= 0.8) {
        count += getVerbsByPattern(patternCode).length;
      }
    }
    
    return Math.min(count, VERBS.length);
  }
  
  _getStars(accuracy) {
    if (accuracy >= 0.9) return '⭐⭐⭐';
    if (accuracy >= 0.7) return '⭐⭐☆';
    if (accuracy >= 0.5) return '⭐☆☆';
    return '☆☆☆';
  }
  
  _checkHybridLevelUp(accuracy) {
    const currentLevel = CONFIG.modes.hybrid.levels[this.state.hybridLevel - 1];
    
    if (accuracy >= currentLevel.requiredAccuracy && this.state.hybridLevel < 5) {
      this.state.hybridLevel++;
      this.progress.hybridLevel = this.state.hybridLevel;
      this._saveProgress('_hybrid', accuracy);
    }
  }
  
  // ============================================
  // CLEANUP
  // ============================================
  
  destroy() {
    document.removeEventListener('keydown', this._handleKeydown);
    this.container.innerHTML = '';
  }
}

// Экспорт для ES modules и глобальной области
if (typeof window !== 'undefined') {
  window.IrregularVerbsTrainer = IrregularVerbsTrainer;
}

export default IrregularVerbsTrainer;
