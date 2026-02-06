# 🎯 Much/Many/A lot of Trainer - План разработки

## Концепция игры

### Геймплей
- **3 вертикальные дорожки** со случайным спавном вопросов
- **Персонаж внизу** (человечек с камнями)
- **Управление:** A/D или стрелки для перемещения персонажа между дорожками
- **Ответ:** Much/Many/A lot of — кидает камень в вопрос над собой
- **Правильный ответ:** Вопрос замерзает, светится зелёным, исчезает (0.5s)
- **Неправильный ответ:** Вопрос светится красным, показывается подсказка, **ускоряется на 20%**
- **Пропущенный:** Достигает земли → -1 жизнь

### Прогрессия скорости
```javascript
// Экспоненциальное ускорение
Время 0s:   10 секунд падения
Время 300s: 1 секунда падения
Время 600s: 0.1 секунды падения

Формула: fallDuration = 10000 * Math.exp(-0.0076 * timeElapsed)
```

### Power-ups (каждые 2 минуты)
- ⏱️ **Slow Motion:** Заморозка всех вопросов на 3 секунды
- 💣 **Clear All:** Удаляет все вопросы на экране
- 🛡️ **Shield:** 1 бесплатная ошибка (не теряется жизнь)

---

## Архитектура

### 1. Классы

#### `MuchManyTrainer` (extends Trainer)
```javascript
- Управление игровым циклом
- Генерация вопросов (countable/uncountable)
- Обработка ответов
- Подсчёт очков
```

#### `FallingQuestionManager`
```javascript
- Спавн вопросов по 3 дорожкам
- Анимация падения (CSS transform + RAF)
- Проверка коллизий с землёй
- Динамическое ускорение
```

#### `PlayerController`
```javascript
- Позиция персонажа (lane 0/1/2)
- Движение A/D или Arrow Left/Right
- Анимация броска камня
- Привязка к дорожке с вопросом
```

#### `PowerUpManager`
```javascript
- Спавн power-up каждые 120 секунд
- Случайный тип (slow/clear/shield)
- Активация при сборе
- Таймер эффекта
```

### 2. Файловая структура

```
english-trainers/
├── much-many.html                          # Точка входа
├── assets/
│   ├── css/
│   │   └── much-many.css                   # Стили игры (lanes, player, power-ups)
│   ├── js/
│   │   ├── modules/
│   │   │   └── much-many.js                # MuchManyTrainer + FallingQuestionManager
│   │   └── utils/
│   │       ├── PlayerController.js         # Управление персонажем
│   │       └── PowerUpManager.js           # Система бонусов
│   └── images/
│       ├── player.svg                      # Спрайт персонажа
│       ├── stone.svg                       # Камень
│       └── powerups/
│           ├── slow-motion.svg
│           ├── clear-all.svg
│           └── shield.svg
└── MUCH_MANY_PLAN.md                       # Этот файл
```

---

## План реализации

### Phase 1: Core Mechanics (Базовая игра)

#### 1.1 HTML Structure
```html
<div class="game-container">
  <!-- 3 вертикальные дорожки -->
  <div class="lanes">
    <div class="lane" data-lane="0"></div>
    <div class="lane" data-lane="1"></div>
    <div class="lane" data-lane="2"></div>
  </div>
  
  <!-- Персонаж внизу -->
  <div class="player" data-current-lane="1">
    <img src="assets/images/player.svg" alt="Player">
  </div>
  
  <!-- Кнопки ответа -->
  <div class="answer-buttons">
    <button data-answer="much">Much</button>
    <button data-answer="many">Many</button>
    <button data-answer="a lot of">A lot of</button>
  </div>
  
  <!-- Статистика -->
  <div class="stats">
    <span id="score">Очки: 0</span>
    <span id="speed">Скорость: 1.0x</span>
    <span id="lives">❤️❤️❤️❤️❤️</span>
  </div>
</div>
```

#### 1.2 FallingQuestionManager
```javascript
class FallingQuestionManager {
  constructor(lanes = 3) {
    this.lanes = lanes;
    this.questions = [];
    this.spawnInterval = 2000;
    this.baseFallDuration = 10000;
    this.gameStartTime = Date.now();
  }
  
  spawnQuestion() {
    const lane = Math.floor(Math.random() * this.lanes);
    const question = this.generateMuchManyQuestion();
    
    const element = this.createQuestionElement(question, lane);
    this.animateFall(element, this.getCurrentFallDuration());
    
    this.questions.push({ id: Date.now(), lane, element, data: question });
  }
  
  getCurrentFallDuration() {
    const elapsed = (Date.now() - this.gameStartTime) / 1000;
    return Math.max(100, 10000 * Math.exp(-0.0076 * elapsed));
  }
  
  generateMuchManyQuestion() {
    const countable = ['яблок', 'книг', 'машин', 'студентов', 'вопросов'];
    const uncountable = ['воды', 'денег', 'времени', 'информации', 'сахара'];
    
    const type = Math.random();
    if (type < 0.4) {
      const noun = countable[Math.floor(Math.random() * countable.length)];
      return {
        text: `Сколько ___ тебе нужно?`,
        noun: noun,
        correctAnswer: 'many',
        hint: 'Исчисляемое → many'
      };
    } else if (type < 0.8) {
      const noun = uncountable[Math.floor(Math.random() * uncountable.length)];
      return {
        text: `Сколько ___ там?`,
        noun: noun,
        correctAnswer: 'much',
        hint: 'Неисчисляемое → much'
      };
    } else {
      const noun = [...countable, ...uncountable][Math.floor(Math.random() * 10)];
      return {
        text: `Там ___ ${noun}`,
        correctAnswer: 'a lot of',
        hint: 'Универсальное → a lot of'
      };
    }
  }
}
```

#### 1.3 PlayerController
```javascript
class PlayerController {
  constructor(lanes = 3) {
    this.lanes = lanes;
    this.currentLane = 1; // Start at center
    this.element = document.querySelector('.player');
    this.isThrowingStone = false;
    
    this._bindControls();
  }
  
  _bindControls() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.moveLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.moveRight();
      }
    });
  }
  
  moveLeft() {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.updatePosition();
    }
  }
  
  moveRight() {
    if (this.currentLane < this.lanes - 1) {
      this.currentLane++;
      this.updatePosition();
    }
  }
  
  updatePosition() {
    const laneWidth = 100 / this.lanes;
    const xPos = (this.currentLane * laneWidth) + (laneWidth / 2);
    this.element.style.left = `${xPos}%`;
    this.element.setAttribute('data-current-lane', this.currentLane);
  }
  
  throwStone() {
    if (this.isThrowingStone) return;
    
    this.isThrowingStone = true;
    this.element.classList.add('throwing');
    
    setTimeout(() => {
      this.element.classList.remove('throwing');
      this.isThrowingStone = false;
    }, 300);
  }
}
```

---

### Phase 2: Power-ups System

#### 2.1 PowerUpManager
```javascript
class PowerUpManager {
  constructor() {
    this.types = ['slow-motion', 'clear-all', 'shield'];
    this.spawnInterval = 120000; // 2 minutes
    this.active = null;
    this.shieldActive = false;
  }
  
  spawn() {
    const type = this.types[Math.floor(Math.random() * this.types.length)];
    const lane = Math.floor(Math.random() * 3);
    
    const element = this.createPowerUpElement(type, lane);
    // Падает медленно (5s)
    this.animateFall(element, 5000);
  }
  
  activate(type) {
    switch(type) {
      case 'slow-motion':
        this.activateSlowMotion();
        break;
      case 'clear-all':
        this.activateClearAll();
        break;
      case 'shield':
        this.activateShield();
        break;
    }
  }
  
  activateSlowMotion() {
    // Freeze all questions for 3s
    document.querySelectorAll('.falling-question').forEach(q => {
      q.style.animationPlayState = 'paused';
    });
    
    setTimeout(() => {
      document.querySelectorAll('.falling-question').forEach(q => {
        q.style.animationPlayState = 'running';
      });
    }, 3000);
  }
  
  activateClearAll() {
    document.querySelectorAll('.falling-question').forEach(q => {
      q.classList.add('explode');
      setTimeout(() => q.remove(), 300);
    });
  }
  
  activateShield() {
    this.shieldActive = true;
    // Visual indicator
    document.querySelector('.player').classList.add('shielded');
  }
}
```

---

### Phase 3: Visual Effects

#### 3.1 CSS Animations
```css
/* Падение вопроса */
@keyframes fall {
  from { transform: translateY(-100px); }
  to { transform: translateY(calc(100vh - 200px)); }
}

.falling-question {
  animation: fall var(--fall-duration) linear forwards;
}

/* Правильный ответ */
@keyframes correct-hit {
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.2); filter: brightness(2); }
  100% { transform: scale(0); opacity: 0; }
}

.falling-question.correct {
  animation: correct-hit 0.5s ease-out;
  background: rgba(0, 255, 100, 0.3);
  border-color: #00ff64;
}

/* Неправильный ответ */
.falling-question.wrong {
  animation: shake 0.3s ease-out;
  background: rgba(255, 0, 0, 0.3);
  border-color: #ff0000;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

/* Бросок камня */
@keyframes throw-stone {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-50px) scale(1.2); }
  100% { transform: translateY(-100px) scale(0); }
}

.player.throwing::after {
  content: '🪨';
  position: absolute;
  animation: throw-stone 0.3s ease-out;
}
```

---

## Локализация (RU)

### UI Элементы
```javascript
const UI_TEXT = {
  title: 'Much/Many/A lot of Тренажёр',
  subtitle: 'Уничтожай падающие вопросы правильными ответами!',
  controls: 'Управление: A/D или ← → для движения',
  answerButtons: {
    much: 'Much',
    many: 'Many',
    aLotOf: 'A lot of'
  },
  stats: {
    score: 'Очки:',
    speed: 'Скорость:',
    lives: 'Жизни:'
  },
  powerUps: {
    slowMotion: '⏱️ Замедление',
    clearAll: '💣 Очистить всё',
    shield: '🛡️ Щит'
  },
  hints: {
    countable: 'Исчисляемое существительное → many',
    uncountable: 'Неисчисляемое существительное → much',
    universal: 'Универсальный вариант → a lot of'
  },
  gameOver: 'Игра окончена!',
  finalScore: 'Финальный счёт:',
  playAgain: '🔄 Играть снова'
};
```

---

## Приоритет разработки

### Sprint 1 (Core) - 2 часа
1. ✅ Создать MUCH_MANY_PLAN.md
2. ⬜ HTML структура (lanes + player + buttons)
3. ⬜ CSS базовая разметка (3 колонки, fixed player)
4. ⬜ FallingQuestionManager (spawn + fall animation)
5. ⬜ PlayerController (A/D движение)
6. ⬜ MuchManyTrainer (answer validation)

### Sprint 2 (Feedback) - 1 час
7. ⬜ Correct answer animation (freeze + glow + aurora)
8. ⬜ Wrong answer animation (shake + red + hint + speedup)
9. ⬜ Stone throw animation
10. ⬜ Haptic feedback integration

### Sprint 3 (Power-ups) - 1 час
11. ⬜ PowerUpManager (spawn every 2 min)
12. ⬜ Slow Motion implementation
13. ⬜ Clear All implementation
14. ⬜ Shield implementation
15. ⬜ Power-up visual indicators

### Sprint 4 (Polish) - 30 min
16. ⬜ Mobile controls (swipe left/right)
17. ⬜ Sound effects (throw, hit, miss)
18. ⬜ Game Over screen
19. ⬜ Leaderboard (localStorage)
20. ⬜ README update

---

## Технические детали

### Speed Formula
```javascript
function calculateFallDuration(gameStartTime) {
  const elapsed = (Date.now() - gameStartTime) / 1000;
  const k = Math.log(0.01) / 600; // 10s → 0.1s over 10 min
  return Math.max(100, 10000 * Math.exp(k * elapsed));
}
```

### Collision Detection
```javascript
function checkCollision(questionElement, playerLane) {
  const questionRect = questionElement.getBoundingClientRect();
  const questionLane = parseInt(questionElement.dataset.lane);
  
  // Check if in same lane and within throw range
  const inSameLane = questionLane === playerLane;
  const inRange = questionRect.bottom > window.innerHeight - 250;
  
  return inSameLane && inRange;
}
```

### Power-up Spawn Timer
```javascript
setInterval(() => {
  powerUpManager.spawn();
}, 120000); // Every 2 minutes
```

---

## Готово к реализации ✅

Начинаем с Sprint 1, файл 1: `much-many.html`
