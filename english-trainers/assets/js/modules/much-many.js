/**
 * MUCH/MANY/A LOT OF TRAINER
 * Natural speech focus: teaching how native speakers actually talk
 * Falling questions game with 3-lane system and player controller
 */

class MuchManyTrainer {
  constructor(config = {}) {
    // Mobile detection
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    
    this.config = {
      maxLives: config.maxLives ?? 5,
      lanes: config.lanes ?? 3,
      baseSpawnInterval: this.isMobile ? 5000 : 4000,
      baseFallDuration: this.isMobile ? 12000 : 10000,
      maxActiveQuestions: this.isMobile ? 3 : 5,
      powerUpInterval: 120000,
      ...config
    };

    this.state = {
      score: 0,
      lives: this.config.maxLives,
      correctAnswers: 0,
      totalAnswers: 0,
      gameStartTime: null,
      isPlaying: false,
      currentSpeed: 1.0
    };

    this.player = {
      currentLane: 1,
      element: null
    };

    this.questions = [];
    this.spawnTimer = null;
    this.checkTimer = null;

    this.powerUps = {
      slowMotionActive: false,
      shieldActive: false,
      spawnTimer: null
    };

    this.touchStartX = 0;
    this.touchStartY = 0;

    this._dom = {};

    this._effects = new EffectsManager({
      enableHaptic: true,
      hapticIntensity: 1.0
    });

    this.vocabulary = {
      countable: [
        { en: 'apples', ru: 'яблок' },
        { en: 'books', ru: 'книг' },
        { en: 'cars', ru: 'машин' },
        { en: 'students', ru: 'студентов' },
        { en: 'questions', ru: 'вопросов' },
        { en: 'friends', ru: 'друзей' },
        { en: 'people', ru: 'людей' },
        { en: 'houses', ru: 'домов' },
        { en: 'trees', ru: 'деревьев' },
        { en: 'animals', ru: 'животных' },
        { en: 'ideas', ru: 'идей' },
        { en: 'mistakes', ru: 'ошибок' },
        { en: 'photos', ru: 'фотографий' },
        { en: 'emails', ru: 'писем' }
      ],
      uncountable: [
        { en: 'water', ru: 'воды' },
        { en: 'money', ru: 'денег' },
        { en: 'time', ru: 'времени' },
        { en: 'information', ru: 'информации' },
        { en: 'sugar', ru: 'сахара' },
        { en: 'coffee', ru: 'кофе' },
        { en: 'milk', ru: 'молока' },
        { en: 'bread', ru: 'хлеба' },
        { en: 'music', ru: 'музыки' },
        { en: 'love', ru: 'любви' },
        { en: 'homework', ru: 'домашки' },
        { en: 'furniture', ru: 'мебели' },
        { en: 'advice', ru: 'советов' },
        { en: 'work', ru: 'работы' }
      ]
    };

    this._initDOM();
    this._bindControls();
  }

  _initDOM() {
    this._dom = {
      startScreen: document.getElementById('start-screen'),
      gameArena: document.getElementById('game-arena'),
      gameOverScreen: document.getElementById('game-over-screen'),
      answerPanel: document.getElementById('answer-panel'),
      player: document.getElementById('player'),
      lanes: document.querySelectorAll('.lane'),
      score: document.getElementById('score'),
      speed: document.getElementById('speed'),
      lives: document.getElementById('lives'),
      powerUpIndicator: document.getElementById('power-up-indicator'),
      powerUpText: document.getElementById('power-up-text'),
      stoneThrow: document.getElementById('stone-throw'),
      finalScore: document.getElementById('final-score'),
      finalAccuracy: document.getElementById('final-accuracy'),
      finalDuration: document.getElementById('final-duration')
    };

    this.player.element = this._dom.player;
  }

  _bindControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (!this.state.isPlaying) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.movePlayer('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.movePlayer('right');
      }
    });

    // Touch controls (swipe)
    document.addEventListener('touchstart', (e) => {
      if (!this.state.isPlaying) return;
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (!this.state.isPlaying) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - this.touchStartX;
      const diffY = touchEndY - this.touchStartY;

      const swipeThreshold = Math.max(30, window.innerWidth * 0.08);

      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
        e.preventDefault();
        if (diffX > 0) {
          this.movePlayer('right');
        } else {
          this.movePlayer('left');
        }
      }
    }, { passive: false });
  }

  start() {
    this.state = {
      score: 0,
      lives: this.config.maxLives,
      correctAnswers: 0,
      totalAnswers: 0,
      gameStartTime: Date.now(),
      isPlaying: true,
      currentSpeed: 1.0
    };

    this.player.currentLane = 1;
    this.questions = [];

    this._dom.startScreen.style.display = 'none';
    this._dom.gameOverScreen.style.display = 'none';
    this._dom.gameArena.style.display = 'block';
    this._dom.answerPanel.style.display = 'flex';

    this._updateUI();
    this._updateActiveLane();
    this._startSpawning();
    this._startChecking();
    this._startPowerUpSpawning();

    this._effects._haptic.vibrate('impact');
  }

  restart() {
    this._cleanup();
    this.start();
  }

  _startSpawning() {
    const spawn = () => {
      if (!this.state.isPlaying) return;

      if (this.questions.length < this.config.maxActiveQuestions) {
        this._spawnQuestion();
      }

      const interval = this.config.baseSpawnInterval / this.state.currentSpeed;
      this.spawnTimer = setTimeout(spawn, interval);
    };

    spawn();
  }

  _startChecking() {
    this.checkTimer = setInterval(() => {
      if (!this.state.isPlaying) return;
      this._checkMissedQuestions();
    }, 100);
  }

  _startPowerUpSpawning() {
    const spawnPowerUp = () => {
      if (!this.state.isPlaying) return;

      this._spawnPowerUp();
      this.powerUps.spawnTimer = setTimeout(spawnPowerUp, this.config.powerUpInterval);
    };

    this.powerUps.spawnTimer = setTimeout(spawnPowerUp, this.config.powerUpInterval);
  }

  _spawnQuestion() {
    const lane = Math.floor(Math.random() * this.config.lanes);
    const questionData = this._generateQuestion();
    const element = this._createQuestionElement(questionData, lane);

    const fallDuration = this._calculateFallDuration();

    const question = {
      id: Date.now() + Math.random(),
      lane: lane,
      data: questionData,
      element: element,
      startTime: Date.now(),
      duration: fallDuration,
      animation: null
    };

    this.questions.push(question);
    this._dom.lanes[lane].appendChild(element);

    const fallDistance = window.innerHeight - 150;

    const keyframes = [
      { transform: 'translateX(-50%) translateY(0) translateZ(0)' },
      { transform: `translateX(-50%) translateY(${fallDistance}px) translateZ(0)` }
    ];

    const animation = element.animate(keyframes, {
      duration: fallDuration,
      easing: 'linear',
      fill: 'forwards'
    });

    question.animation = animation;
  }

  _generateQuestion() {
    const rand = Math.random();
    
    // Pick word (countable/uncountable)
    const wordType = Math.random();
    let word, isCountable;
    if (wordType < 0.5) {
      word = this.vocabulary.countable[Math.floor(Math.random() * this.vocabulary.countable.length)];
      isCountable = true;
    } else {
      word = this.vocabulary.uncountable[Math.floor(Math.random() * this.vocabulary.uncountable.length)];
      isCountable = false;
    }

    // SIMPLIFIED DISTRIBUTION (child-friendly):
    // 30% - How much/many questions (clear grammar rule)
    // 45% - Positive statements with "a lot of" (natural speech)
    // 15% - Negatives with much/many ONLY (avoid confusion)
    // 10% - General questions with "a lot of" (conversational)

    if (rand < 0.30) {
      // HOW MUCH/MANY QUESTIONS (30%)
      // Only much/many are grammatically correct here
      if (isCountable) {
        return {
          text: `How ___ ${word.en} do you need?`,
          correctAnswer: 'many',
          hint: 'Исчисляемое → many',
          type: 'how-question-countable'
        };
      } else {
        return {
          text: `How ___ ${word.en} is there?`,
          correctAnswer: 'much',
          hint: 'Неисчисляемое → much',
          type: 'how-question-uncountable'
        };
      }
    } else if (rand < 0.75) {
      // POSITIVE STATEMENTS (45%)
      // "A lot of" is the natural choice - this is how natives speak!
      const statementRand = Math.random();
      
      if (statementRand < 0.80) {
        // 80% use "a lot of" (NATURAL SPEECH)
        return {
          text: isCountable ? `I have ___ ${word.en}` : `There is ___ ${word.en} here`,
          correctAnswer: 'a lot of',
          hint: 'В утверждениях носители чаще используют "a lot of"',
          type: 'statement-alotof'
        };
      } else {
        // 20% use much/many (for variety)
        if (isCountable) {
          return {
            text: `I have ___ ${word.en}`,
            correctAnswer: 'many',
            hint: 'Исчисляемое → many',
            type: 'statement-countable'
          };
        } else {
          return {
            text: `There is ___ ${word.en} here`,
            correctAnswer: 'much',
            hint: 'Неисчисляемое → much',
            type: 'statement-uncountable'
          };
        }
      }
    } else if (rand < 0.90) {
      // NEGATIVES (15%)
      // ONLY much/many to avoid confusion for children
      if (isCountable) {
        return {
          text: `I don't have ___ ${word.en}`,
          correctAnswer: 'many',
          hint: 'В отрицаниях: исчисляемое → many',
          type: 'negative-countable'
        };
      } else {
        return {
          text: `There isn't ___ ${word.en}`,
          correctAnswer: 'much',
          hint: 'В отрицаниях: неисчисляемое → much',
          type: 'negative-uncountable'
        };
      }
    } else {
      // GENERAL QUESTIONS (10%)
      // "A lot of" in conversational questions
      const qRand = Math.random();
      
      if (qRand < 0.70) {
        // "A lot of" in questions (conversational)
        return {
          text: isCountable ? `Do you have ___ ${word.en}?` : `Is there ___ ${word.en}?`,
          correctAnswer: 'a lot of',
          hint: 'В вопросах "a lot of" — разговорный вариант',
          type: 'general-question-alotof'
        };
      } else {
        // Much/many in general questions
        if (isCountable) {
          return {
            text: `Do you have ___ ${word.en}?`,
            correctAnswer: 'many',
            hint: 'Исчисляемое → many',
            type: 'general-question-countable'
          };
        } else {
          return {
            text: `Is there ___ ${word.en}?`,
            correctAnswer: 'much',
            hint: 'Неисчисляемое → much',
            type: 'general-question-uncountable'
          };
        }
      }
    }
  }

  _createQuestionElement(data, lane) {
    const div = document.createElement('div');
    div.className = 'falling-question';
    div.dataset.lane = lane;
    div.innerHTML = `
      <div class="question-text">${data.text}</div>
    `;
    return div;
  }

  _calculateFallDuration() {
    const elapsed = (Date.now() - this.state.gameStartTime) / 1000;
    const k = Math.log(0.01) / 600;
    const duration = Math.max(100, this.config.baseFallDuration * Math.exp(k * elapsed));

    this.state.currentSpeed = this.config.baseFallDuration / duration;
    this._dom.speed.textContent = `${this.state.currentSpeed.toFixed(1)}x`;

    return duration;
  }

  movePlayer(direction) {
    const prevLane = this.player.currentLane;

    if (direction === 'left' && this.player.currentLane > 0) {
      this.player.currentLane--;
    } else if (direction === 'right' && this.player.currentLane < this.config.lanes - 1) {
      this.player.currentLane++;
    } else {
      return;
    }

    this.player.element.setAttribute('data-current-lane', this.player.currentLane);
    this._updateActiveLane();
    
    if (this.isMobile && prevLane !== this.player.currentLane) {
      this._effects._haptic.vibrate('tick');
    } else if (!this.isMobile) {
      this._effects._haptic.vibrate('tick');
    }
  }

  _updateActiveLane() {
    this._dom.lanes.forEach((lane, i) => {
      lane.classList.toggle('active', i === this.player.currentLane);
    });
  }

  throwStone(answer) {
    if (!this.state.isPlaying) return;

    const targetQuestion = this._getQuestionInPlayerLane();
    if (!targetQuestion) {
      this._effects._haptic.vibrate('light');
      return;
    }

    this._animateStoneThrow();

    const isCorrect = answer === targetQuestion.data.correctAnswer;
    this._handleAnswer(targetQuestion, isCorrect);
  }

  _getQuestionInPlayerLane() {
    const questionsInLane = this.questions.filter(q => q.lane === this.player.currentLane);
    if (questionsInLane.length === 0) return null;

    return questionsInLane.reduce((closest, q) => {
      const qRect = q.element.getBoundingClientRect();
      const closestRect = closest.element.getBoundingClientRect();
      return qRect.bottom > closestRect.bottom ? q : closest;
    });
  }

  _animateStoneThrow() {
    this._dom.stoneThrow.textContent = '🪨';
    this._dom.stoneThrow.classList.add('active');
    this.player.element.classList.add('throwing');

    setTimeout(() => {
      this._dom.stoneThrow.classList.remove('active');
      this.player.element.classList.remove('throwing');
    }, 400);
  }

  _handleAnswer(question, isCorrect) {
    this.state.totalAnswers++;

    if (isCorrect) {
      this.state.correctAnswers++;
      this.state.score += 10;

      question.element.classList.add('correct');
      this._effects.triggerSuccessEffects(0, question.element);

      setTimeout(() => {
        this._removeQuestion(question);
      }, 500);
    } else {
      question.element.classList.add('wrong');
      question.element.innerHTML += `<div class="hint">💡 ${question.data.hint}</div>`;

      this._effects.triggerErrorEffects();

      const remainingTime = question.duration - (Date.now() - question.startTime);
      const newDuration = remainingTime * 0.8;

      question.duration = Date.now() - question.startTime + newDuration;

      setTimeout(() => {
        question.element.classList.remove('wrong');
      }, 500);
    }

    this._updateUI();
  }

  _checkMissedQuestions() {
    this.questions.forEach(question => {
      const elapsed = Date.now() - question.startTime;

      if (elapsed >= question.duration) {
        this._handleMissed(question);
      }
    });
  }

  _handleMissed(question) {
    if (this.powerUps.shieldActive) {
      this.powerUps.shieldActive = false;
      this.player.element.classList.remove('shielded');
      this._effects._haptic.vibrate('impact');
    } else {
      this.state.lives--;
      this._effects._haptic.vibrate('error');
    }

    this._removeQuestion(question);
    this._updateUI();

    if (this.state.lives <= 0) {
      this._gameOver();
    }
  }

  _removeQuestion(question) {
    const index = this.questions.indexOf(question);
    if (index > -1) {
      this.questions.splice(index, 1);
    }

    if (question.element && question.element.parentNode) {
      question.element.remove();
    }
  }

  _spawnPowerUp() {
    const types = ['slow-motion', 'clear-all', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];
    const lane = Math.floor(Math.random() * this.config.lanes);

    const element = document.createElement('div');
    element.className = 'power-up-item';
    element.dataset.type = type;
    element.dataset.lane = lane;

    const icons = {
      'slow-motion': '⏱️',
      'clear-all': '💣',
      'shield': '🛡️'
    };
    element.textContent = icons[type];

    this._dom.lanes[lane].appendChild(element);

    const fallDistance = window.innerHeight - 150;

    const keyframes = [
      { transform: 'translateX(-50%) translateY(0) translateZ(0)' },
      { transform: `translateX(-50%) translateY(${fallDistance}px) translateZ(0)` }
    ];

    element.animate(keyframes, {
      duration: 5000,
      easing: 'linear',
      fill: 'forwards'
    });

    const checkCollection = setInterval(() => {
      const rect = element.getBoundingClientRect();
      const playerRect = this.player.element.getBoundingClientRect();

      if (parseInt(element.dataset.lane, 10) === this.player.currentLane && 
          rect.bottom >= playerRect.top && rect.top <= playerRect.bottom) {
        this._collectPowerUp(type, element);
        clearInterval(checkCollection);
      }

      if (rect.bottom >= window.innerHeight) {
        element.remove();
        clearInterval(checkCollection);
      }
    }, 50);
  }

  _collectPowerUp(type, element) {
    element.classList.add('collected');
    setTimeout(() => element.remove(), 500);

    this._effects._haptic.vibrate('milestone');

    switch (type) {
      case 'slow-motion':
        this._activateSlowMotion();
        break;
      case 'clear-all':
        this._activateClearAll();
        break;
      case 'shield':
        this._activateShield();
        break;
    }
  }

  _activateSlowMotion() {
    this.powerUps.slowMotionActive = true;
    this._dom.gameArena.classList.add('slow-motion');
    this._showPowerUpIndicator('⏱️ Slow Motion');

    this.questions.forEach(q => {
      if (q.animation) q.animation.pause();
    });

    setTimeout(() => {
      this.questions.forEach(q => {
        if (q.animation) q.animation.play();
      });
      this._dom.gameArena.classList.remove('slow-motion');
      this.powerUps.slowMotionActive = false;
      this._hidePowerUpIndicator();
    }, 3000);
  }

  _activateClearAll() {
    this._showPowerUpIndicator('💣 Clear All');

    this.questions.forEach(q => {
      q.element.classList.add('correct');
      setTimeout(() => this._removeQuestion(q), 300);
    });

    setTimeout(() => this._hidePowerUpIndicator(), 1000);
  }

  _activateShield() {
    this.powerUps.shieldActive = true;
    this.player.element.classList.add('shielded');
    this._showPowerUpIndicator('🛡️ Shield Active');
  }

  _showPowerUpIndicator(text) {
    this._dom.powerUpText.textContent = text;
    this._dom.powerUpIndicator.style.display = 'flex';
  }

  _hidePowerUpIndicator() {
    this._dom.powerUpIndicator.style.display = 'none';
  }

  _updateUI() {
    this._dom.score.textContent = this.state.score;
    this._dom.lives.textContent = '❤️'.repeat(this.state.lives) + '💔'.repeat(this.config.maxLives - this.state.lives);
  }

  _gameOver() {
    this.state.isPlaying = false;
    this._cleanup();

    const duration = Math.floor((Date.now() - this.state.gameStartTime) / 1000);
    const accuracy = this.state.totalAnswers > 0 
      ? Math.round((this.state.correctAnswers / this.state.totalAnswers) * 100) 
      : 0;

    this._dom.finalScore.textContent = this.state.score;
    this._dom.finalAccuracy.textContent = `${accuracy}%`;
    this._dom.finalDuration.textContent = `${duration}с`;

    this._dom.gameArena.style.display = 'none';
    this._dom.answerPanel.style.display = 'none';
    this._dom.gameOverScreen.style.display = 'flex';

    this._effects._haptic.vibrate('error');
  }

  _cleanup() {
    if (this.spawnTimer) clearTimeout(this.spawnTimer);
    if (this.checkTimer) clearInterval(this.checkTimer);
    if (this.powerUps.spawnTimer) clearTimeout(this.powerUps.spawnTimer);

    this.questions.forEach(q => this._removeQuestion(q));
    this.questions = [];

    document.querySelectorAll('.power-up-item').forEach(el => el.remove());
  }
}

if (typeof window !== 'undefined') {
  window.MuchManyTrainer = MuchManyTrainer;
}
