/**
 * @fileoverview OmniDebugger - Lightweight debugging system for book loading and critical errors
 * @module OmniDebugger
 * @description Optimized debugging system that monitors book operations and critical errors only
 */

export class OmniDebugger {
    constructor(options = {}) {
        this.enabled = options.enabled !== false;
        this.logHistory = []; // Храним историю в памяти (для экспорта)
        this.maxHistory = 100; // Уменьшили с 1000 до 100 для экономии памяти

        // Система контроля багов
        this.bugs = new Map(); // id -> bug object
        this.bugCounter = 0;
        this.bugStorageKey = 'omnidebugger_bugs';

        // Настройки цветов для консоли
        this.styles = {
            error: 'color: #ffffff; background: #ff0000; font-weight: bold; padding: 4px; border-radius: 3px;',
            book: 'color: #ffa500; background: #332200; padding: 2px 5px; border-radius: 3px;',
            state: 'color: #ff99ff; font-weight: bold; background: #330033; padding: 2px 5px; border-radius: 3px;',
            network: 'color: #00ccff; font-weight: bold; background: #001f33; padding: 2px 5px; border-radius: 3px;',
            bug: 'color: #ffffff; background: #dc3545; font-weight: bold; padding: 2px 5px; border-radius: 3px;',
            warning: 'color: #000000; background: #ffc107; font-weight: bold; padding: 2px 5px; border-radius: 3px;'
        };

        if (this.enabled) {
            this.init();
            this.loadBugsFromStorage();
            // Делаем доступным глобально для других модулей
            if (typeof window !== 'undefined') {
                window.omniDebugger = this;
            }
        }
    }

    init() {
        this._log('SYSTEM', '🔍 OmniDebugger: Monitoring book operations, errors, and bugs');

        // Только критически важные наблюдатели
        this._spyOnErrors();           // Глобальный перехват ошибок
        this._spyOnNetworkErrors();    // Только сетевые ошибки

        // Инициализация системы багов
        this._setupBugCommands();
    }

    /**
     * Перехват ошибок - критично для отладки
     */
    _spyOnErrors() {
        // Обычные ошибки JS
        window.addEventListener('error', (event) => {
            this._error('🔥 CRASH', `${event.message} at ${event.filename}:${event.lineno}`);

            // Автоматически регистрируем баг
            this.reportBugFromError(event.error || new Error(event.message), {
                source: 'window.onerror',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Ошибки Promise (async/await)
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
            this._error('☠️ PROMISE FAIL', error.message);

            // Автоматически регистрируем баг
            this.reportBugFromError(error, {
                source: 'unhandledrejection',
                originalReason: event.reason
            });
        });
    }

    /**
     * Перехват только сетевых ошибок - для отладки загрузки книг
     */
    _spyOnNetworkErrors() {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [resource] = args;

            try {
                const response = await originalFetch(...args);
                // Логируем только ошибки
                if (!response.ok) {
                    this._error('❌ NETWORK ERR', `${response.status} ${resource}`);
                }
                return response;
            } catch (error) {
                // Не логируем AbortError - это нормальная отмена запроса
                if (error.name !== 'AbortError') {
                    this._error('❌ NETWORK ERR', `${error.message} for ${resource}`);
                }
                throw error;
            }
        };
    }

    /**
     * Внутренний метод логирования (упрощенный)
     */
    _log(type, message, data = null) {
        this._addToHistory('INFO', type, message, data);

        const style = type.includes('BOOK') ? this.styles.book :
                     type.includes('STATE') ? this.styles.state :
                     this.styles.network;

        if (data) {
            console.log(`%c${type}%c ${message}`, style, 'color: gray', data);
        } else {
            console.log(`%c${type}%c ${message}`, style, 'color: gray');
        }
    }

    _error(type, message) {
        this._addToHistory('ERROR', type, message);
        console.log(`%c${type}%c ${message}`, this.styles.error, 'color: red');
    }

    _addToHistory(level, type, msg, data) {
        this.logHistory.push({
            time: Date.now(),
            level,
            type,
            msg,
            data
        });
        if (this.logHistory.length > this.maxHistory) this.logHistory.shift();
    }


    /**
     * Методы для отладки книг (оптимизированные)
     */
    logBookEvent(event, bookId, details = {}) {
        this._log('📖 BOOK', `${event}: ${bookId}`, details);
    }

    logBookError(bookId, error, context = '') {
        this._error('📕 BOOK ERR', `${bookId} ${context}: ${error.message}`);

        // Автоматически регистрируем баг для ошибок книг
        this.reportBugFromError(error, {
            source: 'book_operation',
            bookId,
            context,
            operation: 'book_loading'
        });
    }

    logBookProgress(bookId, stage, progress = {}) {
        // Логируем только важные этапы, чтобы не перегружать
        if (stage.includes('Start') || stage.includes('Error') || stage.includes('Complete')) {
            this._log('📚 BOOK', `${stage}: ${bookId}`, progress);
        }
    }

    logBookPerformance(bookId, operation, duration, details = {}) {
        // Логируем только медленные операции (>100ms)
        if (duration > 100) {
            this._log('⚡ BOOK PERF', `${operation} ${bookId}: ${duration.toFixed(0)}ms`, details);
        }
    }

    /**
     * Экспорт логов в файл (для отправки разработчику)
     */
    downloadLogs() {
        const blob = new Blob([JSON.stringify(this.logHistory, null, 2)], {type : 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ===== СИСТЕМА КОНТРОЛЯ БАГОВ =====

    /**
     * Регистрация нового бага
     */
    reportBug(title, description, severity = 'medium', context = {}) {
        const bugId = ++this.bugCounter;
        const bug = {
            id: bugId,
            title,
            description,
            severity, // 'low', 'medium', 'high', 'critical'
            status: 'open', // 'open', 'investigating', 'fixing', 'closed'
            context,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            events: [], // Связанные события/ошибки
            tags: [],
            assignedTo: null,
            comments: []
        };

        this.bugs.set(bugId, bug);
        this.saveBugsToStorage();

        this._log('🐛 BUG', `Reported: ${title} (ID: ${bugId})`, { severity, context });

        // Создаем связанное событие в истории
        this._addToHistory('BUG', 'NEW_BUG', `Bug #${bugId} reported: ${title}`, {
            bugId, title, description, severity, context
        });

        return bugId;
    }

    /**
     * Автоматическая регистрация бага из ошибки
     */
    reportBugFromError(error, context = {}) {
        const title = `Auto-reported: ${error.name || 'Error'}`;
        const description = error.message || error.toString();
        const severity = this._determineSeverityFromError(error);

        const bugId = this.reportBug(title, description, severity, {
            ...context,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                filename: error.filename,
                lineno: error.lineno
            }
        });

        // Автоматически добавляем событие в баг
        this.addBugEvent(bugId, 'ERROR_OCCURRED', {
            error: error.message,
            context
        });

        return bugId;
    }

    /**
     * Обновление статуса бага
     */
    updateBugStatus(bugId, status, comment = '') {
        const bug = this.bugs.get(bugId);
        if (!bug) {
            this._error('🐛 BUG ERR', `Bug #${bugId} not found`);
            return false;
        }

        const oldStatus = bug.status;
        bug.status = status;
        bug.updatedAt = Date.now();

        if (comment) {
            this.addBugComment(bugId, `Status changed: ${oldStatus} → ${status}`, comment);
        }

        this.saveBugsToStorage();

        this._log('🐛 BUG', `Bug #${bugId} status: ${oldStatus} → ${status}`);

        // Создаем событие в истории
        this._addToHistory('BUG', 'STATUS_UPDATE', `Bug #${bugId} status changed`, {
            bugId, oldStatus, newStatus: status, comment
        });

        return true;
    }

    /**
     * Добавление события к багу
     */
    addBugEvent(bugId, eventType, data = {}) {
        const bug = this.bugs.get(bugId);
        if (!bug) return false;

        const event = {
            type: eventType,
            data,
            timestamp: Date.now()
        };

        bug.events.push(event);
        bug.updatedAt = Date.now();

        // Ограничиваем количество событий на баг
        if (bug.events.length > 50) {
            bug.events = bug.events.slice(-50);
        }

        this.saveBugsToStorage();
        return true;
    }

    /**
     * Добавление комментария к багу
     */
    addBugComment(bugId, author, comment) {
        const bug = this.bugs.get(bugId);
        if (!bug) return false;

        bug.comments.push({
            author,
            comment,
            timestamp: Date.now()
        });

        bug.updatedAt = Date.now();
        this.saveBugsToStorage();
        return true;
    }

    /**
     * Добавление тегов к багу
     */
    addBugTags(bugId, tags) {
        const bug = this.bugs.get(bugId);
        if (!bug) return false;

        const tagArray = Array.isArray(tags) ? tags : [tags];
        bug.tags.push(...tagArray);
        // Убираем дубликаты
        bug.tags = [...new Set(bug.tags)];
        bug.updatedAt = Date.now();

        this.saveBugsToStorage();
        return true;
    }

    /**
     * Получение бага по ID
     */
    getBug(bugId) {
        return this.bugs.get(bugId) || null;
    }

    /**
     * Получение всех багов с фильтрацией
     */
    getBugs(filter = {}) {
        let bugs = Array.from(this.bugs.values());

        if (filter.status) {
            bugs = bugs.filter(bug => bug.status === filter.status);
        }

        if (filter.severity) {
            bugs = bugs.filter(bug => bug.severity === filter.severity);
        }

        if (filter.tags) {
            const tagFilter = Array.isArray(filter.tags) ? filter.tags : [filter.tags];
            bugs = bugs.filter(bug => tagFilter.some(tag => bug.tags.includes(tag)));
        }

        // Сортировка по дате обновления (новые сверху)
        bugs.sort((a, b) => b.updatedAt - a.updatedAt);

        return bugs;
    }

    /**
     * Получение статистики багов
     */
    getBugStats() {
        const bugs = Array.from(this.bugs.values());
        const stats = {
            total: bugs.length,
            byStatus: {},
            bySeverity: {},
            recent: bugs.filter(bug => bug.createdAt > Date.now() - 7*24*60*60*1000).length,
            open: bugs.filter(bug => bug.status === 'open').length
        };

        bugs.forEach(bug => {
            stats.byStatus[bug.status] = (stats.byStatus[bug.status] || 0) + 1;
            stats.bySeverity[bug.severity] = (stats.bySeverity[bug.severity] || 0) + 1;
        });

        return stats;
    }

    /**
     * Удаление бага
     */
    deleteBug(bugId) {
        if (this.bugs.delete(bugId)) {
            this.saveBugsToStorage();
            this._log('🐛 BUG', `Bug #${bugId} deleted`);
            return true;
        }
        return false;
    }

    /**
     * Сохранение багов в localStorage
     */
    saveBugsToStorage() {
        try {
            const bugsData = Array.from(this.bugs.entries());
            localStorage.setItem(this.bugStorageKey, JSON.stringify(bugsData));
        } catch (error) {
            this._error('🐛 BUG STORAGE', `Failed to save bugs: ${error.message}`);
        }
    }

    /**
     * Загрузка багов из localStorage
     */
    loadBugsFromStorage() {
        try {
            const stored = localStorage.getItem(this.bugStorageKey);
            if (stored) {
                const bugsData = JSON.parse(stored);
                this.bugs = new Map(bugsData);
                // Обновляем счетчик
                const maxId = Math.max(...Array.from(this.bugs.keys()), 0);
                this.bugCounter = maxId;
                this._log('🐛 BUG', `Loaded ${this.bugs.size} bugs from storage`);
            }
        } catch (error) {
            this._error('🐛 BUG STORAGE', `Failed to load bugs: ${error.message}`);
        }
    }

    /**
     * Экспорт багов в файл
     */
    downloadBugs() {
        const bugsData = Array.from(this.bugs.values());
        const blob = new Blob([JSON.stringify(bugsData, null, 2)], {type : 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bugs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Определение severity из ошибки
     */
    _determineSeverityFromError(error) {
        const message = error.message || '';
        const stack = error.stack || '';

        if (message.includes('TypeError') || message.includes('ReferenceError')) {
            return 'high';
        }

        if (message.includes('Network') || message.includes('fetch')) {
            return 'medium';
        }

        if (stack.includes('Promise') || message.includes('Unhandled')) {
            return 'high';
        }

        return 'medium';
    }

    /**
     * Настройка консольных команд для управления багами
     */
    _setupBugCommands() {
        if (typeof window === 'undefined') return;

        // Добавляем команды в window для консольного доступа
        window.bug = {
            report: (title, desc, sev) => this.reportBug(title, desc, sev),
            list: (filter) => console.table(this.getBugs(filter)),
            status: (id, status, comment) => this.updateBugStatus(id, status, comment),
            get: (id) => console.log(this.getBug(id)),
            stats: () => console.log(this.getBugStats()),
            delete: (id) => this.deleteBug(id),
            export: () => this.downloadBugs(),
            help: () => {
                console.log('%c🐛 Bug Commands:', 'font-weight: bold');
                console.log('  bug.report(title, desc, severity) - Report new bug');
                console.log('  bug.list({status, severity, tags}) - List bugs with filter');
                console.log('  bug.status(id, status, comment) - Update bug status');
                console.log('  bug.get(id) - Get bug details');
                console.log('  bug.stats() - Show bug statistics');
                console.log('  bug.delete(id) - Delete bug');
                console.log('  bug.export() - Download bugs as JSON');
            }
        };

        // Автоматическая регистрация багов из ошибок
        const originalError = console.error;
        console.error = (...args) => {
            originalError.apply(console, args);

            // Пытаемся создать баг из консольной ошибки
            const message = args.join(' ');
            if (message.includes('Error') || message.includes('Exception')) {
                this.reportBug('Console Error', message, 'medium', {
                    source: 'console.error',
                    args
                });
            }
        };

        this._log('🐛 BUG', 'Bug control system initialized. Type bug.help() for commands');
    }
}
