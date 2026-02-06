# English Lessons - Modular Assets

## Архитектура

Все уроки English Lesson теперь используют **модульную систему** с разделенными CSS и JavaScript файлами.

```
dist/
├── assets/
│   ├── css/
│   │   ├── lesson-core.css          # Ядро: переменные, reset, layout, loader
│   │   ├── lesson-components.css    # Компоненты: header, tabs, cards, buttons
│   │   └── lesson-responsive.css    # Адаптивность: mobile, tablet
│   └── js/
│       ├── lesson-storage.js        # LocalStorage для сохранённых слов
│       ├── lesson-tts.js            # Text-to-Speech (Google TTS)
│       ├── lesson-renderer.js       # Рендеринг UI компонентов
│       └── lesson-engine.js         # Главный контроллер
├── data/
│   └── {lessonId}.json          # JSON данные урока
└── {lessonId}.html              # HTML оболочка (только подключения)
```

## CSS Модули

### 1. `lesson-core.css`
- CSS переменные (`:root`)
- Reset стилей
- Базовый layout: `body`, `#app-root`, `.app-shell`
- Loader анимация (`.loader-container`, `.loader`, `.loader-orbit`, `.loader-core`)
- Sidebar (`.sidebar`, `.sidebar-header`, `.sidebar-body`, `.sidebar-word`)
- Keyframes: `spin`, `pulse`

### 2. `lesson-components.css`
Компоненты UI:
- **Header**: `.lesson-header`, `.lesson-title`, `.lesson-subtitle`, `.lesson-meta`, `.pill`
- **Tabs**: `.tabs`, `.tab`, `.tab.active`, `.tab-indicator`
- **Card**: `.card`, `.card-inner`, `.card-header`, `.card-title`
- **Buttons**: `.primary-btn`, `.icon-btn`, `.icon-btn.primary`, `.icon-btn.danger`
- **Reading**: `.reading-body`, `.reading-paragraph`, `.word-clickable`, `.word-clickable.saved`
- **Vocabulary**: `.vocab-layout`, `.vocab-item`, `.vocab-word`, `.vocab-definition`
- **Flashcards**: `.flashcard-shell`, `.flashcard`, `.flashcard.flipped`, `.flashcard-face`
- **Quiz**: `.quiz-body`, `.quiz-question`, `.quiz-options`, `.quiz-option`, `.quiz-feedback`
- **Notification**: `.notification`, `.notification.visible`
- **Utility**: `.hidden`, `.mt-sm`, `.mt-md`, `.text-soft`

### 3. `lesson-responsive.css`
Адаптивные брейкпоинты:
- `@media (max-width: 1024px)` - Tablet
- `@media (max-width: 768px)` - Mobile
- `@media (max-width: 480px)` - Small mobile

## JavaScript Модули

### 1. `lesson-storage.js` - Хранение
**Class**: `LessonStorage`

Методы:
- `loadWords()` - Загрузить сохранённые слова
- `saveWords(words)` - Сохранить слова
- `addWord(wordData)` - Добавить слово
- `removeWord(word)` - Удалить слово
- `isWordSaved(word)` - Проверить, сохранено ли слово
- `clearAll()` - Очистить все
- `getCount()` - Получить количество

### 2. `lesson-tts.js` - Озвучка
**Class**: `LessonTTS`

Методы:
- `speak(text, lang='en')` - Произнести текст (Google TTS)
- `speakSequence(texts, delay=800)` - Произнести последовательность
- `stop()` - Остановить воспроизведение
- `vibrate(duration=10)` - Вибрация

### 3. `lesson-renderer.js` - Рендеринг
**Class**: `LessonRenderer`

Методы:
- `escapeHTML(text)` - Экранирование HTML
- `renderReading(myWords)` - Рендер Reading секции
- `renderVocabulary(mode, myWords)` - Рендер Vocabulary
- `renderVocabList(vocabulary, phrases, myWords)` - Рендер списка слов
- `renderFlashcard(vocabulary, index)` - Рендер флешкарты
- `renderGrammar()` - Рендер Grammar
- `renderQuiz(quizState)` - Рендер Quiz
- `renderQuizResults(quizState)` - Рендер результатов
- `renderSidebar(myWords)` - Рендер sidebar

### 4. `lesson-engine.js` - Главный контроллер
**Class**: `LessonEngine`

Состояние:
- `lessonId` - ID урока
- `lessonData` - JSON данные
- `currentTab` - Текущая вкладка
- `vocabMode` - Режим vocabulary ('list' | 'flashcard')
- `flashcardIndex` - Индекс флешкарты
- `myWords` - Сохранённые слова
- `quizState` - Состояние квиза

Методы:
- `init()` - Инициализация
- `loadLessonData()` - Загрузка JSON
- `switchTab(tabName)` - Переключение табов
- `renderCurrentTab()` - Рендер текущего таба
- `toggleWord(wordData)` - Сохранить/удалить слово
- `speakAllReading()` - Произнести весь текст
- `speakWord(word)` - Произнести слово
- `flipFlashcard()` - Перевернуть карточку
- `nextFlashcard()` / `prevFlashcard()` - Навигация
- `selectQuizAnswer(index)` - Ответ на вопрос
- `nextQuizQuestion()` - Следующий вопрос
- `resetQuiz()` - Сброс квиза
- `showNotification(message)` - Показать уведомление

## Использование

### HTML шаблон урока:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>English Lesson</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- CSS -->
  <link rel="stylesheet" href="assets/css/lesson-core.css">
  <link rel="stylesheet" href="assets/css/lesson-components.css">
  <link rel="stylesheet" href="assets/css/lesson-responsive.css">
</head>
<body>
  <div class="loader-container" id="loader">...</div>
  <div id="app-root"><div id="app"></div></div>
  <div class="notification" id="notification">...</div>

  <!-- JavaScript -->
  <script src="assets/js/lesson-storage.js"></script>
  <script src="assets/js/lesson-tts.js"></script>
  <script src="assets/js/lesson-renderer.js"></script>
  <script src="assets/js/lesson-engine.js"></script>
  
  <!-- Инициализация -->
  <script>
    const lessonId = window.location.pathname.split('/').pop().replace('.html', '');
    window.lessonEngine = new LessonEngine(lessonId);
    window.lessonEngine.init();
  </script>
</body>
</html>
```

### JSON структура урока (`data/{lessonId}.json`):

```json
{
  "title": "Lesson Title",
  "subtitle": "Lesson Description",
  "meta": {
    "level": "A1",
    "duration": 30
  },
  "content": {
    "reading": [
      {
        "type": "paragraph",
        "text": "Text with vocabulary words..."
      }
    ]
  },
  "vocabulary": {
    "words": [
      {
        "en": "word",
        "transcription": "[wɜːd]",
        "ru": "слово",
        "example": "Example sentence",
        "part_of_speech": "noun"
      }
    ],
    "phrases": [
      {
        "en": "Common phrase",
        "ru": "Обычная фраза"
      }
    ]
  },
  "grammar": {
    "title": "Grammar Point",
    "explanation": "Explanation...",
    "pattern": "Subject + Verb + Object",
    "examples": {
      "affirmative": ["I eat apples."],
      "negative": ["I don't eat apples."],
      "questions": ["Do you eat apples?"]
    },
    "common_mistakes": ["Don't say 'I eats'"]
  },
  "quiz": [
    {
      "question": "What is...?",
      "options": ["A", "B", "C", "D"],
      "correct": 2
    }
  ]
}
```

## Преимущества модульной системы

✅ **Кэширование**: CSS/JS файлы кэшируются браузером  
✅ **Повторное использование**: Один набор файлов для всех уроков  
✅ **Легкое обновление**: Изменения применяются ко всем урокам  
✅ **Минимальный HTML**: Каждый урок — это просто тонкая оболочка  
✅ **Лучшая производительность**: Меньше дублирования кода  
✅ **Читаемый код**: Логика разделена по модулям  

## Совместимые уроки

Следующие уроки используют модульную систему:
- `101.html`
- `133.html`
- `141.html`
- `152.html`
- `261.html`
- `263.html`

## Коммит история

```bash
feat(css): add core styles with variables, reset, layout and loader
feat(css): add lesson-components and lesson-responsive styles
feat(js): add lesson-storage and lesson-tts modules
feat(js): add lesson-renderer and lesson-engine modules
fix(lesson): clean 141.html - remove duplicate inline CSS/JS after </html>
fix(lessons): clean 133, 152, 261, 263 - remove duplicate inline code
fix(lesson): clean 101.html - remove duplicate inline code
docs: add assets documentation and architecture overview
```

---

Создано: 14 декабря 2025  
Версия: 1.0.0