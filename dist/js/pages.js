/**
 * Application Pages
 * All pages as vanilla JS classes
 */

import { lessonsManager } from './lessons.js';
import { Storage } from './storage.js';
import { createElement, shuffle, animateSuccess, animateError, sleep } from './utils.js';

// Base Page Class
class BasePage {
  constructor(container, params = {}) {
    this.container = container;
    this.params = params;
  }
  
  render() {
    // Override in subclasses
  }
  
  destroy() {
    // Cleanup if needed
  }
}

// Lesson Select Page
export class LessonSelectPage extends BasePage {
  async render() {
    const data = Storage.get();
    
    this.container.innerHTML = `
      <div class="container">
        <div class="page-header">
          <h1>📚 English Phonics Trainer</h1>
          <p>Выберите урок для изучения</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <div class="stat-value">${data.totalScore}</div>
              <div class="stat-label">Очков</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value">${data.totalWords}</div>
              <div class="stat-label">Слов изучено</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-content">
              <div class="stat-value">${data.totalLessons}</div>
              <div class="stat-label">Уроков пройдено</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <div class="stat-value">${Math.floor(data.totalPlaytime / 60)}</div>
              <div class="stat-label">Минут игры</div>
            </div>
          </div>
        </div>
        
        <div id="lessons-grid" class="cards-grid">
          <div class="loading">
            <div class="spinner"></div>
            <p>Загрузка уроков...</p>
          </div>
        </div>
      </div>
    `;
    
    // Load lessons
    try {
      const lessons = await lessonsManager.getAllLessons();
      this.renderLessons(lessons);
    } catch (error) {
      document.getElementById('lessons-grid').innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h3>🚨 Ошибка загрузки уроков</h3>
          <p>Проверьте, что файлы JSON находятся в папке data/</p>
        </div>
      `;
    }
  }
  
  renderLessons(lessons) {
    const grid = document.getElementById('lessons-grid');
    grid.innerHTML = '';
    
    lessons.forEach(lesson => {
      const lessonData = Storage.getLessonData(lesson.id);
      const stars = lessonData?.stars || 0;
      const completedWords = lessonData?.completedWords || 0;
      const totalWords = lesson.words.length;
      
      let badgeText = 'Новый';
      let badgeClass = 'badge';
      
      if (completedWords === totalWords && stars > 0) {
        badgeText = '⭐'.repeat(stars);
        badgeClass = 'badge badge-success';
      } else if (completedWords > 0) {
        badgeText = `${completedWords}/${totalWords}`;
        badgeClass = 'badge badge-warning';
      }
      
      const card = createElement('div', { className: 'card' }, [
        createElement('div', { className: 'card-icon', textContent: lesson.emoji || '📝' }),
        createElement('h3', { className: 'card-title', textContent: lesson.title }),
        createElement('p', { className: 'card-description', textContent: lesson.description }),
        createElement('span', { className: badgeClass, textContent: badgeText }),
        createElement('div', { className: 'card-footer', textContent: `💬 ${totalWords} слов • ⏱️ 10 мин` })
      ]);
      
      card.addEventListener('click', () => {
        window.location.hash = `/lesson/${lesson.id}`;
      });
      
      grid.appendChild(card);
    });
  }
}

// Lesson Trainer Page
export class LessonTrainerPage extends BasePage {
  constructor(container, params) {
    super(container, params);
    this.lesson = null;
    this.currentWordIndex = 0;
    this.selectedPhonemes = [];
    this.score = 0;
    this.startTime = Date.now();
  }
  
  async render() {
    try {
      const lessonId = parseInt(this.params.id);
      this.lesson = await lessonsManager.loadLesson(lessonId);
      
      this.container.innerHTML = `
        <div class="container">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
            <button class="btn btn-secondary" id="back-btn">
              ← Назад
            </button>
            <div style="flex: 1;">
              <h2>${this.lesson.emoji} ${this.lesson.title}</h2>
              <p style="color: var(--color-text-secondary);">${this.lesson.rule}</p>
            </div>
            <span class="badge badge-success" id="score-badge">🎯 ${this.score}</span>
          </div>
          
          <div class="progress">
            <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
          </div>
          
          <div id="game-area"></div>
        </div>
      `;
      
      document.getElementById('back-btn').onclick = () => window.location.hash = '/';
      
      this.showWord(0);
    } catch (error) {
      this.container.innerHTML = `
        <div class="container" style="text-align: center; padding: 4rem;">
          <h2>🚨 Ошибка</h2>
          <p>Не удалось загрузить урок</p>
          <button class="btn btn-primary" onclick="window.location.hash='/'">На главную</button>
        </div>
      `;
    }
  }
  
  showWord(index) {
    if (index >= this.lesson.words.length) {
      this.finishLesson();
      return;
    }
    
    this.currentWordIndex = index;
    this.selectedPhonemes = [];
    const word = this.lesson.words[index];
    
    // Update progress
    const progress = (index / this.lesson.words.length) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    
    // Render game area
    const gameArea = document.getElementById('game-area');
    gameArea.innerHTML = '';
    
    // Word display
    const wordDisplay = createElement('div', { className: 'word-display' }, [
      createElement('div', { className: 'word-icon', textContent: word.emoji || '📝' }),
      createElement('div', { className: 'word-info' }, [
        createElement('div', { className: 'word-translation', textContent: word.translation }),
        createElement('div', { className: 'word-transcription', textContent: word.transcription })
      ])
    ]);
    gameArea.appendChild(wordDisplay);
    
    // Phoneme slots
    const slots = createElement('div', { className: 'phoneme-slots', id: 'phoneme-slots' });
    word.phonemes.forEach(() => {
      slots.appendChild(createElement('div', { className: 'phoneme-slot' }));
    });
    gameArea.appendChild(slots);
    
    // Phoneme bank
    const correctPhonemes = [...word.phonemes];
    const distractors = this.lesson.phonemesSet
      .filter(p => !correctPhonemes.includes(p))
      .slice(0, 3);
    const allPhonemes = shuffle([...correctPhonemes, ...distractors]);
    
    const bank = createElement('div', { className: 'phoneme-bank' });
    allPhonemes.forEach(phoneme => {
      const btn = createElement('button', {
        className: 'phoneme-btn',
        textContent: phoneme,
        onClick: () => this.selectPhoneme(phoneme, word)
      });
      bank.appendChild(btn);
    });
    gameArea.appendChild(bank);
    
    // Actions
    const actions = createElement('div', { className: 'actions' }, [
      createElement('button', {
        className: 'btn btn-secondary',
        textContent: '❌ Очистить',
        onClick: () => this.clearSelection(word)
      }),
      createElement('button', {
        className: 'btn btn-primary',
        id: 'check-btn',
        textContent: '✅ Проверить',
        disabled: true,
        onClick: () => this.checkAnswer(word)
      })
    ]);
    gameArea.appendChild(actions);
  }
  
  selectPhoneme(phoneme, word) {
    if (this.selectedPhonemes.length >= word.phonemes.length) return;
    
    this.selectedPhonemes.push(phoneme);
    this.updateSlots();
    
    document.getElementById('check-btn').disabled = 
      this.selectedPhonemes.length !== word.phonemes.length;
  }
  
  clearSelection(word) {
    this.selectedPhonemes = [];
    this.updateSlots();
    document.getElementById('check-btn').disabled = true;
  }
  
  updateSlots() {
    const slots = document.querySelectorAll('.phoneme-slot');
    slots.forEach((slot, i) => {
      slot.textContent = this.selectedPhonemes[i] || '';
      slot.classList.toggle('filled', !!this.selectedPhonemes[i]);
    });
  }
  
  async checkAnswer(word) {
    const isCorrect = this.selectedPhonemes.join('') === word.phonemes.join('');
    const slotsContainer = document.getElementById('phoneme-slots');
    
    if (isCorrect) {
      await animateSuccess(slotsContainer);
      this.score += 10;
      document.getElementById('score-badge').textContent = `🎯 ${this.score}`;
      
      await sleep(1000);
      this.showWord(this.currentWordIndex + 1);
    } else {
      await animateError(slotsContainer);
      await sleep(500);
      this.clearSelection(word);
    }
  }
  
  finishLesson() {
    const totalWords = this.lesson.words.length;
    const playTime = Math.floor((Date.now() - this.startTime) / 1000);
    
    Storage.updateLesson(this.lesson.id, this.score, totalWords, totalWords);
    
    // Store result for results page
    sessionStorage.setItem('lastLessonResult', JSON.stringify({
      lessonId: this.lesson.id,
      score: this.score,
      totalWords,
      completedWords: totalWords,
      playTime
    }));
    
    window.location.hash = '/results';
  }
}

// Results Page
export class ResultsPage extends BasePage {
  render() {
    const resultData = sessionStorage.getItem('lastLessonResult');
    
    if (!resultData) {
      window.location.hash = '/';
      return;
    }
    
    const { lessonId, score, totalWords, completedWords, playTime } = JSON.parse(resultData);
    const lessonData = Storage.getLessonData(lessonId);
    const stars = lessonData?.stars || 0;
    const percentage = Math.round((completedWords / totalWords) * 100);
    
    this.container.innerHTML = `
      <div class="container" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
        <div class="results-container">
          <h1 style="font-size: 2.5rem; margin-bottom: 2rem;">🎉 Урок завершён!</h1>
          
          <div class="stars">
            <span class="star" style="filter: grayscale(${stars >= 1 ? 0 : 100}%)">⭐</span>
            <span class="star" style="filter: grayscale(${stars >= 2 ? 0 : 100}%)">⭐</span>
            <span class="star" style="filter: grayscale(${stars >= 3 ? 0 : 100}%)">⭐</span>
          </div>
          
          <div class="score-display">
            <div class="score-value">${score}</div>
            <div class="score-label">Очков</div>
          </div>
          
          <div class="stats-grid" style="margin: 2rem 0;">
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <div class="stat-value">${completedWords}/${totalWords}</div>
                <div class="stat-label">Слов выучено</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-content">
                <div class="stat-value">${percentage}%</div>
                <div class="stat-label">Точность</div>
              </div>
            </div>
          </div>
          
          <div class="actions">
            <button class="btn btn-primary" onclick="window.location.hash='/lesson/${lessonId}'">
              🔄 Повторить урок
            </button>
            <button class="btn btn-secondary" onclick="window.location.hash='/'">
              🏠 Выбрать другой урок
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
