// ==========================================
// 🔍 OMNI-DIAGNOSTICS EXTENSION
// Внедряет автоматические проверки целостности
// ==========================================

export class OmniDiagnostics {
    constructor(debuggerInstance) {
        this.dbg = debuggerInstance;
        this.isEnabled = true;
        this.lastNavClickTime = 0;

        // Автоматический запуск наблюдения
        this.initObservers();
        this.patchReaderView();
        this.setupNavigationWatchdog();

        console.log('%c🕵️ OmniDiagnostics Active', 'background: #333; color: #00ff00; padding: 4px; border-radius: 4px;');
    }

    /**
     * 1. Наблюдатель за потерей данных (Картинки/Параграфы)
     * Перехватывает метод extractParagraphs... и проверяет, не потеряли ли мы контент
     */
    patchReaderView() {
        const originalExtract = window.ReaderView?.prototype?.extractParagraphsFromSections;

        if (!originalExtract && window.readerView) {
            // Если прототип недоступен, патчим инстанс если есть
            this.patchInstanceMethod(window.readerView, 'extractParagraphsFromSections');
        } else if (window.ReaderView) {
            // Патчим прототип класса
            const self = this;
            window.ReaderView.prototype.extractParagraphsFromSections = function(sections) {
                const result = originalExtract.apply(this, [sections]);
                self.auditDataIntegrity(sections, result);
                return result;
            };
        }
    }

    patchInstanceMethod(instance, methodName) {
        const original = instance[methodName];
        const self = this;
        instance[methodName] = function(...args) {
            const result = original.apply(this, args);
            // Для extractParagraphsFromSections первый аргумент - секции
            if (methodName === 'extractParagraphsFromSections') {
                self.auditDataIntegrity(args[0], result);
            }
            return result;
        };
    }

    /**
     * Анализирует, что вошло и что вышло
     */
    auditDataIntegrity(sourceSections, resultParagraphs) {
        // Считаем картинки в исходнике (примерно)
        let sourceImages = 0;
        const countImages = (secs) => {
            secs.forEach(s => {
                if (s.blocks) sourceImages += s.blocks.filter(b => b.kind === 'img').length;
                if (s.sections) countImages(s.sections);
            });
        };
        if (Array.isArray(sourceSections)) countImages(sourceSections);

        // Считаем картинки в результате
        const resultImages = resultParagraphs.filter(p => p.type === 'image' || (p.html && p.html.includes('<img'))).length;

        if (sourceImages > 0 && resultImages === 0) {
            console.group('%c🚨 CRITICAL: CONTENT LOSS DETECTED', 'background: red; color: white; font-size: 14px; padding: 4px;');
            console.error(`Source has ${sourceImages} images, but output has 0!`);
            console.warn('Diagnosis: Images are being filtered out in ReaderView.extractParagraphsFromSections');
            console.log('Source sample:', sourceSections[0]);
            console.groupEnd();
        } else {
            console.log(`%c✅ Data Integrity OK: ${resultImages}/${sourceImages} images preserved`, 'color: green');
        }
    }

    /**
     * 2. Сторожевой пес Навигации (Deadlock Detector)
     * Если нажали кнопку, а URL не изменился — это баг
     */
    setupNavigationWatchdog() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.nav-btn, .pagination-next, .pagination-prev');
            if (!target || target.disabled) return;

            const urlBefore = window.location.href;
            const timeBefore = Date.now();

            console.log(`%c🖱️ Navigation click detected on ${target.className}`, 'color: cyan');

            // Проверка через 300мс
            setTimeout(() => {
                const urlAfter = window.location.href;
                if (urlBefore === urlAfter) {
                    console.group('%c🚨 CRITICAL: NAVIGATION FREEZE', 'background: red; color: white; padding: 4px;');
                    console.error('Button clicked, but URL did not change after 300ms.');
                    console.warn('Possible causes:');
                    console.warn('1. Event listener missing or removed (re-render issue?)');
                    console.warn('2. URLNavigator threw a silent error');
                    console.warn('3. Logic thinks we are at end of book (check disabled state)');

                    // Диагностика состояния
                    const pc = window.readerView?.paginationController;
                    console.log('Controller State:', pc?.getStats());
                    console.groupEnd();
                } else {
                    this.verifyRenderingAfterNav();
                }
            }, 300);
        }, true); // Capture phase чтобы поймать наверняка
    }

    /**
     * 3. Проверка Рендера (Ghost Content)
     * После навигации проверяет, есть ли реальный DOM
     */
    verifyRenderingAfterNav() {
        setTimeout(() => {
            const pageContent = document.querySelector('.page-content, #reading-content');
            const hasText = pageContent && pageContent.innerText.trim().length > 0;
            const interactiveWords = document.querySelectorAll('.interactive-word').length;

            if (!hasText) {
                console.error('%c🚨 RENDER FAIL: URL changed but page is empty!', 'color: red');
            } else if (interactiveWords === 0) {
                console.error('%c⚠️ INTERACTIVITY FAIL: Content rendered but words are not clickable.', 'color: orange');
                console.warn('Hint: makeElementInteractive() call missed timing or target.');
            } else {
                console.log('%c✅ Navigation & Render Successful', 'color: green');
            }
        }, 100);
    }

    /**
     * Инициализация наблюдателей
     */
    initObservers() {
        // MutationObserver для отслеживания изменений в DOM
        if (typeof MutationObserver !== 'undefined') {
            this.domObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        // Проверяем добавление/удаление элементов пагинации
                        const addedPages = Array.from(mutation.addedNodes).filter(node =>
                            node.nodeType === 1 && node.matches?.('.page, .page-content')
                        );
                        const removedPages = Array.from(mutation.removedNodes).filter(node =>
                            node.nodeType === 1 && node.matches?.('.page, .page-content')
                        );

                        if (addedPages.length > 0) {
                            console.log(`%c📄 Page added: ${addedPages.length} elements`, 'color: blue');
                        }
                        if (removedPages.length > 0) {
                            console.log(`%c📄 Page removed: ${removedPages.length} elements`, 'color: orange');
                        }
                    }
                });
            });

            // Начинаем наблюдение за body
            setTimeout(() => {
                if (document.body) {
                    this.domObserver.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                }
            }, 1000);
        }
    }
}

// ==========================================
// AUTO-INJECT
// ==========================================
// Добавляем запуск в существующий OmniDebugger или глобально
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Ждем пока app загрузится
        setTimeout(() => {
            if (!window.omniDiagnostics) {
                window.omniDiagnostics = new OmniDiagnostics(window.app?.debugger);
            }
        }, 1000);
    });
}
