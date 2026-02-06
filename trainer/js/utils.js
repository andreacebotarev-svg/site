// Utility functions and helpers

// Shuffle array using Fisher-Yates algorithm
export function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate random distractors (phonemes that are not in the word)
export function generateDistractors(correctPhonemes, allPhonemes, count = 3) {
  const available = allPhonemes.filter(p => !correctPhonemes.includes(p));
  return shuffle(available).slice(0, count);
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Wait for specified milliseconds
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Animate element with custom animation
export function animate(element, animation, duration = 300) {
  return new Promise(resolve => {
    element.style.animation = `${animation} ${duration}ms`;
    
    function handleAnimationEnd() {
      element.style.animation = '';
      element.removeEventListener('animationend', handleAnimationEnd);
      resolve();
    }
    
    element.addEventListener('animationend', handleAnimationEnd);
  });
}

// Play success animation
export async function playSuccessAnimation(element) {
  element.classList.add('correct');
  await wait(600);
  element.classList.remove('correct');
}

// Play error animation
export async function playErrorAnimation(element) {
  element.classList.add('error');
  await wait(600);
  element.classList.remove('error');
}

// Format time (seconds to MM:SS)
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format number with thousands separator
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Create DOM element with attributes
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on')) {
      const event = key.slice(2).toLowerCase();
      element.addEventListener(event, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  
  return element;
}

// Get random item from array
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Clamp number between min and max
export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

// Check if device is mobile
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if device supports touch
export function hasTouch() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Preload images
export function preloadImages(urls) {
  return Promise.all(
    urls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = reject;
        img.src = url;
      });
    })
  );
}

// Announce to screen readers
export function announce(message, priority = 'polite') {
  const announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', priority);
  announcer.className = 'sr-only';
  announcer.textContent = message;
  
  document.body.appendChild(announcer);
  setTimeout(() => document.body.removeChild(announcer), 1000);
}

// Sound effects (optional - using Web Audio API)
export class SoundManager {
  constructor() {
    this.context = null;
    this.enabled = true;
  }
  
  init() {
    if (!this.context && window.AudioContext) {
      this.context = new AudioContext();
    }
  }
  
  // Play success sound
  playSuccess() {
    if (!this.enabled || !this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.frequency.value = 523.25; // C5
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.3);
  }
  
  // Play error sound
  playError() {
    if (!this.enabled || !this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.frequency.value = 200; // Lower frequency
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.2, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.2);
  }
  
  // Play click sound
  playClick() {
    if (!this.enabled || !this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.05);
  }
  
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

// Text-to-Speech (TTS)
export const speech = {
  voice: null,
  
  init() {
    if (!window.speechSynthesis) return;
    
    // Load voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer Google US English, then any US English, then any English
      this.voice = voices.find(v => v.name.includes('Google US English')) ||
                   voices.find(v => v.lang === 'en-US') ||
                   voices.find(v => v.lang.startsWith('en'));
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  },
  
  speak(text) {
    if (!window.speechSynthesis) return;
    
    // Cancel current speaking
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8; // Slightly slower for learning
    utterance.pitch = 1;
    if (this.voice) {
      utterance.voice = this.voice;
    }
    
    window.speechSynthesis.speak(utterance);
  }
};

// Initialize speech
speech.init();

export const sound = new SoundManager();