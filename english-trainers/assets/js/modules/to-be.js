/**
 * TO BE TRAINER V3
 * Dynamic question generation via separate generator classes.
 */

class ToBeTrainer extends Trainer {
  constructor(config = {}) {
    super({
      name: 'To Be Trainer',
      maxLives: 3,
      streakBonus: 10,
      ...config
    });

    // Verb map (pronoun → to be form)
    this.verbMap = {
      'I': 'am',
      'you': 'are',
      'he': 'is',
      'she': 'is',
      'it': 'is',
      'we': 'are',
      'they': 'are'
    };

    // Initialize generators
    const genConfig = { verbMap: this.verbMap };
    this.generators = {
      recognition: new RecognitionGenerator(genConfig),
      'fill-in': new FillInGenerator(genConfig),
      'error-correction': new ErrorCorrectionGenerator(genConfig),
      transformation: new TransformationGenerator(genConfig),
      context: new ContextGenerator(genConfig)
    };

    // Question type weights by difficulty
    this.typeWeights = {
      lvl0: { recognition: 1.0 },
      easy: { recognition: 0.4, 'fill-in': 0.6 },
      medium: { 'fill-in': 0.4, 'error-correction': 0.35, transformation: 0.25 },
      hard: { 'fill-in': 0.4, 'error-correction': 0.25, transformation: 0.25, context: 0.1 }
    };

    this._currentDifficulty = 'easy';
    this._manualDifficulty = null;
  }

  generateQuestion() {
    // Check manual difficulty override
    if (this._manualDifficulty) {
      this._currentDifficulty = this._manualDifficulty;
    }

    const questionType = this._selectQuestionType();
    const generator = this.generators[questionType];

    // Generate question (pass difficulty for fill-in)
    if (questionType === 'fill-in') {
      return generator.generate(this._currentDifficulty);
    } else {
      return generator.generate();
    }
  }

  _selectQuestionType() {
    const weights = this.typeWeights[this._currentDifficulty] || this.typeWeights.easy;
    const types = Object.keys(weights);
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    
    let random = Math.random() * totalWeight;
    for (const type of types) {
      random -= weights[type];
      if (random <= 0) return type;
    }
    
    return types[0];
  }

  getFeedback(isCorrect) {
    if (isCorrect) {
      return this._getMotivationalPraise();
    }

    const meta = this.state.currentQuestion?.metadata;
    if (!meta) return 'Неправильно. Попробуй ещё раз!';

    // Use explanation from generator if available
    if (meta.explanation) {
      return `
        <div>Неправильно. Правильный ответ: <strong>${meta.correctVerb || meta.correctVerbs?.join(' / ')}</strong></div>
        <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
          💡 ${meta.explanation}
        </div>
      `;
    }

    return 'Неправильно. Попробуй ещё раз!';
  }

  _getMotivationalPraise() {
    const praise = [
      'Правильно! 🎯',
      'Отлично! ⭐',
      'Верно! 💯',
      'Супер! 🔥',
      'Молодец! 👏'
    ];
    return praise[Math.floor(Math.random() * praise.length)];
  }

  updateDifficulty(isCorrect) {
    if (this._manualDifficulty) return; // Don't auto-adjust if manual override

    const { questionsAnswered, currentStreak } = this.state;

    if (isCorrect) {
      if (currentStreak >= 5 && this._currentDifficulty === 'easy') this._currentDifficulty = 'medium';
      else if (currentStreak >= 5 && this._currentDifficulty === 'medium') this._currentDifficulty = 'hard';
    } else {
      if (questionsAnswered > 3) {
        if (this._currentDifficulty === 'hard') this._currentDifficulty = 'medium';
        else if (this._currentDifficulty === 'medium') this._currentDifficulty = 'easy';
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.ToBeTrainer = ToBeTrainer;
}
