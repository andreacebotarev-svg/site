/**
 * HAVE GOT TRAINER V2
 * Dynamic question generation via 5 generator classes
 */

class HaveGotTrainer extends Trainer {
  constructor(config = {}) {
    super({
      name: 'Have Got Trainer',
      maxLives: 3,
      ...config
    });

    // Subject mapping
    this.subjects = [
      { pronoun: 'I', verb: 'have', isPlural: true },
      { pronoun: 'you', verb: 'have', isPlural: true },
      { pronoun: 'he', verb: 'has', isPlural: false },
      { pronoun: 'she', verb: 'has', isPlural: false },
      { pronoun: 'it', verb: 'has', isPlural: false },
      { pronoun: 'we', verb: 'have', isPlural: true },
      { pronoun: 'they', verb: 'have', isPlural: true },
      { pronoun: 'Tom', verb: 'has', isPlural: false },
      { pronoun: 'my friend', verb: 'has', isPlural: false },
      { pronoun: 'the cat', verb: 'has', isPlural: false }
    ];

    // Possessions
    this.possessions = [
      'a brother', 'a sister', 'two brothers', 'three sisters',
      'a dog', 'a cat', 'two cats', 'a parrot',
      'a car', 'a bike', 'a laptop', 'a new phone',
      'blue eyes', 'long hair', 'brown eyes', 'a headache',
      'a lot of free time', 'a good idea', 'a question',
      'a big family', 'a new watch', 'an old bike'
    ];

    // Initialize generators
    const genConfig = {
      subjects: this.subjects,
      possessions: this.possessions
    };

    this.generators = {
      recognition: new HGRecognitionGenerator(genConfig),
      'fill-in': new HGFillInGenerator(genConfig),
      'error-correction': new HGErrorCorrectionGenerator(genConfig),
      transformation: new HGTransformationGenerator(genConfig),
      context: new HGContextGenerator(genConfig)
    };

    // Question type weights
    this.typeWeights = {
      easy: { recognition: 0.6, 'fill-in': 0.4 },
      medium: { 'fill-in': 0.5, 'error-correction': 0.3, recognition: 0.2 },
      hard: { transformation: 0.4, context: 0.2, 'error-correction': 0.25, 'fill-in': 0.15 }
    };

    this._currentDifficulty = 'easy';
  }

  generateQuestion() {
    this._updateDifficulty();

    const questionType = this._selectQuestionType();
    const generator = this.generators[questionType];

    return generator.generate();
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

  _updateDifficulty() {
    const { questionsAnswered, correctAnswers } = this.state;
    
    if (questionsAnswered < 5) {
      this._currentDifficulty = 'easy';
    } else if (questionsAnswered < 12) {
      const accuracy = correctAnswers / questionsAnswered;
      this._currentDifficulty = accuracy >= 0.75 ? 'medium' : 'easy';
    } else {
      const accuracy = correctAnswers / questionsAnswered;
      if (accuracy >= 0.85) this._currentDifficulty = 'hard';
      else if (accuracy >= 0.7) this._currentDifficulty = 'medium';
      else this._currentDifficulty = 'easy';
    }
  }

  getFeedback(isCorrect) {
    if (isCorrect) {
      const messages = [
        'Правильно! 🎯',
        'Верно! ✅',
        'Отлично! ⭐',
        'Супер! 🔥',
        'Молодец! 👏'
      ];
      return messages[Math.floor(Math.random() * messages.length)];
    }

    const meta = this.state.currentQuestion.metadata;
    
    // Use explanation from generator
    if (meta.explanation) {
      return `
        <div>Неправильно. Правильный ответ: <strong>${meta.correctVerb}</strong></div>
        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.75rem;">
          💡 ${meta.explanation}
        </div>
      `;
    }

    // Fallback
    const tip = meta.isPlural
      ? 'С I/you/we/they используется <strong>have</strong> got'
      : 'С he/she/it используется <strong>has</strong> got';

    return `
      <div>Неправильно. Попробуй ещё раз!</div>
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.75rem;">
        💡 ${tip}
      </div>
    `;
  }
}

if (typeof window !== 'undefined') {
  window.HaveGotTrainer = HaveGotTrainer;
}
