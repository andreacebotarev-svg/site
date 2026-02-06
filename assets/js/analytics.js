(function() {
  /**
   * -------------------------------------------------------------------------
   * ИНСТРУКЦИЯ ПО НАСТРОЙКЕ:
   * 1. Зарегистрируйте сайт в Яндекс.Метрике: https://metrika.yandex.ru/
   * 2. Скопируйте "Номер счетчика" (ID) и вставьте его ниже вместо 'YOUR_YANDEX_ID'.
   * 3. Зарегистрируйте сайт в Google Analytics: https://analytics.google.com/
   * 4. Скопируйте "Идентификатор потока данных" (G-...) и вставьте его ниже вместо 'G-YOUR_GOOGLE_ID'.
   * -------------------------------------------------------------------------
   */
  const YANDEX_METRICA_ID = '106683416'; 
  const GOOGLE_ANALYTICS_ID = 'G-22HQE6ZH46';

  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  // --- Google Analytics ---
  if (GOOGLE_ANALYTICS_ID && GOOGLE_ANALYTICS_ID !== 'G-YOUR_GOOGLE_ID') {
    // Inject script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
    document.head.appendChild(script);

    // Init dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GOOGLE_ANALYTICS_ID);
    console.log('[Analytics] Google Analytics initialized');
  } else if (isProduction) {
    console.warn('[Analytics] Google Analytics ID not configured');
  }

  // --- Yandex Metrica ---
  if (YANDEX_METRICA_ID && YANDEX_METRICA_ID !== 'YOUR_YANDEX_ID') {
      (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

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
      console.log('[Analytics] Yandex Metrica initialized');
  } else if (isProduction) {
    console.warn('[Analytics] Yandex Metrica ID not configured');
  }
})();
