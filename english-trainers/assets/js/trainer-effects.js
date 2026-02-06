/**
 * Trainer visual effects & motivational system.
 */

Trainer.prototype._getMotivationalPraise = function () {
  const { streak, questionsAnswered, correctAnswers } = this.state;
  const accuracy = correctAnswers / questionsAnswered;

  let category;
  if (streak >= 5) {
    category = 'streak';
  } else if (accuracy >= 0.85 && questionsAnswered >= 3) {
    category = 'accuracy';
  } else {
    category = 'random';
  }

  const phrases = this._motivationalPhrases[category];
  return phrases[Math.floor(Math.random() * phrases.length)];
};

Trainer.prototype._triggerSuccessEffects = function (streak) {
  const container = this._dom.questionContainer;
  if (!container) return;

  container.classList.add('correct-flash');
  setTimeout(() => container.classList.remove('correct-flash'), 500);

  if (streak === 5 || streak === 10 || streak === 15) {
    this._launchConfetti();
  }

  if (streak >= 3) {
    this._createParticleBurst();
  }
};

Trainer.prototype._launchConfetti = function () {
  const colors = ['#0A84FF', '#30D158', '#FFD60A', '#FF375F', '#BF5AF2'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.3 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 3000);
  }
};

Trainer.prototype._createParticleBurst = function () {
  const container = this._dom.questionContainer;
  if (!container) return;

  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.setProperty('--angle', (360 / particleCount) * i + 'deg');
    container.appendChild(particle);

    setTimeout(() => particle.remove(), 600);
  }
};

Trainer.prototype._injectEffectsCSS = function () {
  if (document.getElementById('trainer-effects-css')) return;

  const style = document.createElement('style');
  style.id = 'trainer-effects-css';
  style.textContent = `
    @keyframes correctFlash {
      0% { box-shadow: 0 0 0 rgba(48, 209, 88, 0); }
      50% { box-shadow: 0 0 30px rgba(48, 209, 88, 0.8); }
      100% { box-shadow: 0 0 0 rgba(48, 209, 88, 0); }
    }
    .correct-flash {
      animation: correctFlash 0.5s ease-out;
    }

    @keyframes confettiFall {
      to {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
    .confetti {
      position: fixed;
      width: 8px;
      height: 8px;
      top: -10px;
      z-index: 9999;
      animation: confettiFall linear forwards;
    }

    @keyframes particleBurst {
      0% {
        transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) rotate(var(--angle)) translateY(50px) scale(0);
        opacity: 0;
      }
    }
    .particle {
      position: absolute;
      width: 6px;
      height: 6px;
      background: #FFD60A;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      animation: particleBurst 0.6s ease-out forwards;
    }
  `;
  document.head.appendChild(style);
};
