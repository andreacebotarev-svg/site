/**
 * Trainer DOM, events and utility helpers.
 */

Trainer.prototype._cacheDOMElements = function () {
  this._dom = {
    questionContainer: document.getElementById('question-container'),
    score: document.getElementById('score'),
    streak: document.getElementById('streak'),
    lives: document.getElementById('lives'),
    timer: document.getElementById('timer')
  };
};

Trainer.prototype._attachEventListeners = function () {
  window.addEventListener('resize', this._handleResize);
  document.addEventListener('visibilitychange', this._handleVisibilityChange);
};

Trainer.prototype._handleResize = function () {
  clearTimeout(this._resizeDebounce);
  this._resizeDebounce = setTimeout(() => {
    this.emit('resize');
  }, 150);
};

Trainer.prototype._handleVisibilityChange = function () {
  if (document.hidden && this.state.phase === 'PLAYING') {
    this.pause();
  }
};

Trainer.prototype.on = function (event, callback) {
  if (!this._listeners[event]) this._listeners[event] = [];
  this._listeners[event].push(callback);
};

Trainer.prototype.off = function (event, callback) {
  if (!this._listeners[event]) return;
  this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
};

Trainer.prototype.emit = function (event, data) {
  if (!this._listeners[event]) return;
  this._listeners[event].forEach(callback => {
    try {
      callback(data);
    } catch (error) {
      window.debugTrainer && window.debugTrainer(error);
    }
  });
};

Trainer.prototype._validateQuestion = function (question) {
  return question &&
    typeof question.question === 'string' &&
    Array.isArray(question.options) &&
    question.options.length > 0 &&
    typeof question.correctIndex === 'number' &&
    question.correctIndex >= 0 &&
    question.correctIndex < question.options.length;
};

Trainer.prototype._escapeHTML = function (text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

Trainer.prototype._delay = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};
