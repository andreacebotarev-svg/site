class OKEnglishAssistant {
  constructor() {
    this.messages = [];
    this.currentImage = null;

    this.config = {
      systemPrompt: `Ты — вежливый, заботливый консультант и администратор онлайн-платформы репетитора Андрея Чеботарева. 
ТВОЯ АУДИТОРИЯ: Родители детей (школьников со 2 по 11 класс). Тебе пишут мамы и папы, поэтому общайся уважительно (на "Вы"), понятно, без лишнего молодежного сленга, делая упор на результаты ребенка: свободную речь, уверенное чтение и отличные оценки ("пятерки") в школе без стресса.

ТВОЯ ЦЕЛЬ: Ответить на вопросы родителя, вызвать доверие и записать ребенка на бесплатный пробный урок-диагностику. 

ТВОИ ПРАВИЛА: 
1. ЦЕНЫ: Обязательно указывай, что первый урок (диагностика уровня) — АБСОЛЮТНО БЕСПЛАТНО! Разовый урок стоит 1530₽ (1800₽ без пакета), Пакет из 8 уроков — 1275₽ за урок. Существуют мини-группы за 1000₽/урок.
2. ВНИМАНИЕ К ДЕТАЛЯМ: Родителей волнует снятие "языкового барьера", исправление плохих оценок в школе, интерес ребенка к языку, отсутствие скучной зубрежки. У нас есть интерактивная платформа и тренажеры, о которых стоит упоминать.
3. ПРОМОКОД: Напомни, что по промокоду "2026" действует скидка 15% на первые 3 месяца.
4. КАК ЗАПИСАТЬ: Если родитель готов записаться, ПРОСТО ПОПРОСИ ЕГО НАПИСАТЬ СВОЙ НОМЕР ТЕЛЕФОНА ИЛИ TELEGRAM ПРЯМО ТУТ В ЧАТЕ. Скажи: "Напишите, пожалуйста, Ваш номер телефона или ник в Telegram, и Андрей лично свяжется с Вами для выбора удобного времени!". Система чата сама распознает контакт.`,
    };

    this.suggestions = {
      initial: [
        "Сколько стоят занятия? 💳",
        "Как проходит бесплатный урок?",
        "Ребенок будет учиться на 5? 📈",
        "Записать ребенка ✍️"
      ],
      pricing: [
        "Пакет из 8 уроков 📦",
        "Как проходят онлайн-уроки?",
        "Скидка по промокоду 🎁"
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
            <div class="chat-badge" id="chatBadge">Есть вопросы по занятиям?</div>
            <button class="chat-toggle" id="chatToggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
            </button>
            <div class="chat-window" id="chatWindow">
                <div class="chat-header" id="chatHeader">
                    <div class="chat-swipe-handle mobile-only-handle"></div>
                    <div style="display:flex; align-items:center; gap:12px; flex:1;">
                        <div class="status-dot"></div>
                        <h3>Виртуальный помощник</h3>
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
                        📝 Оставить заявку на урок
                    </button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message ai">
                        Здравствуйте! Я виртуальный помощник Андрея Чеботарева. Буду рад ответить на любые Ваши вопросы об обучении, ценах и расписании. Чем я могу Вам помочь? 😊
                        <div class="chat-contact-footer">
                            📲 Telegram: <a href="https://t.me/English24fk" target="_blank">@English24fk</a><br>
                            📞 Тел: <a href="tel:+79243942682">8-924-394-26-82</a>
                        </div>
                    </div>
                </div>
                <div id="typingIndicator" class="typing-indicator">Помощник печатает...</div>
                <div class="chat-suggestions" id="chatSuggestions"></div>
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="chatInput" placeholder="Введите ваш вопрос...">
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
      swipeAreaBottom: document.getElementById("swipeAreaBottom"),
      inputArea: widget.querySelector(".chat-input-area"),
      header: widget.querySelector("#chatHeader"),
    };

    this.renderSuggestions(this.suggestions.initial);
    this.initSwipeGestures();
  }

  initSwipeGestures() {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    let isAtTop = true;

    const handleTouchStart = (e) => {
        if (window.innerWidth > 600) return;
        
        // Determine if we are at the top of the scrolling messages container
        const messagesEl = this.elements.messages;
        isAtTop = true; // Default to true for header/input
        
        // If swiping from the messages area, check scroll position
        if (messagesEl && messagesEl.contains(e.target)) {
            if (messagesEl.scrollTop > 5) {
                isAtTop = false;
            }
        }

        const touch = e.touches[0];
        startY = touch.clientY;
        isDragging = false;
    };

    const handleTouchMove = (e) => {
        if (window.innerWidth > 600) return;
        
        // If we started a swipe from the middle of the scrollable content, abort
        if (!isAtTop) return;

        const touch = e.touches[0];
        currentY = touch.clientY;
        const diff = currentY - startY; 

        // If swiping UP while at the top, let native scroll handle it (bounce or nothing)
        if (diff < 0) return;

        // Allow dragging down
        if (diff > 10) {
            if(e.cancelable) e.preventDefault(); 
            isDragging = true;
            this.elements.window.classList.add('is-dragging');
            const opacity = 1 - (diff / (window.innerHeight * 0.8)); 
            this.elements.window.style.transform = `translateY(${diff}px)`;
            this.elements.window.style.opacity = Math.max(0, opacity);
        }
    };

    const handleTouchEnd = (e) => {
        if (window.innerWidth > 600) return;
        if (!isDragging) return;

        this.elements.window.classList.remove('is-dragging');
        isDragging = false;

        const diff = currentY - startY;
        const threshold = 120;

        if (diff > threshold) {
            this.elements.window.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease';
            this.elements.window.style.transform = `translateY(100dvh)`;
            this.elements.window.style.opacity = '0';
            
            setTimeout(() => {
                this.toggleChat(false);
                this.elements.window.style.transform = '';
                this.elements.window.style.opacity = '';
                this.elements.window.style.transition = '';
            }, 300);
        } else {
            this.elements.window.classList.add('animate-restore');
            this.elements.window.style.transform = '';
            this.elements.window.style.opacity = '';
            setTimeout(() => {
                this.elements.window.classList.remove('animate-restore');
            }, 300);
        }
    };

    this.elements.window.addEventListener('touchstart', handleTouchStart, { passive: true });
    this.elements.window.addEventListener('touchmove', handleTouchMove, { passive: false });
    this.elements.window.addEventListener('touchend', handleTouchEnd);
  }

  bindEvents() {
    this.elements.toggle.addEventListener("click", () => this.toggleChat());
    
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

    document.addEventListener("click", (e) => {
      if (!document.body.contains(e.target)) return;
      if (
        this.elements.window.classList.contains("active") &&
        !this.elements.window.contains(e.target) &&
        !this.elements.toggle.contains(e.target)
      ) {
        this.toggleChat(false);
      }
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", () => {
        if (
          window.innerWidth <= 600 &&
          this.elements.window.classList.contains("active")
        ) {
          const height = window.visualViewport.height;
          this.elements.window.style.height = `${height}px`;
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
          this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }, 300);
      }
    });

    if (this.elements.badge) {
        setTimeout(() => {
            if (!this.elements.window.classList.contains("active")) {
                this.elements.badge.textContent = "Нужна помощь? Я здесь!";
                this.elements.badge.classList.add("is-visible");
                setTimeout(() => this.elements.badge.classList.remove("is-visible"), 5000);
            }
        }, 3000);

        let scrollRAF;
        window.addEventListener('scroll', () => {
            if (scrollRAF) cancelAnimationFrame(scrollRAF);
            scrollRAF = requestAnimationFrame(() => {
                if (this.elements.window.classList.contains("active")) return;
                
                const docScroll = document.documentElement.scrollTop || document.body.scrollTop;
                const docHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
                const winHeight = window.innerHeight;
                
                const scrollBottom = docHeight - winHeight - docScroll;
                
                if (scrollBottom < 1500) {
                    if (this.elements.badge.textContent !== "Помочь Вам оставить заявку? 😊") {
                        this.elements.badge.textContent = "Помочь Вам оставить заявку? 😊";
                    }
                    if (!this.elements.badge.classList.contains("is-visible")) {
                        this.elements.badge.classList.add("is-visible");
                    }
                } else {
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
      if (window.innerWidth <= 600) {
        this.savedScrollY = window.scrollY;
        document.body.style.position = "fixed";
        document.body.style.top = `-${this.savedScrollY}px`;
        document.body.style.width = "100%";
        document.body.style.height = "100%"; 
        if (window.visualViewport) {
          this.elements.window.style.height = `${window.visualViewport.height}px`;
        }
      }
    } else {
      this.elements.window.classList.remove("active");
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
    
    let selected = [...list].sort(() => 0.5 - Math.random()).slice(0, 4);

    selected.forEach((text) => {
      const btn = document.createElement("button");
      btn.className = "suggestion-btn";
      if (text.includes("стоят") || text.includes("Записать")) {
          btn.classList.add("glow-sun");
      }
      btn.textContent = text;
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        this.sendMessage(text);
      };
      this.elements.suggestions.appendChild(btn);
    });
  }

  showInlineForm() {
    this.elements.suggestions.innerHTML = "";
    this.addMessage("Оставьте свое имя и телефон (или Telegram), и Андрей свяжется с Вами, чтобы ответить на все вопросы и записать ребенка на урок! 👇", "ai");
    
    const formDiv = document.createElement("div");
    formDiv.className = "message ai inline-form-message";
    formDiv.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
            <input type="text" id="chatLeadName" placeholder="Имя / Имя ребенка" style="padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.05); color:var(--text); width:calc(100% - 22px); outline:none;">
            <input type="text" id="chatLeadContact" placeholder="Телефон или Telegram" style="padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.05); color:var(--text); width:calc(100% - 22px); outline:none;">
            <button id="chatLeadSubmit" style="padding:10px; border-radius:8px; border:none; background:var(--ai-primary); color:white; cursor:pointer; font-weight:bold; width:100%;">Отправить заявку ✔️</button>
            <div id="chatLeadStatus" style="font-size:12px; display:none; text-align:center; margin-top:5px;"></div>
        </div>
    `;
    
    this.elements.messages.appendChild(formDiv);
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;

    const btnSubmit = formDiv.querySelector("#chatLeadSubmit");
    const nameInput = formDiv.querySelector("#chatLeadName");
    const contactInput = formDiv.querySelector("#chatLeadContact");
    const statusMsg = formDiv.querySelector("#chatLeadStatus");

    btnSubmit.addEventListener("click", () => {
        const name = nameInput.value.trim();
        const contact = contactInput.value.trim();

        if (!name || !contact) {
            statusMsg.style.display = "block";
            statusMsg.style.color = "#EE8208";
            statusMsg.textContent = "Пожалуйста, заполните оба поля.";
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.textContent = "Отправка...";
        statusMsg.style.display = "none";

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                access_key: "702470cb-beb9-4faa-93e7-595495a5f4da",
                subject: "⚡ Новая заявка из AI-чата (Родители) englishlessons",
                from_name: "Виртуальный помощник",
                name: name,
                contact: contact,
                source: "AI Inline Form Parents"
            })
        })
        .then(async (response) => {
            if (response.status == 200) {
                formDiv.innerHTML = `<div style="text-align:center; color:#67A526; font-weight:bold;">✅ Заявка успешно отправлена! Андрей Чеботарев скоро свяжется с Вами. 🎉</div>`;
            } else {
                throw new Error("Failed");
            }
        })
        .catch(err => {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Отправить заявку ✔️";
            statusMsg.style.display = "block";
            statusMsg.style.color = "#d32f2f";
            statusMsg.textContent = "Произошла ошибка. Попробуйте снова.";
        });
    });
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

    const cleanedPhone = text.replace(/[^0-9]/g, '');
    const isPhoneNumber = cleanedPhone.length >= 10 && cleanedPhone.length <= 15 && (text.includes('+') || cleanedPhone.startsWith('7') || cleanedPhone.startsWith('8') || cleanedPhone.startsWith('9'));
    const isTelegram = /@[\w]{4,}/.test(text) || /t\.me\/[\w]{4,}/.test(text);

    if (isPhoneNumber || isTelegram) {
        this.addMessage("✅ Контакт принят! Передаю данные Андрею...", "ai");
        this.elements.typing.style.display = "block";
        
        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                access_key: "702470cb-beb9-4faa-93e7-595495a5f4da",
                subject: "⚡ Авто-Сбор Контакта из AI-чата (Родители)",
                from_name: "Виртуальный помощник",
                name: "Родитель из чата",
                contact: text,
                source: "AI Chat Auto-detect Parents"
            })
        })
        .then(async (response) => {
            this.elements.typing.style.display = "none";
            if (response.status == 200) {
                this.addMessage("🎉 **Отлично!** Ваши контакты успешно переданы. Андрей скоро свяжется с Вами. Хорошего дня!", "ai");
            } else { throw new Error("Failed"); }
        })
        .catch(err => {
             this.elements.typing.style.display = "none";
             this.addMessage("Произошла ошибка соединения. Пожалуйста, воспользуйтесь формой внизу страницы.", "ai");
        });
        
        this.messages.push({ role: "user", content: text });
        this.messages.push({ role: "assistant", content: "Контакты переданы." });
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

      const contactInfo = `
                <div class="chat-contact-footer">
                    📲 Telegram: <a href="https://t.me/English24fk" target="_blank">@English24fk</a><br>
                    📞 Тел: <a href="tel:+79243942682">8-924-394-26-82</a>
                </div>
            `;

      messageElement.innerHTML = this.formatMessage(aiMessage) + contactInfo;
      this.messages.push({ role: "assistant", content: aiMessage });
      this.renderSuggestions(this.suggestions.pricing);
    } catch (error) {
      this.addMessage(`К сожалению, возникла техническая заминка. Вы можете написать напрямую Андрею в мессенджеры!<br><div class="chat-contact-footer">
                            📲 Telegram: <a href="https://t.me/English24fk" target="_blank">@English24fk</a><br>
                            📞 Тел: <a href="tel:+79243942682">8-924-394-26-82</a>
                        </div>`, "ai");
    } finally {
      this.elements.typing.style.display = "none";
    }
  }

  formatMessage(text) {
    return (
      text
        .replace(/^### (.*$)/gm, '<strong style="display:block; margin-top:10px;">$1</strong>')
        .replace(/^## (.*$)/gm, '<strong style="display:block; font-size:1.1em; margin-top:12px;">$1</strong>')
        .replace(/^# (.*$)/gm, '<strong style="display:block; font-size:1.2em; margin-top:14px;">$1</strong>')
        .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/^\* (.*$)/gm, "• $1")
        .replace(/^- (.*$)/gm, "• $1")
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
  window.okEnglishAssistant = new OKEnglishAssistant();
});
