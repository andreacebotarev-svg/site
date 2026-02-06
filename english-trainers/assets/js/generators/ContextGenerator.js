/**
 * CONTEXT/DIALOGUE QUESTION GENERATOR
 * Generates dialogue completion tasks with contextual clues.
 */

class ContextGenerator {
  constructor(config = {}) {
    this.verbMap = config.verbMap || {
      'I': 'am',
      'you': 'are',
      'he': 'is',
      'she': 'is',
      'it': 'is',
      'we': 'are',
      'they': 'are'
    };

    // Dialogue patterns
    this.patterns = [
      {
        template: [
          'Where ____ your {{object}}?',
          'They ____ at the {{location}}.'
        ],
        pronouns: ['you', 'they'],
        objects: ['friends', 'parents', 'books', 'keys'],
        locations: ['park', 'office', 'table', 'car']
      },
      {
        template: [
          '____ you ready?',
          'Yes, I ____ ready!'
        ],
        pronouns: ['you', 'I'],
        objects: [],
        locations: []
      },
      {
        template: [
          '{{name}} ____ not here today.',
          'Where ____ {{pronoun}}?'
        ],
        pronouns: ['he', 'she'],
        names: ['John', 'Sarah', 'Tom', 'Lisa'],
        objects: [],
        locations: []
      },
      {
        template: [
          '____ we all ready?',
          'Yes, we ____!'
        ],
        pronouns: ['we', 'we'],
        objects: [],
        locations: []
      },
      {
        template: [
          'How ____ you feeling?',
          'I ____ feeling great!'
        ],
        pronouns: ['you', 'I'],
        objects: [],
        locations: []
      },
      {
        template: [
          'What ____ this?',
          'It ____ a book.'
        ],
        pronouns: ['it', 'it'],
        objects: [],
        locations: []
      }
    ];
  }

  generate() {
    const pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
    const [pronoun1, pronoun2] = pattern.pronouns;
    const verb1 = this.verbMap[pronoun1];
    const verb2 = this.verbMap[pronoun2];

    // Fill template placeholders
    let line1 = pattern.template[0];
    let line2 = pattern.template[1];

    if (pattern.objects && pattern.objects.length > 0) {
      const object = pattern.objects[Math.floor(Math.random() * pattern.objects.length)];
      line1 = line1.replace('{{object}}', object);
    }

    if (pattern.locations && pattern.locations.length > 0) {
      const location = pattern.locations[Math.floor(Math.random() * pattern.locations.length)];
      line2 = line2.replace('{{location}}', location);
    }

    if (pattern.names && pattern.names.length > 0) {
      const name = pattern.names[Math.floor(Math.random() * pattern.names.length)];
      line1 = line1.replace('{{name}}', name);
      line2 = line2.replace('{{pronoun}}', pronoun2);
    }

    const context = `
      <div class="dialogue">
        <p><strong>A:</strong> ${line1}</p>
        <p><strong>B:</strong> ${line2}</p>
      </div>
    `;

    // Generate answer options
    const correctAnswer = `${verb1} / ${verb2}`;
    const wrongOptions = [
      `${verb1 === 'am' ? 'is' : 'am'} / ${verb2}`,
      `${verb1} / ${verb2 === 'am' ? 'is' : 'am'}`,
      `${verb1 === 'are' ? 'is' : 'are'} / ${verb2 === 'are' ? 'is' : 'are'}`
    ];

    const options = this._shuffle([correctAnswer, ...wrongOptions.slice(0, 3)]);

    return {
      question: `<div style="margin-bottom: 1rem; font-weight: 600;">Заполни диалог:</div>${context}`,
      options,
      correctIndex: options.indexOf(correctAnswer),
      metadata: {
        type: 'context',
        pronouns: [pronoun1, pronoun2],
        correctVerbs: [verb1, verb2],
        explanation: `Первый пропуск: '${pronoun1}' → '${verb1}'. Второй пропуск: '${pronoun2}' → '${verb2}'.`,
        generatedFrom: 'ContextGenerator'
      }
    };
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
  window.ContextGenerator = ContextGenerator;
}
