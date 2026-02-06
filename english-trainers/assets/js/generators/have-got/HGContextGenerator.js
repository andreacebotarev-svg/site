/**
 * HAVE GOT: CONTEXT GENERATOR
 * Диалоги с владением (possessions)
 */

class HGContextGenerator {
  constructor(config = {}) {
    this.subjects = config.subjects || [];
    this.possessions = config.possessions || [];
  }

  generate() {
    const subjectObj = this._pick(this.subjects);
    const possession = this._pick(this.possessions);
    const verb = subjectObj.verb;
    const VerbCapital = this._capitalize(verb);

    const context = `
      <div class="dialogue">
        <p><strong>A:</strong> ${VerbCapital} ${subjectObj.pronoun} got ${possession}?</p>
        <p><strong>B:</strong> Yes, ${subjectObj.pronoun} ${verb} got ${possession}!</p>
      </div>
    `;

    const correct = VerbCapital;
    const options = this._shuffle(['Have', 'Has']);

    return {
      question: `
        <div style="margin-bottom: 1rem; font-weight: 600;">Заполни диалог (выбери Have/Has):</div>
        ${context.replace(VerbCapital, '____')}
      `,
      options,
      correctIndex: options.indexOf(correct),
      metadata: {
        type: 'hg-context',
        subject: subjectObj.pronoun,
        possession,
        correctVerb: verb,
        isPlural: subjectObj.isPlural,
        explanation: subjectObj.isPlural
          ? `'${subjectObj.pronoun}' uses <strong>Have</strong> in questions`
          : `'${subjectObj.pronoun}' uses <strong>Has</strong> in questions`,
        generatedFrom: 'HGContextGenerator'
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
  window.HGContextGenerator = HGContextGenerator;
}
