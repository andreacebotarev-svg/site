/**
 * Spoke Preview Modal (Universal)
 * Desktop: iframe modal
 * Mobile: open in new tab
 */

const MOBILE_BREAKPOINT = 768;

function isMobile() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function openSpokePreview(url, title = 'Пример') {
  if (!url) return;

  // Desktop/Mobile: modal iframe
  const modal = document.getElementById('platformModal');
  const iframe = document.getElementById('platformIframe');
  const content = modal.querySelector('.platform-modal-content');

  if (!modal || !iframe) {
    console.error('Spoke modal elements not found');
    return;
  }

  // Reset any previous transformations
  if (content) {
      content.style.transform = '';
      content.style.transition = '';
  }

  iframe.src = url;
  iframe.setAttribute('title', title);
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Inject cross-document swipe-to-close listener for Mobile
  iframe.onload = () => {
      try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (!iframeDoc) return;

          let startY = 0;
          let currentY = 0;
          let isDragging = false;
          let isAtTop = false;

          iframeDoc.addEventListener('touchstart', (e) => {
              if (window.innerWidth > 768) return;
              
              const touch = e.touches[0];
              startY = touch.clientY;
              
              // Figure out if the target is scrollable and we are at the top
              // If it's a scrollable container, only allow pull-to-close if we are at scrollTop === 0
              let target = e.target;
              isAtTop = true;
              
              while (target && target !== iframeDoc.body && target !== iframeDoc.documentElement) {
                  const overflowY = window.getComputedStyle(target).overflowY;
                  if (overflowY === 'auto' || overflowY === 'scroll') {
                      if (target.scrollTop > 5) {
                          isAtTop = false;
                          break;
                      }
                  }
                  target = target.parentElement;
              }

              // Also check document scroll
              if (iframeDoc.documentElement.scrollTop > 5 || iframeDoc.body.scrollTop > 5) {
                  isAtTop = false;
              }

              isDragging = isAtTop;
          }, { passive: true });

          iframeDoc.addEventListener('touchmove', (e) => {
              if (!isDragging) return;
              currentY = e.touches[0].clientY;
              const diff = currentY - startY;

              if (diff > 0 && isAtTop) {
                  // e.preventDefault() cannot be called reliably on passive listeners, but we can animate our parent container
                  if (content) {
                      content.style.transition = 'none';
                      content.style.transform = `translateY(${diff}px)`;
                  }
              }
          }, { passive: true });

          iframeDoc.addEventListener('touchend', (e) => {
              if (!isDragging) return;
              isDragging = false;
              
              const diff = currentY - startY;
              
              if (content) {
                  content.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                  
                  if (diff > 120 && isAtTop) {
                      content.style.transform = 'translateY(100vh)';
                      setTimeout(() => closePlatformPreview(), 300);
                  } else {
                      content.style.transform = 'translateY(0)';
                  }
              }
          });
      } catch (err) {
          console.warn('Cannot inject swipe listener into iframe:', err);
      }
  };

  // Add same listeners to the content wrapper itself (for margins/borders)
  if (content) {
      let outerStartY = 0;
      let outerCurrentY = 0;
      let outerDragging = false;

      content.addEventListener('touchstart', (e) => {
          if (window.innerWidth > 768) return;
          outerStartY = e.touches[0].clientY;
          outerDragging = true;
      }, { passive: true });

      content.addEventListener('touchmove', (e) => {
          if (!outerDragging) return;
          outerCurrentY = e.touches[0].clientY;
          const diff = outerCurrentY - outerStartY;

          if (diff > 0) {
              content.style.transition = 'none';
              content.style.transform = `translateY(${diff}px)`;
          }
      }, { passive: true });

      content.addEventListener('touchend', (e) => {
          if (!outerDragging) return;
          outerDragging = false;
          const diff = outerCurrentY - outerStartY;

          content.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          if (diff > 120) {
              content.style.transform = 'translateY(100vh)';
              setTimeout(() => closePlatformPreview(), 300);
          } else {
              content.style.transform = 'translateY(0)';
          }
      });
  }
}

function closePlatformPreview() {
  const modal = document.getElementById('platformModal');
  const iframe = document.getElementById('platformIframe');
  if (!modal || !iframe) return;
  const content = modal.querySelector('.platform-modal-content');

  iframe.src = '';
  modal.style.display = 'none';
  document.body.style.overflow = '';
  if (content) {
      content.style.transform = '';
      content.style.transition = '';
  }
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !isMobile()) closePlatformPreview();
});

window.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('platformModal');
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closePlatformPreview();
    });
  }
  
  // Delegate clicks for elements with .js-spoke class
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-spoke');
    if (!btn) return;
    // prevent default if it's a link behaving as a button, though usually we use buttons
    if (btn.tagName === 'A') e.preventDefault(); 
    
    openSpokePreview(btn.dataset.url, btn.dataset.title);
  });

  // Handle close messages from iframes
  window.addEventListener('message', (e) => {
    if (e.data === 'closeModal') closePlatformPreview();
  });
});