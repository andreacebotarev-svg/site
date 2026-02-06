/**
 * PRESENT SIMPLE: RECOGNITION GENERATOR
 * Выбор правильной формы глагола (work/works)
 */

class PSRecognitionGenerator {
  constructor(config = {}) {
    this.verbs = config.verbs || [];
    this.subjects3sg = config.subjects3sg || ['he', 'she', 'it', 'the cat', 'John', 'my friend'];
    this.allSubjects = ['I', 'you', 'he', 'she', 'it', 'we', 'they', 'the cat', 'my friend'];
  }

  generate() {
    const verb = this._pick(this.verbs);
    const subject = this._pick(this.allSubjects);
    const is3sg = this.subjects3sg.includes(subject);

    // Правильное предложение
    const correctVerb = is3sg ? verb.thirdPerson : verb.base;
    const correct = `${this._capitalize(subject)} ${correctVerb} every day`;

    // Неправильные варианты
    const wrongVerb = is3sg ? verb.base : verb.thirdPerson;
    const wrong = [
      `${this._capitalize(subject)} ${wrongVerb} every day`,
      `${this._capitalize(subject)} do ${verb.base} every day`,
      `${this._capitalize(subject)} does ${verb.base} every day`
    ];

    const options = this._shuffle([correct, ...wrong]).slice(0, 4);

    return {
      question: 'Выбери <strong>правильное</strong> предложение:',
      options,
      correctIndex: options.indexOf(correct),
      metadata: {
        type: 'ps-recognition',
        subject,
        verb: verb.base,
        correctVerb,
        is3sg,
        generatedFrom: 'PSRecognitionGenerator'
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
  window.PSRecognitionGenerator = PSRecognitionGenerator;
}
