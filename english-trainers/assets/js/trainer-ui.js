/**
 * Trainer rendering & RAF-batched UI updates.
 */

Trainer.prototype._scheduleUpdate = function (component) {
  this._pendingUpdates.add(component);
  if (!this._rafHandle) {
    this._rafHandle = requestAnimationFrame(() => {
      this._flushUpdates();
      this._rafHandle = null;
    });
  }
};

Trainer.prototype._flushUpdates = function () {
  if (this._pendingUpdates.has('state')) {
    this._updateStats();
  }
  if (this._pendingUpdates.has('timer')) {
    this._updateTimer();
  }
  this._pendingUpdates.clear();
};

Trainer.prototype._cancelRAF = function () {
  if (this._rafHandle) {
    cancelAnimationFrame(this._rafHandle);
    this._rafHandle = null;
  }
};

Trainer.prototype._renderQuestion = function (question) {
  const container = this._dom.questionContainer;
  if (!container) return;

  // --- ЛОГИКА ДЛЯ FIND ERROR ---
  if (question.type === 'find_error') {
    container.innerHTML = `
      <div class="question" role="heading" aria-level="2">
        ${question.question}
      </div>
      <div class="options find-error-mode" role="group" aria-label="Sentence parts">
        <div class="sentence-row">
          ${question.options.map((opt, i) => `
            <button class="word-chunk-btn"
                    role="button"
                    data-index="${i}"
                    onclick="window.trainer.submitAnswer(${i})">
              ${this._escapeHTML(opt.text)}
            </button>
          `).join('')}
        </div>
      </div>
      <div id="feedback" class="feedback hidden" role="alert" aria-live="polite"></div>
    `;

    // ХАК: Нам нужно сообщить Trainer'у, какой индекс правильный
    // Обычно Trainer ожидает question.correctIndex или сверяет строки.
    // Давай пропатчим текущий вопрос прямо здесь:
    const correctIdx = question.options.findIndex(o => o.correct === true);
    this.state.currentQuestion.correctIndex = correctIdx;

    return;
  }

  // --- ОБЫЧНАЯ ЛОГИКА (GAP / CHOICE) ---
  container.innerHTML = `
    <div class="question" role="heading" aria-level="2">
      ${question.question}
    </div>
    <div class="options" role="radiogroup" aria-label="Answer options">
      ${question.options.map((opt, i) => `
        <button class="option"
                role="radio"
                aria-checked="false"
                data-index="${i}"
                onclick="window.trainer.submitAnswer(${i})">
          ${this._escapeHTML(opt)}
        </button>
      `).join('')}
    </div>
    <div id="feedback" class="feedback hidden" role="alert" aria-live="polite"></div>
  `;

  // Если вопрос типа GAP/CHOICE, надо найти индекс правильного текста
  if (question.correct) {
     this.state.currentQuestion.correctIndex = question.options.indexOf(question.correct);
  }
};

Trainer.prototype._showFeedback = function (isCorrect, selectedIndex) {
  const question = this.state.currentQuestion;

  // --- FIND ERROR MODE ---
  if (question.type === 'find_error') {
    const wordButtons = this._dom.questionContainer?.querySelectorAll('.word-chunk-btn');
    const feedbackEl = document.getElementById('feedback');

    if (wordButtons) {
      wordButtons.forEach((btn, i) => {
        btn.disabled = true;
        if (question.options[i].correct) {
          btn.classList.add('correct');
        } else if (i === selectedIndex && !isCorrect) {
          btn.classList.add('wrong');
        }
      });
    }

    if (feedbackEl) {
      feedbackEl.className = `feedback ${isCorrect ? 'correct' : 'wrong'}`;
      feedbackEl.innerHTML = this.getFeedback(isCorrect);
    }
    return;
  }

  // --- NORMAL MODE ---
  const options = this._dom.questionContainer?.querySelectorAll('.option');
  const feedbackEl = document.getElementById('feedback');

  if (options) {
    options.forEach((opt, i) => {
      opt.disabled = true;
      if (i === this.state.currentQuestion.correctIndex) {
        opt.classList.add('correct');
      } else if (i === selectedIndex && !isCorrect) {
        opt.classList.add('wrong');
      }
    });
  }

  if (feedbackEl) {
    feedbackEl.className = `feedback ${isCorrect ? 'correct' : 'wrong'}`;
    feedbackEl.innerHTML = this.getFeedback(isCorrect);
  }
};

Trainer.prototype._updateStats = function () {
  const scoreEl = this._dom.score;
  if (scoreEl) scoreEl.textContent = this.state.score;

  const streakEl = this._dom.streak;
  if (streakEl) {
    streakEl.textContent = `🔥 ${this.state.streak}`;
    streakEl.classList.toggle('hidden', this.state.streak < 3);
  }

  const livesEl = this._dom.lives;
  if (livesEl) {
    livesEl.innerHTML = '❤️'.repeat(this.state.lives) +
      '💔'.repeat(this.config.maxLives - this.state.lives);
  }
};

Trainer.prototype._updateTimer = function () {
  const timerEl = this._dom.timer;
  if (timerEl) {
    timerEl.textContent = this.state.timeRemaining;
    timerEl.classList.toggle('warning', this.state.timeRemaining <= 5);
  }
};

Trainer.prototype._showResults = function (stats) {
  const container = this._dom.questionContainer;
  if (!container) return;

  const grade = stats.accuracy >= 90 ? '🏆' :
    stats.accuracy >= 70 ? '⭐' :
      stats.accuracy >= 50 ? '👍' : '💪';

  container.innerHTML = `
    <div class="results" style="text-align: center; animation: scaleIn 0.4s ease-out;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">${grade}</div>
      <h2 style="margin-bottom: 2rem;">Game Over!</h2>
      
      <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div class="stat-card card" style="padding: 1rem;">
          <div style="font-size: 2rem; color: var(--accent);">${stats.score}</div>
          <div style="font-size: 0.9rem; color: var(--text-muted);">Final Score</div>
        </div>
        <div class="stat-card card" style="padding: 1rem;">
          <div style="font-size: 2rem; color: var(--accent-success);">${stats.accuracy}%</div>
          <div style="font-size: 0.9rem; color: var(--text-muted);">Accuracy</div>
        </div>
        <div class="stat-card card" style="padding: 1rem;">
          <div style="font-size: 2rem; color: var(--accent-warning);">${stats.maxStreak}</div>
          <div style="font-size: 0.9rem; color: var(--text-muted);">Max Streak</div>
        </div>
        <div class="stat-card card" style="padding: 1rem;">
          <div style="font-size: 2rem;">${stats.duration}s</div>
          <div style="font-size: 0.9rem; color: var(--text-muted);">Duration</div>
        </div>
      </div>

      <button class="btn btn-primary" onclick="window.trainer.start()">
        🔄 Play Again
      </button>
    </div>
  `;
};
