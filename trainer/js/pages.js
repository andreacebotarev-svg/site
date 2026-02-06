// Page components and rendering
import { storage } from './storage.js';
import { lessons } from './lessons.js';
import { router } from './router.js';
import { shuffle, generateDistractors, wait, playSuccessAnimation, playErrorAnimation, createElement, announce, sound, speech } from './utils.js';

// Lesson Selection Page
export async function renderLessonSelect() {
  const app = document.getElementById('app');
  const stats = storage.getStats();
  
  // Dashboard
  const dashboard = createElement('div', {
    className: 'glass dashboard fade-in'
  }, [
    createElement('h2', { className: 'dashboard__title' }, ['📊 Ваша Статистика']),
    createElement('div', { className: 'dashboard__stats' }, [
      createElement('div', { className: 'stat-card' }, [
        createElement('span', { className: 'stat-card__value' }, [String(stats.totalScore)]),
        createElement('span', { className: 'stat-card__label' }, ['Очков'])
      ]),
      createElement('div', { className: 'stat-card' }, [
        createElement('span', { className: 'stat-card__value' }, [String(stats.totalWords)]),
        createElement('span', { className: 'stat-card__label' }, ['Слов изучено'])
      ]),
      createElement('div', { className: 'stat-card' }, [
        createElement('span', { className: 'stat-card__value' }, [String(stats.lessonsCompleted)]),
        createElement('span', { className: 'stat-card__label' }, ['Уроков пройдено'])
      ])
    ])
  ]);
  
  // Lessons header
  const header = createElement('div', { className: 'container' }, [
    createElement('h1', { className: 'fade-in' }, ['🎯 Выберите Урок'])
  ]);
  
  // Load available lessons
  let availableLessons = [];
  try {
    availableLessons = await lessons.getAvailableLessons();
  } catch (error) {
    console.error('Failed to load lessons:', error);
  }
  
  // Lessons grid
  const lessonsGrid = createElement('div', { className: 'grid grid-3 fade-in' });
  
  availableLessons.forEach((lesson, index) => {
    const lessonStats = storage.getLessonStats(lesson.id);
    
    const card = createElement('div', {
      className: 'glass lesson-card',
      onclick: () => router.push(`/lesson/${lesson.id}`),
      role: 'button',
      tabindex: 0,
      'aria-label': `Урок ${lesson.id}: ${lesson.title}`,
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/lesson/${lesson.id}`);
        }
      }
    }, [
      createElement('span', { className: 'lesson-card__emoji' }, [lesson.emoji]),
      createElement('h3', { className: 'lesson-card__title' }, [lesson.title]),
      createElement('p', { className: 'lesson-card__description' }, [lesson.description]),
      createElement('div', { className: 'lesson-card__stats' }, [
        createElement('div', { className: 'lesson-card__stat' }, [
          createElement('span', {}, ['📝']),
          createElement('span', {}, [`${lesson.wordCount} слов`])
        ]),
        createElement('div', { className: 'lesson-card__stat' }, [
          createElement('span', {}, ['⏱️']),
          createElement('span', {}, [`${lesson.estimatedTime} мин`])
        ]),
        ...(lessonStats.isCompleted ? [
          createElement('div', { className: 'lesson-card__stat' }, [
            createElement('span', {}, ['⭐']),
            createElement('span', {}, [`${lessonStats.stars}/3`])
          ])
        ] : [])
      ])
    ]);
    
    // Add animation delay
    card.style.animationDelay = `${index * 50}ms`;
    lessonsGrid.appendChild(card);
  });
  
  // Render
  app.innerHTML = '';
  app.appendChild(createElement('div', { className: 'container' }, [dashboard]));
  app.appendChild(header);
  app.appendChild(createElement('div', { className: 'container' }, [lessonsGrid]));
}

// Lesson Trainer Page
export async function renderLessonTrainer({ id }) {
  const app = document.getElementById('app');
  const lessonId = parseInt(id);
  
  // Show loading
  app.innerHTML = '<div class="flex flex-center" style="min-height: 100vh;"><div class="spinner"></div></div>';
  
  try {
    const lesson = await lessons.load(lessonId);
    const state = {
      currentWordIndex: 0,
      selectedPhonemes: [],
      score: 0,
      correctAnswers: 0,
      startTime: Date.now()
    };
    
    // Initialize sound
    sound.init();
    
    renderTrainerUI(lesson, state);
  } catch (error) {
    app.innerHTML = `
      <div class="container-sm" style="text-align: center; padding: 4rem;">
        <h2 style="color: white; margin-bottom: 2rem;">😞 Урок не найден</h2>
        <button class="btn btn-primary" onclick="window.location.hash = '/';">Вернуться к урокам</button>
      </div>
    `;
  }
}

function renderTrainerUI(lesson, state) {
  const app = document.getElementById('app');
  const currentWord = lesson.words[state.currentWordIndex];
  
  // Create phoneme bank (correct + distractors)
  const allPhonemes = shuffle([
    ...currentWord.phonemes,
    ...generateDistractors(currentWord.phonemes, lesson.phonemesSet, 3)
  ]);
  
  // Header with progress
  const header = createElement('div', { className: 'container-sm glass', style: 'margin-bottom: 2rem; padding: 1rem;' }, [
    createElement('div', { className: 'flex flex-between', style: 'margin-bottom: 1rem;' }, [
      createElement('button', {
        className: 'btn btn-ghost',
        onclick: () => router.back(),
        'aria-label': 'Назад'
      }, ['← Назад']),
      createElement('span', { style: 'color: white; font-weight: 600;' }, [
        `${state.currentWordIndex + 1} / ${lesson.words.length}`
      ])
    ]),
    createElement('div', { className: 'progress-bar' }, [
      createElement('div', {
        className: 'progress-bar__fill',
        style: `width: ${((state.currentWordIndex + 1) / lesson.words.length) * 100}%`
      })
    ])
  ]);
  
  // Word display
  const wordDisplay = createElement('div', { className: 'container-sm' }, [
    createElement('div', { className: 'word-display glass', style: 'position: relative;' }, [
      // Audio Button (Absolute Top-Right)
      createElement('button', {
        className: 'btn btn-icon btn-audio',
        onclick: () => speech.speak(currentWord.word),
        'aria-label': 'Прослушать',
        title: 'Прослушать'
      }, ['🔊']),
      
      // Content
      createElement('span', { className: 'word-display__emoji' }, [currentWord.emoji || '📝']),
      createElement('div', { className: 'word-display__translation' }, [currentWord.translation]),
      createElement('div', { className: 'word-display__transcription' }, [currentWord.transcription || ''])
    ])
  ]);
  
  // Phoneme slots
  const slotsContainer = createElement('div', {
    className: 'container-sm',
    style: 'display: flex; justify-content: center; gap: 0.5rem; margin: 2rem 0;'
  });
  
  currentWord.phonemes.forEach((_, index) => {
    const slot = createElement('div', {
      className: 'phoneme-slot',
      id: `slot-${index}`,
      'aria-label': `Позиция ${index + 1}`
    });
    slotsContainer.appendChild(slot);
  });
  
  // Phoneme bank
  const phonemeBank = createElement('div', {
    className: 'container-sm',
    style: 'display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin: 2rem 0;'
  });
  
  allPhonemes.forEach((phoneme, index) => {
    const btn = createElement('button', {
      className: 'phoneme-btn',
      id: `phoneme-${index}`,
      onclick: () => selectPhoneme(phoneme, index),
      'aria-label': `Звук ${phoneme}`
    }, [phoneme]);
    phonemeBank.appendChild(btn);
  });
  
  // Auto-play audio on load (with small delay to allow UI to render)
  setTimeout(() => speech.speak(currentWord.word), 500);

  // ... (existing code for header and wordDisplay)

  // Actions container
  const actionsContainer = createElement('div', { 
    className: 'container-sm actions-container',
    style: 'display: flex; justify-content: center; gap: 1rem; margin-top: 2rem;'
  }, [
    // Clear Button
    createElement('button', {
      className: 'btn btn-secondary',
      onclick: clearPhonemes,
      'aria-label': 'Очистить'
    }, ['🗑️ Стереть']),
    
    // Check Button
    createElement('button', {
      className: 'btn btn-large btn-success',
      id: 'check-btn',
      onclick: checkAnswer,
      disabled: true
    }, ['✓ Проверить'])
  ]);
  
  // Render
  app.innerHTML = '';
  app.appendChild(header);
  app.appendChild(wordDisplay);
  app.appendChild(slotsContainer);
  app.appendChild(phonemeBank);
  app.appendChild(actionsContainer);
  
  // Clear logic
  function clearPhonemes() {
     if (state.selectedPhonemes.length === 0) return;
     
     sound.playClick();
     state.selectedPhonemes = [];
     
     // Reset slots
     document.querySelectorAll('.phoneme-slot').forEach(slot => {
       slot.textContent = '';
       slot.className = 'phoneme-slot';
     });
     
     // Enable all buttons
     document.querySelectorAll('.phoneme-btn').forEach(btn => {
       btn.disabled = false;
     });
     
     // Disable check button
     document.getElementById('check-btn').disabled = true;
  }

  // Phoneme selection logic
  function selectPhoneme(phoneme, btnIndex) {
    if (state.selectedPhonemes.length >= currentWord.phonemes.length) return;
    
    sound.playClick();
    
    const slotIndex = state.selectedPhonemes.length;
    state.selectedPhonemes.push(phoneme);
    
    // Update slot
    const slot = document.getElementById(`slot-${slotIndex}`);
    slot.textContent = phoneme;
    slot.classList.add('filled');
    
    // Disable button
    const btn = document.getElementById(`phoneme-${btnIndex}`);
    btn.disabled = true;
    
    // Enable check button when all slots filled
    if (state.selectedPhonemes.length === currentWord.phonemes.length) {
      document.getElementById('check-btn').disabled = false;
    }
    
    announce(`Выбран звук ${phoneme}`);
  }
  
  // Check answer logic
  async function checkAnswer() {
    const isCorrect = state.selectedPhonemes.join('') === currentWord.phonemes.join('');
    
    if (isCorrect) {
      sound.playSuccess();
      state.score += 10;
      state.correctAnswers++;
      
      // Animate slots
      for (let i = 0; i < currentWord.phonemes.length; i++) {
        const slot = document.getElementById(`slot-${i}`);
        await playSuccessAnimation(slot);
      }
      
      announce('Правильно! Отличная работа!');
      await wait(1000);
      
      // Next word or results
      if (state.currentWordIndex < lesson.words.length - 1) {
        state.currentWordIndex++;
        state.selectedPhonemes = [];
        renderTrainerUI(lesson, state);
      } else {
        // Save progress
        const stars = storage.calculateStars(state.score, lesson.words.length * 10);
        storage.updateLesson(lesson.id, {
          score: state.score,
          stars,
          completedWords: state.correctAnswers,
          totalWords: lesson.words.length
        });
        
        router.push(`/results?score=${state.score}&stars=${stars}&lesson=${lesson.id}`);
      }
    } else {
      sound.playError();
      
      // Animate error
      for (let i = 0; i < currentWord.phonemes.length; i++) {
        const slot = document.getElementById(`slot-${i}`);
        await playErrorAnimation(slot);
      }
      
      announce('Неправильно, попробуйте еще раз');
      
      // Reset logic is now handled by the user clearing or retrying based on error
      // But typically we clear after a short delay on error so they can try again?
      // The original code did:
      /*
      await wait(1000);
      state.selectedPhonemes = [];
      renderTrainerUI(lesson, state);
      */
      // Let's keep the manual retry or auto-reset. The original code did AUTO reset.
      // I will keep the auto-reset for error as it was before to avoid regression.
       await wait(1000);
       state.selectedPhonemes = [];
       // Re-render to reset UI
       // Note: Re-rendering also triggers auto-play audio again, which is good feedback.
       renderTrainerUI(lesson, state);
    }
  }
}

// Results Page
export function renderResults({ score, stars, lesson }) {
  const app = document.getElementById('app');
  const numStars = parseInt(stars) || 0;
  
  const messages = [
    '😢 Попробуйте еще раз!',
    '👍 Неплохо!',
    '🎉 Отлично!',
    '🌟 Превосходно!'
  ];
  
  const starsDisplay = createElement('div', { className: 'stars' });
  for (let i = 0; i < 3; i++) {
    starsDisplay.appendChild(
      createElement('span', { className: 'star' }, [i < numStars ? '⭐' : '☆'])
    );
  }
  
  const results = createElement('div', { className: 'container-sm glass results fade-in' }, [
    createElement('h1', {}, ['Урок завершен!']),
    starsDisplay,
    createElement('div', { className: 'results__score' }, [score || '0']),
    createElement('div', { className: 'results__message' }, [messages[numStars]]),
    createElement('div', { className: 'results__actions' }, [
      createElement('button', {
        className: 'btn btn-large btn-primary',
        onclick: () => router.push(`/lesson/${lesson}`)
      }, ['🔄 Повторить урок']),
      createElement('button', {
        className: 'btn btn-large btn-ghost',
        onclick: () => router.push('/')
      }, ['📚 Выбрать другой урок'])
    ])
  ]);
  
  app.innerHTML = '';
  app.appendChild(results);
}