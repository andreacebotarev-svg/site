/**
 * Interactive Textbook Module
 * Handles rendering of grammar content from JSON and managing the modal UI.
 */

export class TextbookRenderer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.basePath = options.basePath || 'assets/data/textbook/';
  }

  async loadTopic(topicId) {
    try {
      // Ensure basePath ends with slash
      const path = this.basePath.endsWith('/') ? this.basePath : this.basePath + '/';
      const response = await fetch(`${path}${topicId}.json`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      this.render(data);
      return data; 
    } catch (error) {
      console.error("Textbook load error:", error);
      
      // Fallback for local file usage (CORS) or missing file
      const fallbacks = {
        'present-simple': {
            "id": "present-simple",
            "meta": { "title": "Present Simple", "badge": "Base", "difficulty": 1 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "🔄", "title": "Регулярность", "desc": "То, что происходит обычно/часто.", "example": "I work every day." },
                    { "icon": "📚", "title": "Факты", "desc": "Общеизвестные истины.", "example": "Water boils at 100°C." },
                    { "icon": "📅", "title": "Расписания", "desc": "Транспорт, уроки, кино.", "example": "The train leaves at 5 PM." },
                    { "icon": "📖", "title": "Истории/Анекдоты", "desc": "Для живости рассказа о прошлом.", "example": "So he comes to me and says...", "isPro": true },
                    { "icon": "🎙️", "title": "Спортивные комментарии", "desc": "Быстрая смена действий в эфире.", "example": "Messi passes to Xavi...", "isPro": true },
                    { "icon": "📰", "title": "Заголовки газет", "desc": "Для краткости и актуальности.", "example": "Queen visits hospital.", "isSuper": true }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "I / You / We / They" }, { "role": "verb", "text": "work" }, { "break": true }, { "role": "subject", "text": "He / She / It" }, { "role": "verb", "text": "work" }, { "role": "s", "text": "s" }],
                    "negative": [{ "role": "subject", "text": "I / You / We / They" }, { "role": "aux", "text": "don't" }, { "role": "verb", "text": "work" }, { "break": true }, { "role": "subject", "text": "He / She / It" }, { "role": "aux", "text": "doesn't" }, { "role": "verb", "text": "work" }],
                    "question": [{ "role": "aux", "text": "Do" }, { "role": "subject", "text": "I / you / we / they" }, { "role": "verb", "text": "work?" }, { "break": true }, { "role": "aux", "text": "Does" }, { "role": "subject", "text": "he / she / it" }, { "role": "verb", "text": "work?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["always", "often", "usually", "sometimes", "never", "every day"] },
                { "type": "traps", "title": "Ловушки", "items": [
                    { "wrong": "He work here.", "correct": "He works here.", "note": "Не забывайте -s для he/she/it!" },
                    { "wrong": "Do he like it?", "correct": "Does he like it?", "note": "Для he/she/it используем Does." }
                ]}
            ],
            "practice_config": { "custom": true, "quota": { "present-simple": 10 } }
        },
        'present-continuous': {
            "id": "present-continuous",
            "meta": { "title": "Present Continuous", "badge": "Step 2", "difficulty": 2 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "🎯", "title": "Прямо сейчас", "desc": "Действие в момент речи.", "example": "I am speaking now." },
                    { "icon": "⏳", "title": "Временно", "desc": "Вокруг данного периода времени.", "example": "I'm reading a great book." },
                    { "icon": "📅", "title": "Личные Планы", "desc": "Догоговоренности на будущее.", "example": "I'm meeting Tom tonight.", "isPro": true },
                    { "icon": "😡", "title": "Раздражение", "desc": "C 'always' для негатива.", "example": "He is always shouting!", "isPro": true },
                    { "icon": "🎭", "title": "State Verbs (Эмоции)", "desc": "Чтобы подчеркнуть временность/силу чувства.", "example": "I'm loving it!", "isSuper": true },
                    { "icon": "😼", "title": "Acting vs Being", "desc": "Человек ведет себя так только сейчас.", "example": "You're being rude (usually you are polite).", "isSuper": true }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "I" }, { "role": "aux", "text": "am" }, { "role": "verb", "text": "work" }, { "role": "ing", "text": "ing" }, { "break": true }, { "role": "subject", "text": "He/She/It" }, { "role": "aux", "text": "is" }, { "role": "verb", "text": "work" }, { "role": "ing", "text": "ing" }],
                    "negative": [{ "role": "subject", "text": "We/You/They" }, { "role": "aux", "text": "aren't" }, { "role": "verb", "text": "work" }, { "role": "ing", "text": "ing" }],
                    "question": [{ "role": "aux", "text": "Am/Is/Are" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "work" }, { "role": "ing", "text": "ing?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["now", "at the moment", "currently", "Today"] }
            ],
            "practice_config": { "custom": true, "quota": { "present-continuous": 10 } }
        },
        'past-simple': {
            "id": "past-simple",
            "meta": { "title": "Past Simple", "badge": "History", "difficulty": 2 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "⚓", "title": "Завершено", "desc": "Законченное действие в прошлом.", "example": "I visited London in 2020." },
                    { "icon": "📜", "title": "Список событий", "desc": "Последовательность действий.", "example": "I woke up, had coffee and left." },
                    { "icon": "🎩", "title": "Вежливость", "desc": "Чтобы звучать менее прямолинейно.", "example": "I wondered if you could help.", "isPro": true },
                    { "icon": "📼", "title": "Used to / Would", "desc": "Привычки в прошлом. Used to = состояние/действие, Would = только действие.", "example": "I used to be shy. I would visit her often.", "isSuper": true }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "S" }, { "role": "verb", "text": "V2 / ed" }],
                    "negative": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "didn't" }, { "role": "verb", "text": "V1" }],
                    "question": [{ "role": "aux", "text": "Did" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "V1?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["yesterday", "last week", "ago", "in 1999"] }
            ],
            "practice_config": { "custom": true, "quota": { "past-simple": 10 } }
        },
        'present-perfect': {
            "id": "present-perfect",
            "meta": { "title": "Present Perfect", "badge": "Result", "difficulty": 3 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "🏆", "title": "Результат сегодня", "desc": "Важен сам факт события, а не время.", "example": "I have lost my keys." },
                    { "icon": "📈", "title": "Опыт", "desc": "То, что человек делал в жизни вообще.", "example": "I have been to Paris twice." },
                    { "icon": "📰", "title": "Новости", "desc": "Горячие новости без уточнения времени.", "example": "Prices have increased again!", "isPro": true },
                    { "icon": "🔢", "title": "В первый раз...", "desc": "This is the first time I have done this.", "example": "It's the best pizza I've eaten.", "isPro": true },
                    { "icon": "🔃", "title": "Инверсия (Inversion)", "desc": "Обратный порядок слов для драматичности.", "example": "Never have I seen such beauty.", "isSuper": true }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "I/You/We/They" }, { "role": "aux", "text": "have" }, { "role": "verb", "text": "V3/ed" }, { "break": true }, { "role": "subject", "text": "He/She/It" }, { "role": "aux", "text": "has" }, { "role": "verb", "text": "V3/ed" }],
                    "negative": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "haven't/hasn't" }, { "role": "verb", "text": "V3/ed" }],
                    "question": [{ "role": "aux", "text": "Have/Has" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "V3/ed?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["already", "yet", "just", "ever", "never", "recently"] }
            ],
            "practice_config": { "custom": true, "quota": { "present-perfect": 10 } }
        },
        'past-continuous': {
            "id": "past-continuous",
            "meta": { "title": "Past Continuous", "badge": "Process", "difficulty": 3 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "🎥", "title": "Процесс в прошлом", "desc": "Длилось в конкретный момент.", "example": "I was sleeping at 10 PM." },
                    { "icon": "⚔️", "title": "Прерывание", "desc": "Длинное действие прервано коротким.", "example": "I was cooking when he called." },
                    { "icon": "😡", "title": "Раздражение в прошлом", "desc": "Постоянно что-то делал (бесило).", "example": "He was always complaining.", "isPro": true },
                    { "icon": "💔", "title": "Failed Plans", "desc": "Собирался сделать, но не вышло.", "example": "I was going to call you (but didn't).", "isSuper": true }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "I/He/She/It" }, { "role": "aux", "text": "was" }, { "role": "verb", "text": "V-ing" }, { "break": true }, { "role": "subject", "text": "You/We/They" }, { "role": "aux", "text": "were" }, { "role": "verb", "text": "V-ing" }],
                    "negative": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "wasn't/weren't" }, { "role": "verb", "text": "V-ing" }],
                    "question": [{ "role": "aux", "text": "Was/Were" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "V-ing?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["at 5 o'clock", "while", "when", "all day yesterday"] }
            ],
            "practice_config": { "custom": true, "quota": { "past-continuous": 10 } }
        },
        'future-simple': {
            "id": "future-simple",
            "meta": { "title": "Future Simple", "badge": "Dream", "difficulty": 2 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "🔮", "title": "Прогноз", "desc": "Наше мнение о будущем.", "example": "It will rain tomorrow." },
                    { "icon": "⚡", "title": "Спонтанное решение", "desc": "Решили прямо сейчас.", "example": "I'll help you with that!" },
                    { "icon": "🤝", "title": "Обещание/Угроза", "desc": "Твердое намерение.", "example": "I will always love you.", "isPro": true },
                    { "icon": "🐐", "title": "Упрямство", "desc": "О предметах (не работает).", "example": "My car won't start!", "isPro": true },
                    { "icon": "🕺", "title": "Shall (Предложения)", "desc": "Только с I и We для вопросов.", "example": "Shall we dance?", "isSuper": true }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "will" }, { "role": "verb", "text": "V1" }],
                    "negative": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "won't" }, { "role": "verb", "text": "V1" }],
                    "question": [{ "role": "aux", "text": "Will" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "V1?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["tomorrow", "next year", "in 2 days", "maybe", "I think"] }
            ],
            "practice_config": { "custom": true, "quota": { "future-simple": 10 } }
        },
        'present-perfect-continuous': {
            "id": "present-perfect-continuous",
            "meta": { "title": "Present Perfect Continuous", "badge": "Duration", "difficulty": 4 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "⏳", "title": "Длительность", "desc": "Действие началось в прошлом и длится до сих пор.", "example": "I have been working for 2 hours." },
                    { "icon": "😤", "title": "Очевидный результат", "desc": "Действие только что закончилось и виден результат.", "example": "I'm tired because I've been running." },
                    { "icon": "😡", "title": "Упрек/Злость", "desc": "Кто-то трогал мои вещи.", "example": "Who has been eating my cake?!", "isPro": true }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "have/has been" }, { "role": "verb", "text": "V-ing" }],
                    "negative": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "haven't/hasn't been" }, { "role": "verb", "text": "V-ing" }],
                    "question": [{ "role": "aux", "text": "Have/Has" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "been V-ing?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["for", "since", "all day", "how long?"] }
            ],
            "practice_config": { "custom": true, "quota": { "present-perfect-continuous": 10 } }
        },
        'past-perfect': {
            "id": "past-perfect",
            "meta": { "title": "Past Perfect", "badge": "Before", "difficulty": 4 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "⏮️", "title": "Предпрошедшее", "desc": "Действие совершилось ДО другого действия в прошлом.", "example": "The train had left when I arrived." },
                    { "icon": "💡", "title": "Нереализованное", "desc": "Хотел сделать, но не смог.", "example": "I had hoped to see him (but didn't).", "isPro": true }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "had" }, { "role": "verb", "text": "V3/ed" }],
                    "negative": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "hadn't" }, { "role": "verb", "text": "V3/ed" }],
                    "question": [{ "role": "aux", "text": "Had" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "V3/ed?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["by the time", "already", "before", "after"] }
            ],
            "practice_config": { "custom": true, "quota": { "past-perfect": 10 } }
        },
        'past-perfect-continuous': {
            "id": "past-perfect-continuous",
            "meta": { "title": "Past Perfect Continuous", "badge": "Limit", "difficulty": 5 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "🎞️", "title": "Процесс ДО момента", "desc": "Длилось до определенного времени в прошлом.", "example": "We had been waiting for an hour before they came." }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "had been" }, { "role": "verb", "text": "V-ing" }],
                    "negative": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "hadn't been" }, { "role": "verb", "text": "V-ing" }],
                    "question": [{ "role": "aux", "text": "Had" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "been V-ing?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["for", "since", "before"] }
            ],
            "practice_config": { "custom": true, "quota": { "past-perfect-continuous": 10 } }
        },
        'future-continuous': {
            "id": "future-continuous",
            "meta": { "title": "Future Continuous", "badge": "Tomorrow Plan", "difficulty": 3 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "🕓", "title": "Процесс в будущем", "desc": "Будет длиться в конкретное время.", "example": "At 5 PM tomorrow I'll be flying to Bali." },
                    { "icon": "🤝", "title": "Вежливый вопрос", "desc": "О планах (не подбросите?).", "example": "Will you be passing by the post office?", "isPro": true }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "will be" }, { "role": "verb", "text": "V-ing" }],
                    "negative": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "won't be" }, { "role": "verb", "text": "V-ing" }],
                    "question": [{ "role": "aux", "text": "Will" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "be V-ing?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["at this time tomorrow", "this time next week", "from 5 to 7"] }
            ],
            "practice_config": { "custom": true, "quota": { "future-continuous": 10 } }
        },
        'future-perfect': {
            "id": "future-perfect",
            "meta": { "title": "Future Perfect", "badge": "Deadline", "difficulty": 4 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "🏁", "title": "Завершение к моменту", "desc": "Будет закончено к определенному времени.", "example": "I will have finished the project by Monday." },
                    { "icon": "🤔", "title": "Предположение", "desc": "О прошлом (должно быть, он уже ушел).", "example": "He will have left by now.", "isPro": true }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "will have" }, { "role": "verb", "text": "V3/ed" }],
                    "negative": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "won't have" }, { "role": "verb", "text": "V3/ed" }],
                    "question": [{ "role": "aux", "text": "Will" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "have V3/ed?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["by next week", "by the time", "by 10 o'clock"] }
            ],
            "practice_config": { "custom": true, "quota": { "future-perfect": 10 } }
        },
        'future-perfect-continuous': {
            "id": "future-perfect-continuous",
            "meta": { "title": "Future Perfect Continuous", "badge": "Milestone", "difficulty": 5 },
            "sections": [
                { "type": "usage", "title": "Когда используем?", "items": [
                    { "icon": "🕰️", "title": "Длительность к моменту", "desc": "Будем делать уже какое-то время к моменту в будущем.", "example": "By June, I will have been living here for a year." }
                ]},
                { "type": "formula", "title": "Конструктор Форм", "forms": {
                    "positive": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "will have been" }, { "role": "verb", "text": "V-ing" }],
                    "negative": [{ "role": "subject", "text": "S" }, { "role": "aux", "text": "won't have been" }, { "role": "verb", "text": "V-ing" }],
                    "question": [{ "role": "aux", "text": "Will" }, { "role": "subject", "text": "S" }, { "role": "verb", "text": "have been V-ing?" }]
                }},
                { "type": "markers", "title": "Слова-маркеры", "words": ["for", "by next month"] }
            ],
            "practice_config": { "custom": true, "quota": { "future-perfect-continuous": 10 } }
        }
      };

      if (fallbacks[topicId]) {
          console.warn(`Using fallback data for ${topicId}`);
          this.render(fallbacks[topicId]);
          return fallbacks[topicId];
      }

      alert("Не удалось загрузить учебник (возможно, вы открыли файл локально без сервера). Ошибка: " + error.message);
      this.container.innerHTML = `<div class="error">Failed to load content: ${error.message}</div>`;
      return null;
    }
  }

  render(data) {
    let html = '';

    // Render Sections
    data.sections.forEach(section => {
      switch (section.type) {
        case 'usage':
          html += this.renderUsage(section);
          break;
        case 'formula':
          html += this.renderFormula(section);
          break;
        case 'markers':
          html += this.renderMarkers(section);
          break;
        case 'traps':
          html += this.renderTraps(section);
          break;
        default:
          break;
      }
    });

    this.container.innerHTML = html;
  }

  renderUsage(section) {
    const items = section.items.map(item => {
      let extraClass = '';
      if (item.isPro) extraClass = 'pro';
      if (item.isSuper) extraClass = 'super';

      return `
      <div class="usage-card ${extraClass}">
        <h4>${item.icon === 'facts' ? '📚' : item.icon} ${item.title}</h4>
        <p>${item.desc}</p>
        <div class="example-item" style="margin-top:0.5rem; border:none; padding:0">
            <span class="example-text" style="font-size:0.95rem; opacity:0.9">"${item.example}"</span>
        </div>
      </div>
    `}).join('');

    return `
      <section class="grammar-section">
        <h3>🚀 ${section.title}</h3>
        <div class="usage-grid">${items}</div>
      </section>
    `;
  }

  renderFormula(section) {
    const renderRow = (row) => {
      return `<div class="formula-box">` + 
        row.map(part => {
          if (part.break) return '<div style="width:100%; height:1px; background:rgba(255,255,255,0.1); margin:0.5rem 0"></div>';
          return `<span class="formula-part ${part.role}">${part.text}</span>`;
        }).join('') +
      `</div>`;
    };

    return `
      <section class="grammar-section">
        <h3>📐 ${section.title}</h3>
        <div class="formula-container">
            ${section.forms.positive ? `<h4>Утверждение (+)</h4>${renderRow(section.forms.positive)}` : ''}
            ${section.forms.negative ? `<h4>Отрицание (-)</h4>${renderRow(section.forms.negative)}` : ''}
            ${section.forms.question ? `<h4>Вопрос (?)</h4>${renderRow(section.forms.question)}` : ''}
        </div>
      </section>
    `;
  }

  renderMarkers(section) {
    const badges = section.words.map(w => 
      `<span class="formula-part" style="background:rgba(255,255,255,0.1); font-size:0.9rem; margin:0.2rem">${w}</span>`
    ).join('');
    
    return `
      <section class="grammar-section">
        <h3>🔑 ${section.title}</h3>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem">${badges}</div>
      </section>
    `;
  }

  renderTraps(section) {
    const items = section.items.map(item => `
      <div class="trap-item">
        <div style="flex:1">
          <div class="trap-wrong">❌ ${item.wrong}</div>
          <div class="trap-correct">✅ ${item.correct}</div>
        </div>
        <div style="font-size:0.85rem; opacity:0.7; max-width:150px; text-align:right">
          ${item.note}
        </div>
      </div>
    `).join('');

    return `
      <section class="grammar-section" style="border-color: rgba(239, 68, 68, 0.3)">
        <h3 style="color:#f87171">⚠️ ${section.title}</h3>
        <div class="traps-grid">${items}</div>
      </section>
    `;
  }
}

export class TextbookModal {
  constructor(options = {}) {
    this.overlay = null;
    this.renderer = null;
    this.currentPracticeConfig = null;
    this.onStartPractice = null; // Callback
    this.options = options;
  }

  init(containerId = 'textbook-overlay') {
    // If element exists, we might need to update its content to match new structure
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement('div');
      el.id = containerId;
      el.className = 'textbook-overlay';
      document.body.appendChild(el);
    }

    // Always refresh the inner structure to ensure sidebar/nav are present
    el.innerHTML = `
        <div class="textbook-container">
          <div class="textbook-sidebar" id="tb-sidebar">
            <div class="sidebar-header">
              <h3>English<br>Grammar</h3>
            </div>
            <nav class="sidebar-nav" id="tb-nav">
              <!-- Nav items... -->
              <div class="nav-group">
                <span class="group-label">Present</span>
                <button class="nav-item" data-topic="present-simple">Simple</button>
                <button class="nav-item" data-topic="present-continuous">Continuous</button>
                <button class="nav-item" data-topic="present-perfect">Perfect</button>
                <button class="nav-item" data-topic="present-perfect-continuous">Perf. Cont.</button>
              </div>
              <div class="nav-group">
                <span class="group-label">Past</span>
                <button class="nav-item" data-topic="past-simple">Simple</button>
                <button class="nav-item" data-topic="past-continuous">Continuous</button>
                <button class="nav-item" data-topic="past-perfect">Perfect</button>
                <button class="nav-item" data-topic="past-perfect-continuous">Perf. Cont.</button>
              </div>
              <div class="nav-group">
                <span class="group-label">Future</span>
                <button class="nav-item" data-topic="future-simple">Simple</button>
                <button class="nav-item" data-topic="future-continuous">Continuous</button>
                <button class="nav-item" data-topic="future-perfect">Perfect</button>
                <button class="nav-item" data-topic="future-perfect-continuous">Perf. Cont.</button>
              </div>
            </nav>
          </div>
          <div class="textbook-main">
            <div class="textbook-header">
              <div style="display:flex; align-items:center">
                  <button class="textbook-menu-toggle" id="tb-menu-toggle">☰</button>
                  <div class="textbook-title">
                    <h2 id="tb-title">Textbook</h2>
                  </div>
              </div>
              <div class="mode-toggle-container">
                <span class="mode-label active-base" id="mode-label-base">Base</span>
                <input type="range" min="0" max="2" value="0" step="1" class="mode-slider" id="tb-mode-slider">
                <span class="mode-label" id="mode-label-right">Pro</span>
              </div>
              <button class="textbook-close-btn" id="tb-close">&times;</button>
            </div>
            <div class="textbook-content" id="tb-content">
              <!-- Content -->
            </div>
            <div class="textbook-actions">
              <button class="btn btn-primary" id="tb-practice-btn">🚀 Тренировать эту тему</button>
            </div>
          </div>
        </div>
      `;

    this.overlay = el;
    this.renderer = new TextbookRenderer('tb-content', {
        basePath: this.options.basePath
    });
    
    // Bind events
    document.getElementById('tb-close').addEventListener('click', () => this.close());
    
    // Sidebar Toggle
    const sidebar = document.getElementById('tb-sidebar');
    const menuToggle = document.getElementById('tb-menu-toggle');
    
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('mobile-open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && 
            sidebar.classList.contains('mobile-open') && 
            !sidebar.contains(e.target) && 
            e.target !== menuToggle) {
            sidebar.classList.remove('mobile-open');
        }
    });

    // Mode Slider
    const modeSlider = document.getElementById('tb-mode-slider');
    modeSlider.addEventListener('input', (e) => {
        this.setMode(parseInt(e.target.value));
    });

    document.getElementById('tb-practice-btn').addEventListener('click', () => {
      if (this.currentPracticeConfig && this.onStartPractice) {
        this.onStartPractice(this.currentPracticeConfig);
        this.close();
      }
    });

    // Navigation events - rebind because we refreshed innerHTML
    const navItems = document.getElementById('tb-nav').querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        this.open(item.dataset.topic);
        // Close sidebar on mobile selection
        if (window.innerWidth <= 992) {
            sidebar.classList.remove('mobile-open');
        }
      });
    });

    // Close on click outside
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  setMode(level) {
      const content = document.querySelector('.textbook-container');
      const slider = document.getElementById('tb-mode-slider');
      const labelBase = document.getElementById('mode-label-base');
      const labelRight = document.getElementById('mode-label-right');

      // Reset classes
      content.classList.remove('pro-mode-active', 'super-mode-active');
      slider.classList.remove('state-pro', 'state-super');
      labelBase.className = 'mode-label';
      labelRight.className = 'mode-label';

      if (level === 0) {
          labelBase.classList.add('active-base');
          labelRight.textContent = 'Pro';
      } else if (level === 1) {
          content.classList.add('pro-mode-active');
          slider.classList.add('state-pro');
          labelRight.textContent = 'Pro';
          labelRight.classList.add('active-pro');
      } else if (level === 2) {
          content.classList.add('pro-mode-active', 'super-mode-active');
          slider.classList.add('state-super');
          labelRight.textContent = 'Super';
          labelRight.classList.add('active-super');
      }
  }

  async open(topicId) {
    this.overlay.classList.add('active');
    
    // Update active state in nav
    const navItems = document.getElementById('tb-nav').querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.topic === topicId);
    });

    const data = await this.renderer.loadTopic(topicId);
    
    if (data) {
      document.getElementById('tb-title').textContent = data.meta.title;
      this.currentPracticeConfig = data.practice_config;
      
      // Update theme color based on group
      const group = topicId.split('-')[0]; // present, past, future
      this.overlay.setAttribute('data-group', group);
    }
  }

  close() {
    this.overlay.classList.remove('active');
  }
}
