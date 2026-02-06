/**
 * PRESENT SIMPLE: CONTEXT GENERATOR
 * Диалоги с do/does и формами глаголов
 */

class PSContextGenerator {
  constructor(config = {}) {
    this.verbs = config.verbs || [];
    this.subjects3sg = config.subjects3sg || ['he', 'she', 'it', 'the cat', 'John', 'my friend'];
  }

  generate() {
    const verb = this._pick(this.verbs);
    const subject = this._pick(['you', 'he', 'she', 'we', 'they']);
    const is3sg = this.subjects3sg.includes(subject);

    const doForm = is3sg ? 'does' : 'do';
    const DoForm = is3sg ? 'Does' : 'Do';
    const verbForm = is3sg ? verb.thirdPerson : verb.base;

    const context = `
      <div class="dialogue">
        <p><strong>A:</strong> ${DoForm} ${subject} ${verb.base} on weekends?</p>
        <p><strong>B:</strong> Yes, ${subject} ${verbForm} every Saturday.</p>
      </div>
    `;

    const correct = DoForm;
    const options = this._shuffle(['Do', 'Does']);

    return {
      question: `
        <div style="margin-bottom: 1rem; font-weight: 600;">Заполни диалог (выбери Do/Does):</div>
        ${context.replace(DoForm, '____')}
      `,
      options,
      correctIndex: options.indexOf(correct),
      metadata: {
        type: 'ps-context',
        subject,
        verb: verb.base,
        is3sg,
        correctAux: DoForm,
        explanation: is3sg
          ? `'${subject}' uses <strong>Does</strong> in questions`
          : `'${subject}' uses <strong>Do</strong> in questions`,
        generatedFrom: 'PSContextGenerator'
      }
    };
  }

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
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
  window.PSContextGenerator = PSContextGenerator;
}
