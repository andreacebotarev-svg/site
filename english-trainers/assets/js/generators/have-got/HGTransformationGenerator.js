/**
 * HAVE GOT: TRANSFORMATION GENERATOR
 * Преобразование в negative/question формы
 */

class HGTransformationGenerator {
  constructor(config = {}) {
    this.subjects = config.subjects || [];
    this.possessions = config.possessions || [];
  }

  generate() {
    const mode = Math.random() < 0.5 ? 'negative' : 'question';
    return mode === 'negative' ? this._negative() : this._question();
  }

  _negative() {
    const subjectObj = this._pick(this.subjects);
    const possession = this._pick(this.possessions);
    const verb = subjectObj.verb;

    const base = `${this._capitalize(subjectObj.pronoun)} ${verb} got ${possession}.`;
    const correct = `${this._capitalize(subjectObj.pronoun)} ${verb}n't got ${possession}.`;

    const wrongVerb = verb === 'have' ? 'has' : 'have';
    const options = this._shuffle([
      correct,
      `${this._capitalize(subjectObj.pronoun)} not got ${possession}.`,
      `${this._capitalize(subjectObj.pronoun)} ${verb} not ${possession}.`,
      `${this._capitalize(subjectObj.pronoun)} ${wrongVerb}n't got ${possession}.`
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
        type: 'hg-transform-negative',
        subject: subjectObj.pronoun,
        possession,
        correctVerb: verb,
        hint: `Use ${verb}n't got or ${verb} not got`,
        generatedFrom: 'HGTransformationGenerator'
      }
    };
  }

  _question() {
    const subjectObj = this._pick(this.subjects);
    const possession = this._pick(this.possessions);
    const verb = subjectObj.verb;

    const base = `${this._capitalize(subjectObj.pronoun)} ${verb} got ${possession}.`;
    const correct = `${this._capitalize(verb)} ${subjectObj.pronoun} got ${possession}?`;

    const wrongVerb = verb === 'have' ? 'has' : 'have';
    const options = this._shuffle([
      correct,
      `${this._capitalize(subjectObj.pronoun)} ${verb} got ${possession}?`,
      `${this._capitalize(wrongVerb)} ${subjectObj.pronoun} got ${possession}?`,
      `Got ${subjectObj.pronoun} ${possession}?`
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
        type: 'hg-transform-question',
        subject: subjectObj.pronoun,
        possession,
        correctVerb: verb,
        hint: `${this._capitalize(verb)} + subject + got + object?`,
        generatedFrom: 'HGTransformationGenerator'
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
  window.HGTransformationGenerator = HGTransformationGenerator;
}
