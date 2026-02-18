/* =========================================================
   Main JS - Tutor Landing
   File: /docs/assets/js/main.js
   Mobile-First Responsive
   ========================================================= */

(function() {
  'use strict';

  /* -----------------------------
     1. Mobile Hamburger Menu
  ----------------------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navLinkItems = document.querySelectorAll('.nav-links a');
  
  if (navToggle && navLinks) {
    // Toggle menu
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
      
      // Блокируем скролл body при открытом меню
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    
    // Закрываем меню при клике на ссылку
    navLinkItems.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
    
    // Закрываем меню при ресайзе окна (переход в desktop-режим)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth >= 768 && navLinks.classList.contains('is-open')) {
          navLinks.classList.remove('is-open');
          navToggle.classList.remove('is-active');
          navToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      }, 250);
    });
  }

  /* -----------------------------
     2. Reveal анимации при скролле
  ----------------------------- */
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
      }
    );

    revealElements.forEach((el) => {
      revealObserver.observe(el);
    });
  }

  /* -----------------------------
     3. Обработка формы
  ----------------------------- */
  /* -----------------------------
     3. Обработка формы (Frontend Fortress)
  ----------------------------- */
  const leadForm = document.getElementById('leadForm');
  
  if (leadForm) {
    // 1. Time Trap: Record load time
    const loadTime = Date.now();
    
    // 2. Math Captcha Logic
    const mathLabel = document.getElementById('math_label');
    const mathInput = document.getElementById('math_answer');
    let mathResult = 0;

    function initMathCaptcha() {
      const a = Math.floor(Math.random() * 9) + 1; // 1-9
      const b = Math.floor(Math.random() * 9) + 1; // 1-9
      mathResult = a + b;
      if (mathLabel) mathLabel.textContent = `Сколько будет ${a} + ${b}?`;
      if (mathInput) mathInput.value = '';
    }

    // Initialize on load
    initMathCaptcha();

    // 3. Validation & Submission
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const status = document.getElementById('form-status');
      const btn = leadForm.querySelector('button[type="submit"]');
      const originalBtnText = btn.innerText;

      // --- SECURITY CHECKS --- //

      // A. Rate Limiting (1 request per hour)
      const lastSubmit = localStorage.getItem('lastFormSubmit');
      if (lastSubmit && (Date.now() - parseInt(lastSubmit)) < 3600000) {
        showError(status, '⏳ Вы уже отправили заявку. Пожалуйста, подождите час.');
        return;
      }

      // B. Time Trap (< 3 seconds)
      if (Date.now() - loadTime < 3000) {
        showError(status, '🤖 Слишком быстро. Вы робот?');
        return;
      }

      // C. Honeypot (Hidden field must be empty)
      const honeypot = leadForm.querySelector('input[name="website"]');
      if (honeypot && honeypot.value !== '') {
        console.log('Bot detected: Honeypot filled');
        return; // Silent fail
      }

      // D. Math Captcha
      if (parseInt(mathInput.value) !== mathResult) {
        showError(status, '❌ Неверный ответ на пример.');
        return;
      }

      // E. Strict Phone Validation (Exactly 11 digits)
      const contactInput = document.getElementById('contact');
      // Strip everything except digits
      const phoneDigits = contactInput.value.replace(/\D/g, ''); 
      if (phoneDigits.length !== 11) {
        showError(status, '⚠️ Введите корректный номер телефона (11 цифр).');
        return;
      }
      // Check for repeating digits (e.g. 11111111111)
      if (/^(\d)\1{10}$/.test(phoneDigits)) {
         showError(status, '⚠️ Введите реальный номер телефона.');
         return;
      }

      // F. Smart Content Filter (Forbidden words)
      const messageInput = document.getElementById('message');
      const message = messageInput ? messageInput.value.toLowerCase() : '';
      const forbidden = ['http', 'www', '.com', 'crypto', 'forex', 'investment', 'seo', 'promotion', 'заработок', 'инвестиции'];
      if (forbidden.some(word => message.includes(word))) {
        showError(status, '⛔ Сообщение содержит запрещенные слова или ссылки.');
        return;
      }
      // Check for repeating chars (e.g. AAAAAA)
      if (/(.)\1{4,}/.test(message)) {
        showError(status, '⛔ Обнаружен спам-паттерн.');
        return;
      }

      // --- SUBMISSION --- //
      
      btn.innerText = "Отправка...";
      btn.disabled = true;
      btn.style.opacity = "0.7";
      status.style.display = 'none';

      const formData = new FormData(leadForm);
      // Remove honeypot & math from data sent to email
      formData.delete('website');
      formData.delete('math_answer'); // Assuming we didn't add name="math_answer" but used id, checking index.html... 
      // Wait, input has id="math_answer" but no name? Ah, index.html didn't have name. Good.
      
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: json
      })
      .then(async (response) => {
          let json = await response.json();
          if (response.status == 200) {
              // Success
              status.innerText = "✅ Заявка отправлена! Я свяжусь с вами в ближайшее время.";
              status.style.color = "#155724";
              status.style.backgroundColor = "#d4edda";
              status.style.display = "block";
              leadForm.reset();
              initMathCaptcha(); // Reset math
              localStorage.setItem('lastFormSubmit', Date.now()); // Set rate limit

              // Metrica
              if (typeof ym !== 'undefined') {
                try {
                    ym(106683416, 'reachGoal', 'form_sent'); 
                    console.log('🎯 Mетрика: цель form_sent отправлена');
                } catch (e) { console.error('Error sending goal:', e); }
              }

          } else {
              showError(status, json.message || "Ошибка отправки.");
          }
      })
      .catch(error => {
          console.log(error);
          showError(status, "Произошла ошибка соединения.");
      })
      .finally(() => {
          btn.innerText = originalBtnText;
          btn.disabled = false;
          btn.style.opacity = "1";
          setTimeout(() => {
            status.style.display = 'none';
          }, 10000);
      });
    });

    function showError(element, message) {
      element.innerText = message;
      element.style.color = "#721c24";
      element.style.backgroundColor = "#f8d7da";
      element.style.display = "block";
    }
  }

  /* -----------------------------
     4. Sticky CTA Logic + Back to Top
     Show buttons after Hero, Hide when near Footer/Lead Form
  ----------------------------- */
  const stickyCta = document.getElementById('stickyCta');
  const backToTop = document.getElementById('backToTop');
  const leadSection = document.getElementById('lead');
  
  if (leadSection) {
    let isLeadVisible = false;
    
    // Observer to detect if we can see the lead form
    const leadObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isLeadVisible = entry.isIntersecting;
        updateFloatingButtons();
      });
    }, { threshold: 0.1 }); // Trigger when 10% of form is visible

    leadObserver.observe(leadSection);
    
    // Updates visibility based on scroll pos + lead visibility
    function updateFloatingButtons() {
      const scrollY = window.scrollY;
      const threshold = 600; // Show after scrolling 600px
      const show = scrollY > threshold && !isLeadVisible;
      
      if (stickyCta) {
        stickyCta.classList.toggle('is-visible', show);
      }
      if (backToTop) {
        backToTop.classList.toggle('is-visible', show);
      }
    }
    
    // Throttle scroll event for performance
    let isScrolling = false;
    window.addEventListener('scroll', () => {
      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          updateFloatingButtons();
          isScrolling = false;
        });
        isScrolling = true;
      }
    }, { passive: true });
  }

  // Back to top click handler
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* -----------------------------
     5. Smooth scroll для якорных ссылок
  ----------------------------- */
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  
  anchorLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || href === '#top') return;
      
      const target = document.querySelector(href);
      if (!target) return;
      
      e.preventDefault();
      
      const headerOffset = window.innerWidth < 768 ? 60 : 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    });
  });

  /* -----------------------------
     5. Активная навигация
  ----------------------------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinksActive = document.querySelectorAll('.nav-links a[href^="#"]');
  
  if (sections.length > 0 && navLinksActive.length > 0) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinksActive.forEach((link) => {
              link.classList.remove('is-active');
            });
            const activeLink = document.querySelector(`.nav-links a[href="#${id}"]`);
            if (activeLink) {
              activeLink.classList.add('is-active');
            }
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-80px 0px -60% 0px'
      }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  /* -----------------------------
     6. Активация prefers-reduced-motion
  ----------------------------- */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    revealElements.forEach((el) => {
      el.classList.add('is-visible');
    });
  }

  /* -----------------------------
     7. Класс после полной загрузки
  ----------------------------- */
  window.addEventListener('load', () => {
    document.body.classList.add('is-loaded');
  });

})();