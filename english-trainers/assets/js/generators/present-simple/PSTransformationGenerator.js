/**
 * PRESENT SIMPLE: TRANSFORMATION GENERATOR
 * Преобразование в negative/question формы
 */

class PSTransformationGenerator {
  constructor(config = {}) {
    this.verbs = config.verbs || [];
    this.subjects3sg = config.subjects3sg || ['he', 'she', 'it', 'the cat', 'John', 'my friend'];
    this.allSubjects = ['I', 'you', 'he', 'she', 'it', 'we', 'they'];
  }

  generate() {
    const mode = Math.random() < 0.5 ? 'negative' : 'question';
    return mode === 'negative' ? this._negative() : this._question();
  }

  _negative() {
    const verb = this._pick(this.verbs);
    const subject = this._pick(this.allSubjects);
    const is3sg = this.subjects3sg.includes(subject);

    const base = `${this._capitalize(subject)} ${is3sg ? verb.thirdPerson : verb.base} every day.`;
    const correct = `${this._capitalize(subject)} ${is3sg ? "doesn't" : "don't"} ${verb.base} every day.`;

    const options = this._shuffle([
      correct,
      `${this._capitalize(subject)} not ${verb.base} every day.`,
      `${this._capitalize(subject)} ${verb.base} not every day.`,
      `${this._capitalize(subject)} ${is3sg ? "don't" : "doesn't"} ${verb.base} every day.`
    ]);

    return {
      question: `
        <div style="margin-bottom: 0.5rem;">Сделай предложение <strong>отрицательным</strong>:</div>
        <div class="transformation-sentence" style="font-size: 1.1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; margin: 1rem 0;">
          "${base}"
        </div>
      `,
      options,
      correctIndex: options.indexOf(correct),
      metadata: {
        type: 'ps-transform-negative',
        subject,
        verb: verb.base,
        is3sg,
        hint: is3sg ? "Use doesn't + base form" : "Use don't + base form",
        generatedFrom: 'PSTransformationGenerator'
      }
    };
  }

  _question() {
    const verb = this._pick(this.verbs);
    const subject = this._pick(['you', 'he', 'she', 'it', 'we', 'they']);
    const is3sg = this.subjects3sg.includes(subject);

    const base = `${this._capitalize(subject)} ${is3sg ? verb.thirdPerson : verb.base} every day.`;
    const correct = `${is3sg ? 'Does' : 'Do'} ${subject} ${verb.base} every day?`;

    const options = this._shuffle([
      correct,
      `${this._capitalize(subject)} ${is3sg ? 'does' : 'do'} ${verb.base} every day?`,
      `${is3sg ? 'Does' : 'Do'} ${verb.base} ${subject} every day?`,
      `${this._capitalize(subject)} ${verb.base} every day?`
    ]);

    return {
      question: `
        <div style="margin-bottom: 0.5rem;">Сделай из предложения <strong>вопрос</strong>:</div>
        <div class="transformation-sentence" style="font-size: 1.1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px; margin: 1rem 0;">
          "${base}"
        </div>
      `,
      options,
      correctIndex: options.indexOf(correct),
      metadata: {
        type: 'ps-transform-question',
        subject,
        verb: verb.base,
        is3sg,
        hint: is3sg ? "Does + subject + base verb?" : "Do + subject + base verb?",
        generatedFrom: 'PSTransformationGenerator'
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
  window.PSTransformationGenerator = PSTransformationGenerator;
}
