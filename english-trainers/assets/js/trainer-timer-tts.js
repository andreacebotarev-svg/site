/**
 * Trainer timer & Text-to-Speech utilities.
 */

Trainer.prototype._startTimer = function () {
  this._stopTimer();
  this._timerInterval = setInterval(() => {
    const newTime = this.state.timeRemaining - 1;

    if (newTime <= 0) {
      this._stopTimer();
      this.submitAnswer(-1);
    } else {
      this._setState({ timeRemaining: newTime });
      this._scheduleUpdate('timer');
    }
  }, 1000);
};

Trainer.prototype._stopTimer = function () {
  if (this._timerInterval) {
    clearInterval(this._timerInterval);
    this._timerInterval = null;
  }
};

Trainer.prototype._speakQuestion = function (questionText) {
  if (!this._tts || !this.config.enableTTS) return;

  const cleanText = questionText
    .replace(/<[^>]*>/g, '')
    .replace(/____/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  this._tts.speak(utterance);
};

Trainer.prototype._stopTTS = function () {
  if (this._tts) {
    this._tts.cancel();
  }
};
