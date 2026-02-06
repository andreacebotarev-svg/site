/**
 * Примеры использования системы контроля багов OmniDebugger
 * Интеграция в существующий код приложения
 */

// ===== ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ В КОДЕ =====

// 1. Автоматическая регистрация багов в обработчиках ошибок
class BookService {
    async loadBookContent(bookId) {
        try {
            // ... existing code ...
        } catch (error) {
            // Автоматически создаст баг из ошибки
            omniDebugger.reportBugFromError(error, {
                component: 'BookService',
                method: 'loadBookContent',
                bookId,
                operation: 'book_loading'
            });

            // Исходная логика остается
            omniDebugger.logBookError(bookId, error, 'Content load failed');
            throw error;
        }
    }
}

// 2. Ручная регистрация багов для бизнес-логики
class PaginationEngine {
    showPage(pageIndex) {
        try {
            // ... pagination logic ...
        } catch (error) {
            // Создаем баг с дополнительным контекстом
            const bugId = omniDebugger.reportBug(
                'Pagination Error',
                `Failed to show page ${pageIndex}: ${error.message}`,
                'high',
                {
                    component: 'PaginationEngine',
                    method: 'showPage',
                    pageIndex,
                    totalPages: this.pages.length,
                    bookId: this.bookId
                }
            );

            // Добавляем дополнительные события
            omniDebugger.addBugEvent(bugId, 'PAGINATION_FAILED', {
                currentPage: this.currentPage,
                targetPage: pageIndex
            });

            throw error;
        }
    }
}

// 3. Отслеживание пользовательских сценариев
class ReaderView {
    switchReadingMode(mode) {
        const startTime = performance.now();

        try {
            // ... mode switching logic ...

            // Логируем успешное переключение
            omniDebugger._log('READER', `Mode switched to ${mode}`, {
                previousMode: this.readingMode,
                newMode: mode,
                duration: performance.now() - startTime
            });

        } catch (error) {
            // Регистрируем баг при неудаче
            omniDebugger.reportBug(
                'Mode Switch Failed',
                `Failed to switch to ${mode} mode: ${error.message}`,
                'medium',
                {
                    component: 'ReaderView',
                    method: 'switchReadingMode',
                    targetMode: mode,
                    currentMode: this.readingMode
                }
            );

            throw error;
        }
    }
}

// 4. Мониторинг производительности с порогами
class PerformanceMonitor {
    measure(operation, duration) {
        // Логируем медленные операции
        if (duration > 1000) { // > 1 сек
            omniDebugger.reportBug(
                'Performance Issue',
                `${operation} took ${duration}ms (threshold: 1000ms)`,
                'medium',
                {
                    component: 'PerformanceMonitor',
                    operation,
                    duration,
                    threshold: 1000
                }
            );
        }

        // ... остальная логика ...
    }
}

// 5. Валидация данных с созданием багов
class DataValidator {
    validateBookData(data) {
        const issues = [];

        if (!data.title) {
            issues.push('Missing title');
        }

        if (!data.content) {
            issues.push('Missing content');
        }

        if (issues.length > 0) {
            omniDebugger.reportBug(
                'Data Validation Failed',
                `Book data validation issues: ${issues.join(', ')}`,
                'low',
                {
                    component: 'DataValidator',
                    issues,
                    dataKeys: Object.keys(data)
                }
            );

            return false;
        }

        return true;
    }
}

// ===== КОНСОЛЬНЫЕ КОМАНДЫ ДЛЯ ОТЛАДКИ =====

// Примеры использования в браузерной консоли:
if (typeof window !== 'undefined') {
    // Создание тестового бага
    // omniDebugger.reportBug('Test Bug', 'Testing bug system', 'low')

    // Просмотр всех багов
    // omniDebugger.getBugs()

    // Фильтрация по статусу
    // omniDebugger.getBugs({ status: 'open' })

    // Получение статистики
    // omniDebugger.getBugStats()

    // Экспорт багов
    // omniDebugger.downloadBugs()

    // Управление конкретным багом
    // omniDebugger.updateBugStatus(1, 'closed', 'Fixed')
    // omniDebugger.addBugComment(1, 'developer', 'Issue resolved')
    // omniDebugger.addBugTags(1, ['ui', 'fixed'])
}

// ===== ИНТЕГРАЦИЯ С СУЩЕСТВУЮЩИМИ ОБРАБОТЧИКАМИ =====

// В Application.js при инициализации
class Application {
    initializeDebugger() {
        this.debugger = new OmniDebugger({ enabled: true });

        // Настройка дополнительных обработчиков
        this.setupGlobalErrorHandling();
        this.setupPerformanceMonitoring();
    }

    setupGlobalErrorHandling() {
        // Перехват необработанных ошибок
        window.addEventListener('error', (event) => {
            this.debugger.reportBugFromError(event.error || new Error(event.message), {
                source: 'global_error_handler',
                url: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        // Перехват необработанных Promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            const error = event.reason instanceof Error ?
                event.reason :
                new Error(String(event.reason));

            this.debugger.reportBugFromError(error, {
                source: 'unhandled_promise_rejection',
                originalReason: event.reason
            });
        });
    }

    setupPerformanceMonitoring() {
        // Мониторинг Core Web Vitals
        if ('web-vitals' in window) {
            webVitals.getCLS(console.log);
            webVitals.getFID(console.log);
            webVitals.getFCP(console.log);
            webVitals.getLCP((metric) => {
                if (metric.value > 2500) { // > 2.5 сек
                    this.debugger.reportBug(
                        'Poor LCP Performance',
                        `Largest Contentful Paint: ${metric.value}ms`,
                        'medium',
                        {
                            metric: 'LCP',
                            value: metric.value,
                            threshold: 2500
                        }
                    );
                }
            });
        }
    }
}

// ===== ПРИМЕРЫ АВТОМАТИЗАЦИИ =====

// Автоматическое закрытие багов на основе коммитов
function checkForBugFixes(commits) {
    commits.forEach(commit => {
        const message = commit.message.toLowerCase();

        // Ищем упоминания багов в коммитах
        const bugMatches = message.match(/fix(?:es|ed)?\s+(?:bug|issue)\s*#?(\d+)/gi);

        if (bugMatches) {
            bugMatches.forEach(match => {
                const bugId = match.match(/(\d+)/)?.[1];
                if (bugId) {
                    omniDebugger.updateBugStatus(
                        parseInt(bugId),
                        'closed',
                        `Fixed in commit ${commit.hash}: ${commit.message}`
                    );
                }
            });
        }
    });
}

// Автоматическое создание багов из пользовательских отчетов
function processUserReport(report) {
    const severity = report.urgency === 'urgent' ? 'high' :
                    report.urgency === 'important' ? 'medium' : 'low';

    const bugId = omniDebugger.reportBug(
        report.title,
        report.description,
        severity,
        {
            source: 'user_report',
            userId: report.userId,
            userAgent: report.userAgent,
            url: report.url
        }
    );

    // Добавляем дополнительные теги
    omniDebugger.addBugTags(bugId, report.tags || []);

    return bugId;
}

export { BookService, PaginationEngine, ReaderView, PerformanceMonitor, DataValidator };
