# Архитектура проекта: Интерактивные уроки английского языка

> **Документ обновлён:** 14 декабря 2025  
> **Версия:** 2.0.0 — Отражает текущую модульную реализацию

---

## 📋 Статус документа

**ВАЖНО:** Этот документ описывает две параллельные архитектуры:

1. **🟢 Текущая реализация (Production)** — Модульная система с разделёнными CSS/JS файлами и JSON-контентом
2. **🔵 Reference архитектура (Blueprint)** — Standalone подход для будущих специализированных проектов

**Политика разработки:**
- Существующие HTML-уроки не изменяем (обратная совместимость)
- Новый функционал добавляем в модульную систему
- Паттерны проектирования универсальны для обоих подходов
- При необходимости standalone артефакт можно собрать из модулей

---

## 📑 Оглавление

### Текущая реализация
1. [Модульная архитектура (Current)](#модульная-архитектура-current)
2. [Файловая структура](#файловая-структура)
3. [JavaScript модули](#javascript-модули)
4. [CSS модули](#css-модули)
5. [JSON структура данных](#json-структура-данных)
6. [Workflow урока](#workflow-урока)

### Reference архитектура
7. [Standalone Blueprint](#standalone-blueprint-reference)
8. [Реактивное управление состоянием](#реактивное-управление-состоянием)
9. [Компонентная система](#компонентная-система)
10. [Паттерны и Best Practices](#паттерны-и-best-practices)
11. [Performance оптимизация](#performance-оптимизация)
12. [Roadmap](#roadmap)

---

# 🟢 ТЕКУЩАЯ РЕАЛИЗАЦИЯ

## Модульная архитектура (Current)

### Обзор

Проект **успешно мигрировал на модульную архитектуру** в декабре 2025. Вместо монолитных HTML-файлов теперь используется система разделённых CSS/JS модулей с JSON-driven контентом.

### Ключевые преимущества

✅ **Кэширование браузером** — CSS/JS файлы кэшируются один раз  
✅ **Разделение ответственности** — Engine, Renderer, Storage, TTS  
✅ **Повторное использование** — Один набор модулей для всех уроков  
✅ **Лёгкость обновлений** — Изменения применяются глобально  
✅ **Минимальный HTML** — Каждый урок ≈ 2 KB (только подключения)

---

## Файловая структура

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
│       └── lesson-engine.js         # Главный контроллер приложения
├── data/
│   └── {lessonId}.json              # JSON данные урока
```

### Архитектурные слои

```
┌─────────────────────────────────────────┐
│         HTML Wrapper (Thin)             │  ← Только подключения модулей
├─────────────────────────────────────────┤
│         LessonEngine (Controller)       │  ← Логика и координация
├─────────────────────────────────────────┤
│  LessonRenderer │ LessonStorage │ TTS   │  ← Специализированные сервисы
├─────────────────────────────────────────┤
│         CSS Modules (Presentation)      │  ← Стили и компоненты
├─────────────────────────────────────────┤
│         JSON Data (Content)             │  ← Данные уроков
└─────────────────────────────────────────┘
```

---

## JavaScript модули

### 1. `lesson-engine.js` — Главный контроллер

**Паттерн:** MVC Controller + State Management

**Класс:** `LessonEngine`

**Ответственность:**
- Инициализация приложения
- Загрузка JSON данных урока
- Координация между компонентами
- Управление состоянием (tabs, vocabulary mode, quiz state)
- Обработка пользовательских действий

**Состояние:**
```javascript
{
    lessonId: string,
    lessonData: object,
    currentTab: 'reading' | 'vocabulary' | 'grammar' | 'quiz',
    vocabMode: 'list' | 'flashcard',
    flashcardIndex: number,
    myWords: Array<Word>,
    quizState: {
        currentQuestionIndex: number,
        answers: Array,
        completed: boolean
    }
}
```

**Ключевые методы:**
```javascript
class LessonEngine {
    async init()                          // Инициализация приложения
    async loadLessonData()                // Загрузка JSON из /data/
    switchTab(tabName)                    // Переключение между секциями
    renderCurrentTab()                    // Рендеринг активной вкладки
    toggleWord(wordData)                  // Сохранить/удалить слово
    speakAllReading()                     // Озвучить весь текст
    speakWord(word)                       // Озвучить отдельное слово
    flipFlashcard()                       // Перевернуть флешкарту
    nextFlashcard() / prevFlashcard()     // Навигация по флешкартам
    selectQuizAnswer(index)               // Ответить на вопрос
    nextQuizQuestion()                    // Следующий вопрос
    resetQuiz()                           // Сброс квиза
    showNotification(message)             // Показать уведомление
}
```

**Пример инициализации:**
```javascript
const lessonId = window.location.pathname.split('/').pop().replace('.html', '');
window.lessonEngine = new LessonEngine(lessonId);
window.lessonEngine.init();
```

---

### 2. `lesson-renderer.js` — Рендеринг UI

**Паттерн:** View Layer (Template Rendering)

**Класс:** `LessonRenderer`

**Ответственность:**
- Генерация HTML-разметки для каждой секции
- Обработка текста (экранирование, подсветка слов)
- Создание интерактивных элементов
- Безопасная вставка контента

**Методы:**
```javascript
class LessonRenderer {
    constructor(lessonData, tts, storage)
    
    // Утилиты
    escapeHTML(text)                      // XSS защита
    
    // Рендеринг секций
    renderReading(myWords)                // Reading с кликабельными словами
    renderVocabulary(mode, myWords)       // Vocabulary (list/flashcard)
    renderVocabList(vocab, phrases, words) // Список слов
    renderFlashcard(vocab, index)         // Одна флешкарта
    renderGrammar()                       // Grammar секция
    renderQuiz(quizState)                 // Quiz вопросы
    renderQuizResults(quizState)          // Результаты квиза
    renderSidebar(myWords)                // Sidebar сохранённых слов
}
```

**Особенности:**
- **Умная подсветка слов:** Автоматически находит слова из vocabulary в тексте
- **State-aware rendering:** Учитывает сохранённые слова пользователя
- **Accessibility:** Semantic HTML, ARIA attributes
- **Template strings:** Использует template literals для читаемости

---

### 3. `lesson-storage.js` — Персистентность

**Паттерн:** Repository Pattern

**Класс:** `LessonStorage`

**Ответственность:**
- LocalStorage операции для сохранённых слов
- Валидация и дедупликация
- Сериализация/десериализация

**API:**
```javascript
class LessonStorage {
    constructor(lessonId)                 // Изоляция по lessonId
    
    loadWords()                           // → Array<Word>
    saveWords(words)                      // ← Array<Word>
    addWord(wordData)                     // → boolean (success)
    removeWord(word)                      // → boolean (success)
    isWordSaved(word)                     // → boolean
    clearAll()                            // Очистить все слова урока
    getCount()                            // → number
}
```

**Формат хранения:**
```javascript
// LocalStorage key: "lesson-{lessonId}-words"
[
    {
        word: "example",
        definition: "пример",
        phonetic: "[ɪɡˈzɑːmpl]",
        timestamp: 1702540800000
    }
]
```

---

### 4. `lesson-tts.js` — Озвучка

**Паттерн:** Service Layer

**Класс:** `LessonTTS`

**Ответственность:**
- Text-to-Speech через Google Translate API
- Управление аудио воспроизведением
- Тактильная обратная связь (vibration)

**API:**
```javascript
class LessonTTS {
    speak(text, lang = 'en')              // Произнести текст
    speakSequence(texts, delay = 800)     // Последовательность с паузами
    stop()                                // Остановить воспроизведение
    vibrate(duration = 10)                // Вибрация (если поддерживается)
}
```

**Технические детали:**
```javascript
speak(text, lang = 'en') {
    const cleaned = this.cleanText(text);  // Удаление [translate:] маркеров
    
    // Google TTS endpoint
    const url = `https://translate.google.com/translate_tts?
                 ie=UTF-8&q=${encodeURIComponent(cleaned)}&tl=${lang}&client=tw-ob`;
    
    this.currentAudio = new Audio(url);
    this.currentAudio.play().catch(err => {
        console.error('TTS playback error:', err);
    });
}
```

---

## CSS модули

### 1. `lesson-core.css` — Фундамент

**Содержимое:**
- `:root` CSS переменные (design tokens)
- Modern CSS reset
- Базовый layout: `body`, `#app-root`, `.app-shell`
- Loader анимация с орбитами
- Sidebar стили
- Keyframes: `spin`, `pulse`

**Design System:**
```css
:root {
    /* Colors */
    --primary-color: #2563eb;
    --success-color: #10b981;
    --error-color: #ef4444;
    --text-color: #1f2937;
    --bg-color: #f9fafb;
    
    /* Typography */
    --font-main: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    
    /* Spacing (8px scale) */
    --spacing-xs: 0.5rem;
    --spacing-sm: 1rem;
    --spacing-md: 1.5rem;
    --spacing-lg: 2rem;
    
    /* Layout */
    --max-width: 1200px;
    --sidebar-width: 280px;
    
    /* Effects */
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    --radius: 8px;
    --transition: 0.2s ease;
}
```

---

### 2. `lesson-components.css` — UI компоненты

**Компонентная библиотека:**
```css
/* Header */
.lesson-header { /* Заголовок урока */ }
.lesson-title { /* Название */ }
.pill { /* Бейджи уровня/времени */ }

/* Tabs Navigation */
.tabs { /* Контейнер вкладок */ }
.tab.active { /* Активная вкладка */ }
.tab-indicator { /* Анимированный индикатор */ }

/* Cards */
.card { /* Базовая карточка */ }

/* Buttons */
.primary-btn { /* Основная кнопка */ }
.icon-btn { /* Кнопка-иконка */ }

/* Reading */
.word-clickable { /* Кликабельное слово */ }
.word-clickable.saved { /* Сохранённое слово */ }

/* Vocabulary */
.vocab-layout { /* Grid layout */ }
.vocab-item { /* Карточка слова */ }

/* Flashcards */
.flashcard { /* 3D переворачиваемая карта */ }
.flashcard.flipped { /* Перевёрнутое состояние */ }

/* Quiz */
.quiz-option { /* Вариант ответа */ }
.quiz-feedback { /* Обратная связь */ }
```

**3D Flip эффект:**
```css
.flashcard {
    transform-style: preserve-3d;
    transition: transform 0.6s;
}

.flashcard.flipped {
    transform: rotateY(180deg);
}

.flashcard-face {
    backface-visibility: hidden;
}
```

---

### 3. `lesson-responsive.css` — Адаптивность

**Breakpoints:**
```css
/* Tablet */
@media (max-width: 1024px) {
    .sidebar { width: 250px; }
}

/* Mobile */
@media (max-width: 768px) {
    .vocab-layout { grid-template-columns: 1fr; }
    .sidebar { display: none; }
}

/* Small Mobile */
@media (max-width: 480px) {
    .flashcard { width: 100%; }
}
```

---

## JSON структура данных

### Формат урока (`data/{lessonId}.json`)

```json
{
  "title": "Present Simple Tense",
  "subtitle": "Basic usage and formation",
  "meta": {
    "level": "A1",
    "duration": 30
  },
  
  "content": {
    "reading": [
      {
        "type": "paragraph",
        "text": "This is a paragraph with vocabulary words..."
      }
    ]
  },
  
  "vocabulary": {
    "words": [
      {
        "en": "example",
        "transcription": "[ɪɡˈzɑːmpl]",
        "ru": "пример",
        "example": "Example sentence.",
        "part_of_speech": "noun"
      }
    ],
    "phrases": [
      {
        "en": "for example",
        "ru": "например"
      }
    ]
  },
  
  "grammar": {
    "title": "Present Simple - Formation",
    "explanation": "We use Present Simple for...",
    "examples": {
      "affirmative": ["I work every day."],
      "negative": ["I don't work on Sundays."],
      "questions": ["Do you work here?"]
    }
  },
  
  "quiz": [
    {
      "question": "Choose the correct form:",
      "options": ["She work", "She works", "She working"],
      "correct": 1
    }
  ]
}
```

---

## Workflow урока

### Жизненный цикл

```
1. Загрузка HTML
   ↓
2. Подключение CSS модулей (кэшированы)
   ↓
3. Подключение JS модулей (кэшированы)
   ↓
4. Инициализация LessonEngine
   ↓
5. Загрузка JSON данных (fetch)
   ↓
6. Создание LessonRenderer, LessonStorage, LessonTTS
   ↓
7. Восстановление сохранённых слов (localStorage)
   ↓
8. Рендеринг первой вкладки (Reading)
   ↓
9. Скрытие loader
   ↓
10. Приложение готово к взаимодействию
```

### Пример HTML-оболочки

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>English Lesson</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- CSS Modules -->
  <link rel="stylesheet" href="assets/css/lesson-core.css">
  <link rel="stylesheet" href="assets/css/lesson-components.css">
  <link rel="stylesheet" href="assets/css/lesson-responsive.css">
</head>
<body>
  <!-- Loader -->
  <div class="loader-container" id="loader">
    <div class="loader">
      <div class="loader-orbit"></div>
      <div class="loader-core"></div>
    </div>
    <p>Loading lesson...</p>
  </div>

  <!-- App Root -->
  <div id="app-root">
    <div id="app"></div>
  </div>

  <!-- Notification -->
  <div class="notification" id="notification">
    <span id="notification-text"></span>
  </div>

  <!-- JavaScript Modules -->
  <script src="assets/js/lesson-storage.js"></script>
  <script src="assets/js/lesson-tts.js"></script>
  <script src="assets/js/lesson-renderer.js"></script>
  <script src="assets/js/lesson-engine.js"></script>
  
  <!-- Initialization -->
  <script>
    const lessonId = window.location.pathname
      .split('/').pop()
      .replace('.html', '');
    
    window.lessonEngine = new LessonEngine(lessonId);
    window.lessonEngine.init();
  </script>
</body>
</html>
```

---

# 🔵 STANDALONE BLUEPRINT (Reference)

## Standalone Blueprint (Reference)

> **Примечание:** Следующие разделы описывают альтернативный standalone подход  
> для специализированных случаев (offline distribution, email attachments).  
> Все паттерны применимы к текущей модульной системе.

### Концепция

Standalone урок = один HTML-файл содержит:
- Разметку (семантический HTML)
- Стили (встроенный `<style>`)
- Логику (встроенный `<script>`)
- Контент (данные упражнений внутри файла)

**Преимущества:**
- Один файл = один артефакт
- Работает локально (file://)
- Нет проблем с CORS
- Легко распространять

**Когда использовать:**
- Offline курсы на USB
- Email рассылки с уроками
- Архивирование для долгосрочного хранения
- Специальные образовательные проекты

---

## Реактивное управление состоянием

### Reactive State через Proxy

```javascript
class ReactiveState {
    constructor(initialState) {
        this.listeners = new Map();
        this.state = this._makeReactive(initialState);
    }
    
    _makeReactive(obj) {
        const self = this;
        return new Proxy(obj, {
            set(target, property, value) {
                const oldValue = target[property];
                target[property] = value;
                
                // Уведомляем подписчиков
                if (self.listeners.has(property)) {
                    self.listeners.get(property).forEach(callback => {
                        callback(value, oldValue);
                    });
                }
                
                return true;
            }
        });
    }
    
    subscribe(property, callback) {
        if (!this.listeners.has(property)) {
            this.listeners.set(property, new Set());
        }
        this.listeners.get(property).add(callback);
        
        return () => this.listeners.get(property).delete(callback);
    }
}

// Использование
const state = new ReactiveState({ score: 0 });
state.subscribe('score', (newScore) => {
    console.log('Score updated:', newScore);
    updateUI();
});
```

---

## Компонентная система

### Base Component

```javascript
class Component {
    constructor(props = {}) {
        this.props = props;
        this.element = null;
        this.mounted = false;
    }
    
    render() {
        throw new Error('render() must be implemented');
    }
    
    mount(container) {
        this.element = this.render();
        container.appendChild(this.element);
        this.mounted = true;
        this.onMount();
        return this;
    }
    
    unmount() {
        if (this.mounted && this.element) {
            this.onUnmount();
            this.element.remove();
            this.mounted = false;
        }
    }
    
    update(newProps) {
        this.props = { ...this.props, ...newProps };
        if (this.mounted) {
            const newElement = this.render();
            this.element.replaceWith(newElement);
            this.element = newElement;
        }
    }
    
    onMount() {}
    onUnmount() {}
}
```

### Пример: ProgressBar Component

```javascript
class ProgressBar extends Component {
    render() {
        const { current, total, label } = this.props;
        const percentage = (current / total) * 100;
        
        const div = document.createElement('div');
        div.className = 'progress';
        div.setAttribute('role', 'progressbar');
        div.setAttribute('aria-valuenow', current);
        div.setAttribute('aria-valuemax', total);
        
        div.innerHTML = `
            <div class="progress__bar" style="width: ${percentage}%"></div>
            <span class="progress__label">${current} / ${total}</span>
        `;
        
        return div;
    }
}
```

---

## Паттерны и Best Practices

### 1. Error Handling

```javascript
class ErrorHandler {
    static handle(error, context = {}) {
        console.error('Application error:', error, context);
        this.showUserMessage(this.getUserMessage(error));
        this.logError(error, context);
    }
    
    static getUserMessage(error) {
        if (error instanceof NetworkError) {
            return 'Проблемы с подключением.';
        }
        return 'Что-то пошло не так.';
    }
    
    static showUserMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast--error';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('visible'), 10);
        setTimeout(() => toast.remove(), 5000);
    }
}

// Глобальный обработчик
window.addEventListener('error', (e) => {
    ErrorHandler.handle(e.error, { type: 'uncaught' });
});
```

### 2. State Management Best Practices

**✅ DO:**
```javascript
// Централизованное состояние
class LessonController {
    constructor() {
        this.state = { currentTab: 'reading' };
    }
    
    switchTab(tab) {
        this.state.currentTab = tab;
        this.render();
    }
}
```

**❌ DON'T:**
```javascript
// Разбросанное состояние в глобальных переменных
let currentTab = 'reading';
let score = 0;
```

### 3. Event Delegation

**✅ DO:**
```javascript
// Event delegation
document.querySelector('.vocab-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.save-btn');
    if (btn) {
        this.toggleWord(btn.dataset.word);
    }
});
```

**❌ DON'T:**
```javascript
// Множество слушателей
document.querySelectorAll('.save-btn').forEach(btn => {
    btn.addEventListener('click', () => ...);
});
```

---

## Performance оптимизация

### 1. Lazy Loading изображений

```javascript
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}
```

### 2. Debounce и Throttle

```javascript
const Utils = {
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Использование
const debouncedSearch = Utils.debounce((query) => {
    searchVocabulary(query);
}, 300);

input.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});
```

### 3. Batch DOM Updates

```javascript
class DOMBatcher {
    constructor() {
        this.reads = [];
        this.writes = [];
        this.scheduled = false;
    }
    
    read(callback) {
        this.reads.push(callback);
        this.schedule();
    }
    
    write(callback) {
        this.writes.push(callback);
        this.schedule();
    }
    
    schedule() {
        if (this.scheduled) return;
        
        this.scheduled = true;
        requestAnimationFrame(() => {
            this.reads.forEach(fn => fn());
            this.reads = [];
            
            this.writes.forEach(fn => fn());
            this.writes = [];
            
            this.scheduled = false;
        });
    }
}
```

---

## Roadmap

### Phase 1: Template Generator (Q1 2026)

**Цель:** Автоматизация создания уроков

**Задачи:**
- CLI инструмент для генерации HTML из JSON
- JSON schema validation
- Автоматическое создание lessonId
- Предпросмотр урока в dev mode

**Технологии:**
- Node.js для CLI
- JSON Schema для валидации
- Template engine (Handlebars/EJS)

**Пример использования:**
```bash
$ npm run create-lesson data/152.json
✓ JSON validated
✓ HTML generated: dist/152.html
✓ Lesson ready: http://localhost:3000/152.html
```

---

### Phase 2: Enhanced Interactivity (Q2 2026)

**Цель:** Расширение интерактивности

**Задачи:**
- Speech Recognition API для произношения
- Drag-and-drop упражнения
- Заполнение пропусков (fill-in-the-blank)
- Matching games

**Новые типы quiz вопросов:**
```json
{
  "type": "fill-blank",
  "text": "I ___ to school every day.",
  "correct": "go",
  "options": ["go", "goes", "going"]
}
```

---

### Phase 3: Analytics & Progress Tracking (Q3 2026)

**Цель:** Отслеживание прогресса обучения

**Задачи:**
- Dashboard для просмотра статистики
- Spaced Repetition System (SRS) для слов
- Рекомендации следующих уроков
- Экспорт прогресса

**Новый модуль:**
```javascript
class LessonAnalytics {
    trackEvent(event, data)
    getProgress()
    calculateSRSSchedule(word)
    recommendNextLesson()
}
```

---

### Phase 4: Progressive Web App (Q4 2026)

**Цель:** Offline-доступность и нативный опыт

**Задачи:**
- Service Worker для кэширования
- Web App Manifest
- Push notifications для напоминаний
- Install prompt

---

## Заключение

Проект успешно реализован с использованием **модульной архитектуры**, обеспечивающей:

✅ **Maintainability** — Лёгкая поддержка и расширение  
✅ **Performance** — Быстрая загрузка благодаря кэшированию  
✅ **Scalability** — Готовность к росту количества уроков  
✅ **Developer Experience** — Понятная структура кода  
✅ **User Experience** — Консистентный интерфейс  

Текущая архитектура балансирует между простотой разработки и качеством продукта, используя современные веб-стандарты без внешних зависимостей.

### Для новых разработчиков

**Начните с:**
1. Изучения `lesson-engine.js` — точка входа
2. Просмотра `lesson-renderer.js` — понимание UI
3. Анализа JSON структуры — формат данных
4. Экспериментов с существующими уроками

**Следуйте принципам:**
- Separation of Concerns
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- Progressive Enhancement
- Accessibility First

---

**Авторы:** andreacebotarev-svg  
**Версия:** 2.0.0  
**Дата обновления:** 14 декабря 2025  
**Статус:** ✅ Production Ready  
**Подробная документация:** [README.md](./README.md)
