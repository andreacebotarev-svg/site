(function() {
  /**
   * -------------------------------------------------------------------------
   * АНАЛИТИКА + ДИАГНОСТИКА
   * -------------------------------------------------------------------------
   */
  const YANDEX_METRICA_ID = '106683416'; 
  const GOOGLE_ANALYTICS_ID = 'G-22HQE6ZH46';

  const hostname = window.location.hostname;
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1';
  
  console.groupCollapsed('[Analytics-Diagnostic] Проверка инициализации');
  console.log('Домен:', hostname);
  console.log('Режим:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
  console.log('Google ID:', GOOGLE_ANALYTICS_ID || 'НЕ УКАЗАН');
  console.log('Yandex ID:', YANDEX_METRICA_ID || 'НЕ УКАЗАН');
  console.groupEnd();

  // --- Google Analytics ---
  if (GOOGLE_ANALYTICS_ID && GOOGLE_ANALYTICS_ID !== 'G-YOUR_GOOGLE_ID') {
    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
      
      script.onload = () => {
        console.log('✅ [Analytics] Google Analytics script loaded successfully');
      };
      
      script.onerror = () => {
        console.error('❌ [Analytics] Google Analytics script FAILED to load. Possible reasons: AdBlocker, Firewall, or no internet connection.');
      };

      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', GOOGLE_ANALYTICS_ID);
      
      // Глобальная функция для отладки
      window.debugGA = () => {
          console.log('DataLayer Status:', window.dataLayer);
          console.log('Gtag defined:', typeof gtag === 'function');
      };

      console.log('🚀 [Analytics] Google Analytics initialized (Command sent)');
    } catch (e) {
      console.error('❌ [Analytics] Google Analytics initialization error:', e);
    }
  } else {
    console.warn('⚠️ [Analytics] Google Analytics ID is missing or default.');
  }

  // --- Yandex Metrica ---
  if (YANDEX_METRICA_ID && YANDEX_METRICA_ID !== 'YOUR_YANDEX_ID') {
    try {
       (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
       m[i].l=1*new Date();
       for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
       k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,
       k.onload = () => console.log('✅ [Analytics] Yandex Metrica script loaded');
       k.onerror = () => console.error('❌ [Analytics] Yandex Metrica script FAILED to load');
       a.parentNode.insertBefore(k,a)})
       (window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=106683416", "ym");

       ym(YANDEX_METRICA_ID, "init", {
            ssr: true,
            webvisor: true,
            clickmap: true,
            ecommerce: "dataLayer",
            referrer: document.referrer,
            url: location.href,
            accurateTrackBounce: true,
            trackLinks: true
       });
       console.log('🚀 [Analytics] Yandex Metrica initialized');

       // === ДОКАЗАТЕЛЬСТВА РАБОТЫ МЕТРИКИ ===
       console.log('%c═══════════════════════════════════════', 'color: #ff0; font-weight: bold');
       console.log('%c  YANDEX METRICA — ДИАГНОСТИКА', 'color: #ff0; font-size: 14px; font-weight: bold');
       console.log('%c═══════════════════════════════════════', 'color: #ff0; font-weight: bold');
       console.log('📌 Counter ID:', YANDEX_METRICA_ID);
       console.log('🌐 Page URL:', location.href);
       console.log('📎 Referrer:', document.referrer || '(прямой заход)');
       console.log('⏰ Init time:', new Date().toLocaleTimeString());
       console.log('🔧 ym function exists:', typeof window.ym === 'function');
       console.log('📋 ym queue:', window.ym && window.ym.a ? window.ym.a.length + ' commands queued' : 'direct mode');

       // Отложенная проверка (через 3 сек скрипт точно загрузится)
       setTimeout(() => {
         console.log('%c═══ YANDEX METRICA — ПРОВЕРКА ЧЕРЕЗ 3 сек ═══', 'color: #0f0; font-weight: bold');
         console.log('✅ ym function active:', typeof window.ym === 'function');
         console.log('✅ tag.js loaded:', !!document.querySelector('script[src*="mc.yandex.ru/metrika/tag.js"]'));
         
         // Проверяем что счётчик создал свои объекты
         const counterKey = 'yaCounter' + YANDEX_METRICA_ID;
         console.log('✅ Counter object (' + counterKey + '):', !!window[counterKey]);
         
         if (window[counterKey]) {
           console.log('%c🎉 МЕТРИКА РАБОТАЕТ! Счётчик ' + YANDEX_METRICA_ID + ' активен и отправляет данные.', 'color: #0f0; font-size: 14px; font-weight: bold');
         } else {
           console.warn('⚠️ Counter object не найден. Возможные причины: AdBlock, блокировка mc.yandex.ru, или счётчик ещё загружается.');
         }
       }, 3000);

    } catch (e) {
       console.error('❌ [Analytics] Yandex Metrica initialization error:', e);
    }
  } else {
    console.warn('⚠️ [Analytics] Yandex Metrica ID is missing or default.');
  }
})();

// --- Отслеживание кликов по контактам ---
document.addEventListener('DOMContentLoaded', () => {
  const YANDEX_ID = '106683416';
  
  // Конфигурация кнопок для отслеживания
  const trackableButtons = [
    { id: 'contact-telegram', goal: 'click_telegram', label: 'Telegram' },
    { id: 'contact-email', goal: 'click_email', label: 'Email' },
    { id: 'contact-phone', goal: 'click_phone', label: 'Phone' },
    { id: 'leadForm', goal: 'form_submit', label: 'Lead Form', event: 'submit' }
  ];

  trackableButtons.forEach(({ id, goal, label, event = 'click' }) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, () => {
        // Yandex Metrica
        if (typeof ym === 'function') {
          ym(YANDEX_ID, 'reachGoal', goal);
          console.log(`📊 [Analytics] Yandex Goal: ${goal}`);
        }
        // Google Analytics
        if (typeof gtag === 'function') {
          gtag('event', goal, {
            event_category: 'contact',
            event_label: label
          });
          console.log(`📊 [Analytics] GA Event: ${goal}`);
        }
      });
      console.log(`🎯 [Analytics] Tracking enabled for: ${id}`);
    }
  });
});
