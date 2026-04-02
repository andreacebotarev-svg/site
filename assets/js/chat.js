class EnglishAssistant {
  constructor() {
    this.messages = [];
    // API config теперь через GeoRouter (geo-router.js)
    this.currentImage = null;

    this.config = {
      // model и endpoint получаем динамически через GeoRouter
      systemPrompt: `Ты — драйвовый менеджер по продажам школы Андрея Чеботарева. ✨🚀🔥
ТВОЯ ЦЕЛЬ: записать на бесплатный пробный урок. 📅🎁

ТВОИ ПРАВИЛА: 
1. ЦЕНЫ: Индивидуально 1800₽, Пакет 1500₽/урок, Группы 1250₽. ПЕРВЫЙ УРОК: БЕСПЛАТНО! 🎁🎬
2. ПРОМОКОД: "2026" дает скидку 15% на первые 3 месяца обучения! 🎟️💸
3. НЕ УЧИ БЕСПЛАТНО: Если просят правило — скажи, что у нас есть крутой Бот-Репетитор для этого, а ты здесь, чтобы записать на полноценный урок, где Андрей объяснит всё лично.
4. ЭКОСИСТЕМА: Пиарь Smart Reader и Reading Trainer. 🪄💻
5. КАК ЗАПИСАТЬ: Если клиент хочет записаться, ПРОСТО ПОПРОСИ ЕГО НАПИСАТЬ СВОЙ НОМЕР ТЕЛЕФОНА ИЛИ TELEGRAM ПРЯМО ТУТ В ЧАТЕ. НИКОГДА не генерируй заглушки ссылок типа [Запишитесь](ссылка) или формы, просто скажи: "Напиши свой номер телефона или ник в Telegram, и мы свяжемся с тобой!". Система чата сама распознает его ответ. ✨`,
    };

    this.suggestions = {
      initial: [
        "Узнать цену 💳",
        "Как проходит пробный урок? 🎓",
        "Промокод на скидку? 🎁",
        "Хочу записаться! ✍️",
        "Промокод 2026 🎟️",
      ],
      pricing: [
        "Пакет 8 уроков 📦",
        "Скидка по промокоду 🎟️",
        "Как оплатить? 🌍",
      ],
    };
    this.init();
  }

  init() {
    this.createUI();
    this.bindEvents();
  }

  createUI() {
    if (document.querySelector(".ai-chat-widget")) return;

    const widget = document.createElement("div");
    widget.className = "ai-chat-widget sales-mode";
    widget.innerHTML = `
            <div class="chat-badge" id="chatBadge">Задай мне вопрос!</div>
            <button class="chat-toggle" id="chatToggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
            </button>
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div style="display:flex; align-items:center; gap:12px; flex:1;">
                        <div class="status-dot"></div>
                        <h3>English Guru Sales ✨</h3>
                    </div>
                    <button id="chatCloseMobile" class="mobile-close-btn" style="display:none; background:none; border:none; color:white; padding:5px; cursor:pointer;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <!-- Extra Header Actions -->
                <div style="padding: 0 16px 12px 16px; display:flex; gap:8px;">
                    <button class="btn-header-action" id="btnLeaveRequest" style="width:100%; justify-content:center;">
                        📝 Оставить заявку
                    </button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message ai">
                        Привет! Я помогу тебе выбрать лучший формат обучения. Готов начать говорить на английском? ✨🚀
                        <div class="chat-contact-footer">
                            📲 Telegram: <a href="https://t.me/English24fk" target="_blank">@English24fk</a><br>
                            ✉️ Email: <a href="mailto:andreacebotarev@gmail.com">andreacebotarev@gmail.com</a><br>
                            📞 Тел: <a href="tel:+79243942682">8-924-394-26-82</a>
                        </div>
                    </div>
                </div>
                <div id="typingIndicator" class="typing-indicator">Manager is thinking...</div>
                <div class="chat-suggestions" id="chatSuggestions"></div>
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Спроси про цены или скидки...">
                    <button class="chat-send" id="chatSend">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
                <!-- Bottom Swipe Handle Visual -->
                <div class="chat-swipe-area bottom" id="swipeAreaBottom">
                    <div class="chat-swipe-handle"></div>
                </div>
            </div>
        `;
    document.body.appendChild(widget);

    this.elements = {
      toggle: document.getElementById("chatToggle"),
      window: document.getElementById("chatWindow"),
      messages: document.getElementById("chatMessages"),
      input: document.getElementById("chatInput"),
      send: document.getElementById("chatSend"),
      typing: document.getElementById("typingIndicator"),
      suggestions: document.getElementById("chatSuggestions"),
      badge: document.getElementById("chatBadge"),
      closeBtn: document.getElementById("chatCloseMobile"),
      btnLeaveRequest: document.getElementById("btnLeaveRequest"),
      swipeArea: document.getElementById("swipeArea"),
      swipeAreaBottom: document.getElementById("swipeAreaBottom"),
      suggestions: document.getElementById("chatSuggestions"),
      inputArea: widget.querySelector(".chat-input-area"),
      header: widget.querySelector(".chat-header"),
    };

    this.renderSuggestions(this.suggestions.initial);
    this.initSwipeGestures();
  }

  initSwipeGestures() {
    // Logic: Swipe DOWN to close (Standard Sheet behavior)
    // Handle is at top or user pulls down on header/content when at top
    
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let isAtTop = false;
    let isAtBottom = false;

    const handleTouchStart = (e) => {
        if (window.innerWidth > 600) return;

        const touch = e.touches[0];
        startY = touch.clientY;
        
        // Check if scrolled to limits
        const el = this.elements.messages;
        const scrollBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        isAtTop = el.scrollTop <= 5;
        isAtBottom = scrollBottom <= 10;
        
        // Force gesture if touching handles or UI areas at ends
        if (this.elements.swipeArea.contains(e.target) || this.elements.header.contains(e.target)) {
            isAtTop = true;
        }
        
        if (this.elements.swipeAreaBottom && this.elements.swipeAreaBottom.contains(e.target)) {
            isAtBottom = true;
        }

        // Context: If touching input or suggestions, also allow swipe UP to close if at bottom
        if (this.elements.suggestions.contains(e.target) || this.elements.inputArea.contains(e.target)) {
            // Force allow bottom drag because these are fixed elements at bottom visually
            isAtBottom = true; 
        }

        isDragging = false;
    };

    const handleTouchMove = (e) => {
        if (window.innerWidth > 600) return;
        // if (!isAtTop) return; // REMOVED: This blocked bottom-up swipes if not at top!

        const touch = e.touches[0];
        currentY = touch.clientY;
        const diff = currentY - startY; 

        // Allow dragging DOWN at Top, or UP at Bottom, or ANYWHERE on handle
        let allowDrag = false;
        
        // 1. Swipe DOWN (diff > 0) -> Only if at TOP
        if (diff > 0 && isAtTop) allowDrag = true;
        
        // 2. Swipe UP (diff < 0) -> Only if at BOTTOM
        if (diff < 0 && isAtBottom) allowDrag = true;

        if (allowDrag) {
            e.preventDefault(); 
            
            isDragging = true;
            this.elements.window.classList.add('is-dragging');
            
            // Visuals: Slide
            const opacity = 1 - (Math.abs(diff) / 700); 
            this.elements.window.style.transform = `translateY(${diff}px)`;
            this.elements.window.style.opacity = opacity;
        }
    };

    const handleTouchEnd = (e) => {
        if (window.innerWidth > 600) return;
        if (!isDragging) return;

        this.elements.window.classList.remove('is-dragging');
        isDragging = false;

        const diff = currentY - startY;
        const threshold = 150; // Pixels to trigger close

        if (Math.abs(diff) > threshold) {

            // If Swipe UP (diff < 0), scroll to the lead form
            if (diff < 0) {
                const leadForm = document.getElementById('lead');
                if (leadForm) {
                    leadForm.scrollIntoView({ behavior: 'smooth' });
                }
            }

            // Close (Use a smooth exit animation)
            this.elements.window.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease';
            this.elements.window.style.transform = `translateY(${diff > 0 ? '100dvh' : '-100dvh'})`;
            this.elements.window.style.opacity = '0';
            
            setTimeout(() => {
                this.toggleChat(false);
                this.elements.window.style.transform = '';
                this.elements.window.style.opacity = '';
                this.elements.window.style.transition = '';
            }, 300);
        } else {
            // Restore
            this.elements.window.classList.add('animate-restore');
            this.elements.window.style.transform = '';
            this.elements.window.style.opacity = '';
            
            setTimeout(() => {
                this.elements.window.classList.remove('animate-restore');
            }, 300);
        }
    };

    // Attach to window for global capture or chat window
    this.elements.window.addEventListener('touchstart', handleTouchStart, { passive: true });
    this.elements.window.addEventListener('touchmove', handleTouchMove, { passive: false });
    this.elements.window.addEventListener('touchend', handleTouchEnd);
  }

  bindEvents() {
    this.elements.toggle.addEventListener("click", () => this.toggleChat());
    
    // Bind close button with touchstart for instant reaction
    if (this.elements.closeBtn) {
      const closeHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleChat(false);
      };
      this.elements.closeBtn.addEventListener("touchstart", closeHandler, { passive: false });
      this.elements.closeBtn.addEventListener("click", closeHandler);
    }


    if (this.elements.btnLeaveRequest) {
        this.elements.btnLeaveRequest.addEventListener("click", () => {
             this.showInlineForm();
        });
    }

    this.elements.send.addEventListener("click", () => this.sendMessage());
    this.elements.input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });

    // Close on clicking outside (for desktop usually, but good for mobile too if implemented)
    document.addEventListener("click", (e) => {
      // Fix: If element is removed from DOM (like suggestions), ignore
      if (!document.body.contains(e.target)) return;

      if (
        this.elements.window.classList.contains("active") &&
        !this.elements.window.contains(e.target) &&
        !this.elements.toggle.contains(e.target)
      ) {
        // Only close if not clicking inside
        this.toggleChat(false);
      }
    });

    // Handle mobile keyboard and visual viewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => {
        if (
          window.innerWidth <= 600 &&
          this.elements.window.classList.contains("active")
        ) {
          const height = window.visualViewport.height;
          // Set window height to exactly what's visible
          this.elements.window.style.height = `${height}px`;
          // Extra padding for the input area when keyboard is up
          if (height < window.innerHeight * 0.8) {
            this.elements.window.classList.add("keyboard-open");
          } else {
            this.elements.window.classList.remove("keyboard-open");
          }
          this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }
      });
    }

    this.elements.input.addEventListener("focus", () => {
      if (window.innerWidth <= 600) {
        setTimeout(() => {
          this.elements.messages.scrollTop =
            this.elements.messages.scrollHeight;
        }, 300);
      }
    });

    // --- Badge Logic ---
    if (this.elements.badge) {
        // Initial delayed show
        setTimeout(() => {
            if (!this.elements.window.classList.contains("active")) {
                this.elements.badge.textContent = "Задай мне вопрос!";
                this.elements.badge.classList.add("is-visible");
                setTimeout(() => this.elements.badge.classList.remove("is-visible"), 5000);
            }
        }, 3000);

        // Fix: Use scroll event instead of IntersectionObserver for native mobile reliability 
        let scrollRAF;
        window.addEventListener('scroll', () => {
            if (scrollRAF) cancelAnimationFrame(scrollRAF);
            scrollRAF = requestAnimationFrame(() => {
                if (this.elements.window.classList.contains("active")) return;
                
                // Calculate distance to bottom
                const docScroll = document.documentElement.scrollTop || document.body.scrollTop;
                const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
                const winHeight = window.innerHeight;
                
                const scrollBottom = docHeight - winHeight - docScroll;
                
                // Show badge when user is within 1500px of the bottom of the page
                if (scrollBottom < 1500) {
                    if (this.elements.badge.textContent !== "Я могу помочь тебе отправить заявку! 🔥") {
                        this.elements.badge.textContent = "Я могу помочь тебе отправить заявку! 🔥";
                    }
                    if (!this.elements.badge.classList.contains("is-visible")) {
                        this.elements.badge.classList.add("is-visible");
                    }
                } else {
                    // Hide when scrolling back up smoothly
                    if (this.elements.badge.classList.contains("is-visible")) {
                        this.elements.badge.classList.remove("is-visible");
                    }
                }
            });
        }, { passive: true });
    }
  }

  toggleChat(forceState = null) {
    const isActive = this.elements.window.classList.contains("active");
    const newState = forceState !== null ? forceState : !isActive;

    if (newState) {
      this.elements.window.classList.add("active");
      this.elements.input.focus();
      if (this.elements.badge) this.elements.badge.style.setProperty('display', 'none', 'important');
      // Lock body scroll for mobile full screen experience
      if (window.innerWidth <= 600) {
        this.savedScrollY = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${this.savedScrollY}px`;
        document.body.style.width = "100%";
        document.body.style.height = "100%"; // Prevent bounce
        if (window.visualViewport) {
          this.elements.window.style.height = `${window.visualViewport.height}px`;
        }
      }
    } else {
      this.elements.window.classList.remove("active");
      // Restore body scroll
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.height = "";
      this.elements.window.style.height = "";
      
      if (this.savedScrollY !== undefined) {
          window.scrollTo(0, this.savedScrollY);
          this.savedScrollY = undefined;
      }
    }
  }

  renderSuggestions(list) {
    this.elements.suggestions.innerHTML = "";
    
    let selected = [...list];
    if (list.includes("Узнать цену 💳")) {
       selected = selected.filter(t => t !== "Узнать цену 💳").sort(() => 0.5 - Math.random()).slice(0, 3);
       selected.unshift("Узнать цену 💳");
    } else {
       selected = selected.sort(() => 0.5 - Math.random()).slice(0, 4);
    }

    selected.forEach((text) => {
      const btn = document.createElement("button");
      btn.className = "suggestion-btn";
      if (text.includes("цену") || text.includes("Скидка")) {
          btn.classList.add("glow-sun");
      }
      btn.textContent = text;
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Fix: Prevent triggering document click that closes the chat
        this.sendMessage(text);
      };
      this.elements.suggestions.appendChild(btn);
    });
  }

  showInlineForm() {
    this.elements.suggestions.innerHTML = "";
    this.addMessage("Оставь свой контакт в форме ниже — Андрей свяжется с тобой для записи на бесплатный пробный урок! 👇", "ai");

    const formDiv = document.createElement("div");
    formDiv.className = "message ai inline-form-message";
    formDiv.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px; width:100%; text-align:center;">
            <p style="margin:0; font-size:14px;">Форма откроется прямо на странице:</p>
            <a href="#lead" style="padding:10px 20px; border-radius:8px; background:linear-gradient(135deg, var(--ai-secondary, #6366f1), var(--ai-primary, #8b5cf6)); color:white; font-weight:bold; text-decoration:none; display:inline-block;"
               onclick="window.englishAssistant && window.englishAssistant.toggleChat(false);"
            >📝 Перейти к форме заявки</a>
        </div>
    `;

    this.elements.messages.appendChild(formDiv);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  detectTopic(text) {
    const lower = text.toLowerCase();
    if (
      lower.includes("цен") ||
      lower.includes("стоимост") ||
      lower.includes("платно") ||
      lower.includes("₽")
    ) {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return "pricing";
  }

  async sendMessage(overrideText = null) {
    const text = overrideText || this.elements.input.value.trim();
    if (!text) return;
    if (!overrideText) this.elements.input.value = "";

    this.addMessage(text, "user");
    this.detectTopic(text);

    // Auto-detect phone or telegram
    const cleanedPhone = text.replace(/[^0-9]/g, '');
    const isPhoneNumber = cleanedPhone.length >= 10 && cleanedPhone.length <= 15 && (text.includes('+') || cleanedPhone.startsWith('7') || cleanedPhone.startsWith('8') || cleanedPhone.startsWith('9'));
    const isTelegram = /@[\w]{4,}/.test(text) || /t\.me\/[\w]{4,}/.test(text);

    if (isPhoneNumber || isTelegram) {
        this.addMessage("✅ Контакт записан! Пожалуйста, заполни форму ниже — так Андрей точно получит твои данные! 👇", "ai");
        this.toggleChat(false);
        const leadSection = document.getElementById('lead');
        if (leadSection) {
            leadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        this.messages.push({ role: "user", content: text });
        this.messages.push({ role: "assistant", content: "Перенаправили к форме." });
        return;
    }

    const history = [
      { role: "system", content: this.config.systemPrompt },
      ...this.messages,
      { role: "user", content: text },
    ];

    this.elements.suggestions.innerHTML = "";

    try {
      this.elements.typing.style.display = "block";

      // 🌍 GEO ROUTING - выбираем провайдера по IP
      const geoConfig = await window.GeoRouter.getConfig();

      const response = await fetch(geoConfig.endpoint, {
        method: "POST",
        headers: geoConfig.headers,
        body: JSON.stringify({
          model: geoConfig.model,
          messages: history,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("API failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = "";
      let messageElement = this.addMessage("", "ai");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.includes("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") continue;
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices[0]?.delta?.content || "";
              if (delta) {
                aiMessage += delta;
                messageElement.innerHTML = this.formatMessage(aiMessage);
                this.elements.messages.scrollTop =
                  this.elements.messages.scrollHeight;
              }
            } catch (e) {}
          }
        }
      }

      this.messages.push({ role: "user", content: text });

      // Добавляем блок контактов к финальному сообщению
      const contactInfo = `
                <div class="chat-contact-footer">
                    📲 Telegram: <a href="https://t.me/English24fk" target="_blank">@English24fk</a><br>
                    ✉️ Email: <a href="mailto:andreacebotarev@gmail.com">andreacebotarev@gmail.com</a><br>
                    📞 Тел: <a href="tel:+79243942682">8-924-394-26-82</a>
                </div>
            `;

      messageElement.innerHTML = this.formatMessage(aiMessage) + contactInfo;
      this.messages.push({ role: "assistant", content: aiMessage });
      this.renderSuggestions(this.suggestions.pricing);
    } catch (error) {
      console.error('🔴 Chat API Error:', error);
      console.error('🔴 Error details:', error.message, error.stack);
      this.addMessage(`Произошла ошибка. Но я всегда на связи!<br><div class="chat-contact-footer">
                            📲 Telegram: <a href="https://t.me/English24fk" target="_blank">@English24fk</a><br>
                            ✉️ Email: <a href="mailto:andreacebotarev@gmail.com">andreacebotarev@gmail.com</a><br>
                            📞 Тел: <a href="tel:+79243942682">8-924-394-26-82</a>
                        </div>`, "ai");
    } finally {
      this.elements.typing.style.display = "none";
    }
  }

  formatMessage(text) {
    return (
      text
        // Headers
        .replace(
          /^### (.*$)/gm,
          '<strong style="display:block; margin-top:10px;">$1</strong>',
        )
        .replace(
          /^## (.*$)/gm,
          '<strong style="display:block; font-size:1.1em; margin-top:12px;">$1</strong>',
        )
        .replace(
          /^# (.*$)/gm,
          '<strong style="display:block; font-size:1.2em; margin-top:14px;">$1</strong>',
        )
        // Bold and italic
        .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // Lists
        .replace(/^\* (.*$)/gm, "• $1")
        .replace(/^- (.*$)/gm, "• $1")
        // Newlines
        .replace(/\n/g, "<br>")
    );
  }

  addMessage(text, type) {
    const div = document.createElement("div");
    div.className = `message ${type}`;
    div.innerHTML = this.formatMessage(text);
    this.elements.messages.appendChild(div);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    return div;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.englishAssistant = new EnglishAssistant();
});
