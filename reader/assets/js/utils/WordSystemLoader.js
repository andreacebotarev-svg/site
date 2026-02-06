// reader/assets/js/utils/WordSystemLoader.js

export class WordSystemLoader {
  static async start(duration = 12000) {
    return new Promise((resolve) => {
      // Check if already running or completed in this session
      if (window._wordSystemReady) {
        resolve();
        return;
      }

      console.log('📚 Starting Word System Preloader...');

      const loader = document.createElement('div');
      loader.id = 'word-system-loader';
      loader.className = 'word-system-loader';
      loader.innerHTML = `
        <div class="loader-content">
          <div class="loader-icon">📚</div>
          <div class="loader-text">
            <div class="loader-title">Подготовка словаря</div>
            <div class="loader-subtitle">Загрузка интерактивных слов...</div>
          </div>
          <div class="loader-progress">
            <div class="progress-bar">
              <div class="progress-fill" id="word-loader-progress"></div>
            </div>
            <div class="progress-percentage">0%</div>
          </div>
        </div>
      `;

      // Add styles dynamically if not present
      if (!document.getElementById('word-loader-styles')) {
        const style = document.createElement('style');
        style.id = 'word-loader-styles';
        style.textContent = `
          .word-system-loader {
            position: fixed;
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-primary, white);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            padding: 20px 28px;
            z-index: 10001;
            min-width: 320px;
            animation: slideDown 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            border: 1px solid var(--separator-color, rgba(0,0,0,0.1));
          }
          .loader-content { display: flex; flex-direction: column; gap: 16px; }
          .loader-icon { font-size: 32px; text-align: center; animation: pulse 2s infinite; }
          .loader-text { text-align: center; }
          .loader-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; color: var(--text-primary, #000); }
          .loader-subtitle { font-size: 13px; color: var(--text-secondary, #666); }
          .loader-progress { width: 100%; }
          .progress-bar { height: 6px; background: var(--bg-secondary, #f0f0f0); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
          .progress-fill { height: 100%; background: var(--apple-blue, #007AFF); border-radius: 3px; transition: width 0.1s linear; width: 0%; }
          .progress-percentage { font-size: 11px; color: var(--text-tertiary, #999); text-align: center; }

          .word-ready-notification {
            position: fixed;
            top: 70px;
            right: 20px;
            background: var(--apple-green, #34C759);
            color: white;
            border-radius: 16px;
            padding: 16px 24px;
            z-index: 10002;
            box-shadow: 0 8px 24px rgba(52, 199, 89, 0.3);
            animation: slideInRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            display: flex; align-items: center; gap: 12px;
          }
          .push-icon { font-size: 24px; }
          .push-title { font-weight: 600; font-size: 15px; }
          .push-subtitle { font-size: 13px; opacity: 0.9; }
          .push-close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; opacity: 0.8; }

          @keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
          @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(loader);

      // ✅ ШАГ 4: Preload dependencies while waiting
      try {
        console.log('📦 Importing ContextExtractor...');
        await import('../../utils/context-extractor.js');
        console.log('✅ ContextExtractor imported');

        console.log('📦 Importing contextTranslationService...');
        await import('../../services/context-translation-service.js');
        console.log('✅ contextTranslationService imported');
      } catch (error) {
        console.error('❌ Failed to preload word system dependencies:', error);
      }

      // Animate progress
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);

        const fill = document.getElementById('word-loader-progress');
        const text = loader.querySelector('.progress-percentage');

        if (fill) fill.style.width = `${progress}%`;
        if (text) text.textContent = `${Math.round(progress)}%`;

        if (progress >= 100) {
          clearInterval(interval);
          loader.style.opacity = '0';
          setTimeout(() => {
            loader.remove();
            WordSystemLoader.showSuccess();
            window._wordSystemReady = true;
            resolve();
          }, 300);
        }
      }, 100);
    });
  }

  static showSuccess() {
    const note = document.createElement('div');
    note.className = 'word-ready-notification';
    note.innerHTML = `
      <div class="push-icon">✅</div>
      <div class="push-text">
        <div class="push-title">Словарь готов!</div>
        <div class="push-subtitle">Теперь можно нажимать на слова</div>
      </div>
      <button class="push-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(note);
    setTimeout(() => {
      note.style.opacity = '0';
      note.style.transform = 'translateX(100%)';
      note.style.transition = 'all 0.3s ease';
      setTimeout(() => note.remove(), 300);
    }, 5000);
  }
}
