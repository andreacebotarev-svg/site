/**
 * Utility Functions
 */

// Shuffle array
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Sleep/delay
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Animate element
export function animate(element, keyframes, options) {
  return element.animate(keyframes, options).finished;
}

// Success animation
export async function animateSuccess(element) {
  await animate(element, [
    { transform: 'scale(1)', backgroundColor: 'rgba(16, 185, 129, 0.2)' },
    { transform: 'scale(1.05)', backgroundColor: 'rgba(16, 185, 129, 0.4)' },
    { transform: 'scale(1)', backgroundColor: 'rgba(16, 185, 129, 0.2)' }
  ], {
    duration: 600,
    easing: 'ease-out'
  });
}

// Error animation
export async function animateError(element) {
  await animate(element, [
    { transform: 'translateX(0)', backgroundColor: 'rgba(239, 68, 68, 0.2)' },
    { transform: 'translateX(-10px)', backgroundColor: 'rgba(239, 68, 68, 0.4)' },
    { transform: 'translateX(10px)', backgroundColor: 'rgba(239, 68, 68, 0.4)' },
    { transform: 'translateX(-10px)', backgroundColor: 'rgba(239, 68, 68, 0.4)' },
    { transform: 'translateX(0)', backgroundColor: 'rgba(239, 68, 68, 0.2)' }
  ], {
    duration: 500,
    easing: 'ease-out'
  });
}

// Load JSON
export async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

// Create element with attributes
export function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key.startsWith('on')) {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  }
  
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  
  return element;
}
