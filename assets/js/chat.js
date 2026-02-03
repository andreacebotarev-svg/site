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
5. ЗАКРЫВАЙ СДЕЛКУ: Каждый ответ должен заканчиваться призывом к записи на бесплатный пробный урок! ✨`,
    };

    this.suggestions = {
      initial: [
        "Сколько стоит? 💳",
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
            <div class="chat-badge" id="chatBadge">Запишись на бесплатный урок! ✨🚀</div>
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
                    <!-- Mobile Close Button (Hidden by default via CSS, shown on mobile) -->
                    <button id="chatCloseMobile" class="mobile-close-btn" style="display:none; background:none; border:none; color:white; padding:5px; cursor:pointer;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message ai">Привет! Я помогу тебе выбрать лучший формат обучения. Готов начать говорить на английском? ✨🚀</div>
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
    };

    this.renderSuggestions(this.suggestions.initial);
  }

  bindEvents() {
    this.elements.toggle.addEventListener("click", () => this.toggleChat());
    // Bind close button
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent triggering other clicks
        this.toggleChat(false); // Force close
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
  }

  toggleChat(forceState = null) {
    const isActive = this.elements.window.classList.contains("active");
    const newState = forceState !== null ? forceState : !isActive;

    if (newState) {
      this.elements.window.classList.add("active");
      this.elements.input.focus();
      if (this.elements.badge) this.elements.badge.style.display = "none";
      // Lock body scroll for mobile full screen experience
      if (window.innerWidth <= 600) {
        document.body.style.overflow = "hidden";
      }
    } else {
      this.elements.window.classList.remove("active");
      // Restore body scroll
      document.body.style.overflow = "";
    }
  }

  renderSuggestions(list) {
    this.elements.suggestions.innerHTML = "";
    const shuffled = [...list].sort(() => 0.5 - Math.random()).slice(0, 4);
    shuffled.forEach((text) => {
      const btn = document.createElement("button");
      btn.className = "suggestion-btn";
      btn.textContent = text;
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Fix: Prevent triggering document click that closes the chat
        this.sendMessage(text);
      };
      this.elements.suggestions.appendChild(btn);
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
      this.addMessage("Произошла ошибка. Попробуй позже! 🛠️", "ai");
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
