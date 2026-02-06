/**
 * HAVE GOT: RECOGNITION GENERATOR
 * Выбор правильной формы have/has got
 */

class HGRecognitionGenerator {
  constructor(config = {}) {
    this.subjects = config.subjects || [];
    this.possessions = config.possessions || [];
  }

  generate() {
    const subjectObj = this._pick(this.subjects);
    const possession = this._pick(this.possessions);
    const verb = subjectObj.verb; // have or has

    // Правильное предложение
    const correct = `${this._capitalize(subjectObj.pronoun)} ${verb} got ${possession}`;

    // Неправильные варианты
    const wrongVerb = verb === 'have' ? 'has' : 'have';
    const wrong = [
      `${this._capitalize(subjectObj.pronoun)} ${wrongVerb} got ${possession}`,
      `${this._capitalize(subjectObj.pronoun)} got ${possession}`,
      `${this._capitalize(subjectObj.pronoun)} ${verb} ${possession}`
    ];

    const options = this._shuffle([correct, ...wrong]).slice(0, 4);

    return {
      question: 'Выбери <strong>правильное</strong> предложение:',
      options,
      correctIndex: options.indexOf(correct),
      metadata: {
        type: 'hg-recognition',
        subject: subjectObj.pronoun,
        possession,
        correctVerb: verb,
        isPlural: subjectObj.isPlural,
        generatedFrom: 'HGRecognitionGenerator'
      }
    };
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  _shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

if (typeof window !== 'undefined') {
  window.HGRecognitionGenerator = HGRecognitionGenerator;
}
