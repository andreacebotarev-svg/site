/**
 * NavigationBar - Single source of truth for reading navigation UI
 * Handles all navigation actions and displays consistent state
 * Accessible and predictable UX
 */
export class NavigationBar {
  constructor(root, { onAction, logger } = {}) {
    this.root = root;
    this.onAction = onAction;
    this.logger = logger || console;

    // Stable DOM refs
    this.homeBtn = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.endBtn = null;
    this.info = null;

    // One listener only
    this.abort = new AbortController();

    this._mount();
  }

  _injectStyles() {
    // Inject CSS for touch-friendly navigation
    if (!document.querySelector('#reader-nav-styles')) {
      const style = document.createElement('style');
      style.id = 'reader-nav-styles';
      style.textContent = `
        .reader-nav {
          position: sticky;
          bottom: 0;
          z-index: 1000;
          pointer-events: auto;
          padding: 12px 12px calc(12px + env(safe-area-inset-bottom, 0px));
          background: color-mix(in srgb, var(--bg-primary, #ffffff) 92%, transparent);
          backdrop-filter: blur(10px);
          border-top: 1px solid var(--border-color, #e0e0e0);
          margin-top: auto;
        }

        .reader-nav__inner {
          display: grid;
          grid-template-columns: auto auto 1fr auto auto;
          align-items: center;
          gap: 10px;
          max-width: var(--reader-max-width, 800px);
          margin: 0 auto;
          pointer-events: auto;
        }

        .reader-nav__btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(145deg, #ffffff, #f0f0f0);
          color: #666;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          box-shadow:
            0 2px 4px rgba(0, 0, 0, 0.1),
            0 1px 2px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          position: relative;
          overflow: hidden;
        }

        .reader-nav__btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0.05));
          opacity: 0;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }

        .reader-nav__btn:hover {
          background: linear-gradient(145deg, #f8f9fa, #e9ecef);
          color: #007bff;
          transform: translateY(-1px) scale(1.02);
          box-shadow:
            0 4px 8px rgba(0, 0, 0, 0.12),
            0 2px 4px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .reader-nav__btn:hover::before {
          opacity: 1;
        }

        .reader-nav__btn:active {
          transform: translateY(0) scale(0.98);
          box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.1),
            inset 0 1px 2px rgba(0, 0, 0, 0.1);
          transition-duration: 0.1s;
        }

        .reader-nav__btn:disabled {
          background: #f8f9fa;
          color: #adb5bd;
          cursor: not-allowed;
          transform: none;
          box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          opacity: 0.6;
        }

        .reader-nav__btn:disabled::before {
          display: none;
        }

        .reader-nav__btn:focus-visible {
          outline: none;
          box-shadow:
            0 2px 4px rgba(0, 0, 0, 0.1),
            0 1px 2px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            0 0 0 3px rgba(0, 123, 255, 0.25);
        }

        /* Специфичные стили для разных кнопок */
        .reader-nav__home::before,
        .reader-nav__end::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background: currentColor;
          border-radius: 2px;
          opacity: 0.1;
        }

        .reader-nav__prev::before,
        .reader-nav__next::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          border: 2px solid currentColor;
          border-left: none;
          border-bottom: none;
          opacity: 0.1;
        }

        .reader-nav__prev::before {
          transform: translate(-50%, -50%) rotate(-135deg);
        }

        .reader-nav__next::before {
          transform: translate(-50%, -50%) rotate(45deg);
        }

        .reader-nav__info {
          justify-self: center;
          font-size: var(--fs-caption-1, 13px);
          color: var(--text-secondary, #666);
          text-align: center;
          user-select: none;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          pointer-events: none;
        }

        @media (max-width: 480px) {
          .reader-nav__inner {
            gap: 8px;
          }

          .reader-nav__btn {
            width: 40px;
            height: 40px;
            min-width: 40px;
            min-height: 40px;
            font-size: 14px;
            border-radius: 10px;
          }

          .reader-nav__home::before,
          .reader-nav__end::before {
            width: 12px;
            height: 12px;
          }

          .reader-nav__prev::before,
          .reader-nav__next::before {
            width: 10px;
            height: 10px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  _mount() {
    this.root.classList.add('reader-nav');

    // Inject styles
    this._injectStyles();

    this.root.innerHTML = `
      <nav class="reader-nav__inner" aria-label="Reading navigation">
        <button type="button" class="btn btn-icon reader-nav__btn reader-nav__home" data-action="home" aria-label="First page" title="Go to first page">⇤</button>
        <button type="button" class="btn btn-icon reader-nav__btn reader-nav__prev" data-action="prev" aria-label="Previous page" title="Go to previous page">⟵</button>

        <div class="reader-nav__info" aria-live="polite"></div>

        <button type="button" class="btn btn-icon reader-nav__btn reader-nav__next" data-action="next" aria-label="Next page" title="Go to next page">⟶</button>
        <button type="button" class="btn btn-icon reader-nav__btn reader-nav__end" data-action="end" aria-label="Last page" title="Go to last page">⇥</button>
      </nav>
    `;

    this.info = this.root.querySelector('.reader-nav__info');

    // Delegation: no per-button listeners
    this.root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.disabled) return;

      const action = btn.dataset.action;
      this.logger.debug('NavigationBar: action dispatched', action);
      this.onAction?.(action);
    }, { signal: this.abort.signal });

    // Cache refs after HTML exists
    this.homeBtn = this.root.querySelector('[data-action="home"]');
    this.prevBtn = this.root.querySelector('[data-action="prev"]');
    this.nextBtn = this.root.querySelector('[data-action="next"]');
    this.endBtn = this.root.querySelector('[data-action="end"]');
  }

  /**
   * Render navigation state
   * ctx = {
   *   busy: boolean, // true while navigating (prevents double-clicks)
   *   chapter: { index, total, pageIndex, pageCount },
   *   global: { index, total },
   *   navigation: { hasPrev, hasNext }
   * }
   */
  render(ctx) {
    const busy = !!ctx.busy;

    // Disable while navigating (prevents double-click races)
    const disableHome = busy || (ctx.global.index === 0);
    const disablePrev = busy || !ctx.navigation.hasPrev;
    const disableNext = busy || !ctx.navigation.hasNext;
    const disableEnd = busy || (ctx.global.index >= ctx.global.total - 1);

    if (this.homeBtn) this.homeBtn.disabled = disableHome;
    if (this.prevBtn) this.prevBtn.disabled = disablePrev;
    if (this.nextBtn) this.nextBtn.disabled = disableNext;
    if (this.endBtn) this.endBtn.disabled = disableEnd;

    // Update status text
    if (this.info) {
      if (!ctx.chapter || !ctx.global) {
        this.info.textContent = 'Loading...';
      } else {
        this.info.textContent =
          `Chapter ${ctx.chapter.index + 1}/${ctx.chapter.total} · ` +
          `Page ${ctx.chapter.pageIndex + 1}/${ctx.chapter.pageCount} · ` +
          `Global ${ctx.global.index + 1}/${ctx.global.total}`;
      }
    }
  }

  destroy() {
    this.abort.abort();
    this.root.innerHTML = '';
    this.logger.debug('NavigationBar destroyed');
  }
}
