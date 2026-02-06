/**
 * LessonDebugger - Система отладки для English Lessons
 * Вся информация выводится в консоль браузера (F12)
 */

class LessonDebugger {
  constructor() {
    this.logs = [];
    this.errors = [];
    this.warnings = [];
    this.maxLogs = 500;
    this._loggingInProgress = false;
    
    // Сохраняем нативный консоль ДО подмены
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      group: console.group ? console.group.bind(console) : console.log.bind(console),
      groupEnd: console.groupEnd ? console.groupEnd.bind(console) : (() => {}),
      groupCollapsed: console.groupCollapsed ? console.groupCollapsed.bind(console) : console.log.bind(console)
    };
    
    this.init();
  }

  init() {
    this.interceptConsole();
    this.interceptFetch();
    this.interceptErrors();
    
    this.originalConsole.log(
      '%c🐛 Lesson Debugger Active',
      'color:#00ff00;font-size:16px;font-weight:bold;background:#000;padding:4px 8px;border-radius:4px;'
    );
    this.originalConsole.log(
      '%cℹ️ All debug info is logged to console (F12)',
      'color:#00aaff;font-size:12px;'
    );
    this.log('🐛 Debug Mode Active', 'system');
  }

  // ============================================
  // Логирование
  // ============================================
  
  log(message, type = 'info', meta = {}) {
    // Защита от рекурсии
    if (this._loggingInProgress) return;
    
    this._loggingInProgress = true;
    
    try {
      const entry = {
        timestamp: new Date().toISOString(),
        message,
        type,
        meta
      };
      
      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) this.logs.shift();
      
      if (type === 'error') this.errors.push(entry);
      if (type === 'warn') this.warnings.push(entry);
      
      // Вывод в консоль с красивым форматированием
      const styles = {
        info: 'color:#00aaff',
        warn: 'color:#ffaa00',
        error: 'color:#ff0000;font-weight:bold',
        success: 'color:#00ff00',
        system: 'color:#ff00ff'
      };
      
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const method = type === 'error' ? 'error' : type === 'warn' ? 'warn' : 'log';
      
      if (Object.keys(meta).length > 0) {
        this.originalConsole[method](
          `%c[${time}] [Debugger:${type.toUpperCase()}]%c ${message}`,
          styles[type] || 'color:#888',
          'color:inherit',
          meta
        );
      } else {
        this.originalConsole[method](
          `%c[${time}] [Debugger:${type.toUpperCase()}]%c ${message}`,
          styles[type] || 'color:#888',
          'color:inherit'
        );
      }
    } finally {
      this._loggingInProgress = false;
    }
  }

  // ============================================
  // Перехватчики
  // ============================================
  
  interceptConsole() {
    const self = this;
    
    // Не перехватываем консоль - пусть всё идёт напрямую в DevTools
    // Только логируем в наш массив для валидации
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = function(...args) {
      self.logs.push({
        timestamp: new Date().toISOString(),
        message: args.join(' '),
        type: 'info',
        meta: {}
      });
      originalLog.apply(console, args);
    };
    
    console.warn = function(...args) {
      self.warnings.push({
        timestamp: new Date().toISOString(),
        message: args.join(' '),
        type: 'warn',
        meta: {}
      });
      originalWarn.apply(console, args);
    };
    
    console.error = function(...args) {
      self.errors.push({
        timestamp: new Date().toISOString(),
        message: args.join(' '),
        type: 'error',
        meta: {}
      });
      originalError.apply(console, args);
    };
  }

  interceptFetch() {
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = async function(...args) {
      const url = args[0];
      const startTime = performance.now();
      
      self.log(`📡 Fetching: ${url}`, 'info');
      
      try {
        const response = await originalFetch.apply(this, args);
        const duration = (performance.now() - startTime).toFixed(2);
        
        if (response.ok) {
          self.log(`✅ Fetch OK: ${url} (${duration}ms)`, 'success', {
            status: response.status,
            duration: `${duration}ms`
          });
        } else {
          self.log(`❌ Fetch Failed: ${url} - ${response.status}`, 'error', {
            status: response.status,
            statusText: response.statusText,
            duration: `${duration}ms`
          });
        }
        
        return response;
      } catch (error) {
        const duration = (performance.now() - startTime).toFixed(2);
        self.log(`💥 Fetch Error: ${url} - ${error.message}`, 'error', {
          error: error.message,
          duration: `${duration}ms`
        });
        throw error;
      }
    };
  }

  interceptErrors() {
    window.addEventListener('error', (event) => {
      this.log(`💥 Global Error: ${event.message}`, 'error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.log(`💥 Unhandled Promise Rejection: ${event.reason}`, 'error', {
        reason: event.reason
      });
    });
  }

  // ============================================
  // Валидация
  // ============================================
  
  async validateLesson() {
    this.originalConsole.group('🔍 Lesson Validation');
    this.log('🔍 Starting lesson validation...', 'system');
    
    const engine = window.lessonEngine;
    if (!engine) {
      this.log('❌ LessonEngine not found', 'error');
      this.originalConsole.groupEnd();
      return;
    }
    
    const results = {
      lessonData: this.validateLessonData(engine.lessonData),
      dom: this.validateDOM(),
      storage: this.validateStorage(),
      tts: this.validateTTS()
    };
    
    const allPassed = Object.values(results).every(r => r.passed);
    
    // Вывод результатов в консоль
    Object.entries(results).forEach(([name, result]) => {
      const icon = result.passed ? '✅' : '❌';
      this.originalConsole.groupCollapsed(`${icon} ${name.toUpperCase()}`);
      result.checks.forEach(check => {
        const checkIcon = check.passed ? '✅' : '❌';
        const msg = `${checkIcon} ${check.name}`;
        if (check.error) {
          this.originalConsole.error(msg, check.error);
        } else if (check.value !== undefined) {
          this.originalConsole.log(msg, check.value);
        } else {
          this.originalConsole.log(msg);
        }
      });
      this.originalConsole.groupEnd();
    });
    
    this.log(
      allPassed ? '✅ All validations passed' : '⚠️ Some validations failed',
      allPassed ? 'success' : 'warn',
      results
    );
    
    this.originalConsole.groupEnd();
    return results;
  }

  validateLessonData(data) {
    const checks = [];
    
    if (!data) {
      checks.push({ name: 'Data exists', passed: false, error: 'lessonData is null' });
      return { passed: false, checks };
    }
    
    checks.push({ name: 'Data exists', passed: true });
    checks.push({ name: 'Has title', passed: !!data.title });
    checks.push({ name: 'Has subtitle', passed: !!data.subtitle });
    checks.push({ name: 'Has meta', passed: !!data.meta });
    checks.push({ name: 'Has content', passed: !!data.content });
    checks.push({ name: 'Has reading', passed: !!data.content?.reading?.length });
    checks.push({ name: 'Has vocabulary', passed: !!data.vocabulary?.words?.length });
    checks.push({ name: 'Has grammar', passed: !!data.grammar });
    checks.push({ name: 'Has quiz', passed: !!data.quiz?.length });
    
    if (data.vocabulary?.words) {
      const word = data.vocabulary.words[0];
      checks.push({
        name: 'Vocabulary structure',
        passed: !!(word?.en && word?.ru && word?.transcription),
        error: !word ? 'No words' : 'Missing required fields'
      });
    }
    
    const passed = checks.every(c => c.passed);
    return { passed, checks };
  }

  validateDOM() {
    const checks = [
      { name: 'App root exists', passed: !!document.getElementById('app-root') },
      { name: 'App container exists', passed: !!document.getElementById('app') },
      { name: 'Loader exists', passed: !!document.getElementById('loader') },
      { name: 'Notification exists', passed: !!document.getElementById('notification') }
    ];
    
    return { passed: checks.every(c => c.passed), checks };
  }

  validateStorage() {
    const checks = [];
    
    try {
      const engine = window.lessonEngine;
      const storage = engine?.storage;
      
      checks.push({ name: 'Storage exists', passed: !!storage });
      
      if (storage) {
        const count = storage.getCount();
        checks.push({ name: 'Can read count', passed: true, value: count });
        
        try {
          localStorage.setItem('__test__', 'test');
          localStorage.removeItem('__test__');
          checks.push({ name: 'Can write', passed: true });
        } catch (e) {
          checks.push({ name: 'Can write', passed: false, error: e.message });
        }
      }
    } catch (e) {
      checks.push({ name: 'Storage check', passed: false, error: e.message });
    }
    
    return { passed: checks.every(c => c.passed), checks };
  }

  validateTTS() {
    const checks = [];
    
    try {
      const engine = window.lessonEngine;
      const tts = engine?.tts;
      
      checks.push({ name: 'TTS exists', passed: !!tts });
      checks.push({ name: 'Audio supported', passed: !!window.Audio });
      
      if (tts) {
        const testUrl = tts.getAudioUrl?.('test', 'en');
        checks.push({
          name: 'TTS URL generation',
          passed: !!testUrl && testUrl.includes('translate.google.com'),
          value: testUrl
        });
      }
    } catch (e) {
      checks.push({ name: 'TTS check', passed: false, error: e.message });
    }
    
    return { passed: checks.every(c => c.passed), checks };
  }

  // ============================================
  // Утилиты
  // ============================================
  
  getStats() {
    return {
      totalLogs: this.logs.length,
      errors: this.errors.length,
      warnings: this.warnings.length,
      logs: this.logs
    };
  }
  
  printStats() {
    const stats = this.getStats();
    this.originalConsole.group('📊 Debugger Statistics');
    this.originalConsole.log('Total Logs:', stats.totalLogs);
    this.originalConsole.log('Errors:', stats.errors);
    this.originalConsole.log('Warnings:', stats.warnings);
    this.originalConsole.groupEnd();
    return stats;
  }

  exportLogs() {
    const data = {
      exported: new Date().toISOString(),
      stats: this.getStats(),
      logs: this.logs,
      errors: this.errors,
      warnings: this.warnings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-debug-${Date.now()}.json`;
    a.click();
    
    this.log('📥 Logs exported', 'success');
  }
}

// Автоматическая инициализация
if (typeof window !== 'undefined') {
  window.lessonDebugger = new LessonDebugger();
  
  // Добавляем удобные команды в глобальную область видимости
  window.debugValidate = () => window.lessonDebugger.validateLesson();
  window.debugStats = () => window.lessonDebugger.printStats();
  window.debugExport = () => window.lessonDebugger.exportLogs();
  
  console.log('%c🛠️ Debug Commands Available:', 'color:#00aaff;font-weight:bold;');
  console.log('%c  debugValidate()%c - Validate lesson data', 'color:#00ff00', 'color:#888');
  console.log('%c  debugStats()%c - Show statistics', 'color:#00ff00', 'color:#888');
  console.log('%c  debugExport()%c - Export logs to JSON', 'color:#00ff00', 'color:#888');
}
