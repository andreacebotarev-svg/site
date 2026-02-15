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
  const leadForm = document.getElementById('leadForm');
  
  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      const submitBtn = leadForm.querySelector('button[type="submit"]');
      
      if (!leadForm.checkValidity()) {
        leadForm.reportValidity();
        e.preventDefault();
        return;
      }
      
      // Визуальная индикация загрузки
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
      submitBtn.textContent = 'Отправляем...';
    });
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