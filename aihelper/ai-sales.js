class EnglishSalesAssistant {
    constructor() {
        this.messages = [];
        // Шифрование ключа (Base64)
        const _k = "c2stb3ItdjEtMjc4ZjQ0NGQ5MWNkNmVlN2JlNDk5YzNmNTBlZGM3ZDY2Zjc5ZjQ3NWQxZjM5Y2I5MTEyYmJkYjYzZWUxOTkxNA==";
        this.apiKey = atob(_k); 
        this.currentImage = null;
        
        this.config = {
            model: "google/gemma-3-27b-it:free",
            systemPrompt: `Ты — драйвовый менеджер по продажам школы Андрея Чеботарева. ✨🚀🔥
ТВОЯ ЦЕЛЬ: записать на бесплатный пробный урок. 📅🎁

ТВОИ ПРАВИЛА: 
1. ЦЕНЫ: Индивидуально 1800₽, Пакет 1500₽/урок, Группы 1250₽. ПЕРВЫЙ УРОК: БЕСПЛАТНО! 🎁🎬
2. НЕ УЧИ БЕСПЛАТНО: Если просят правило — скажи, что у нас есть крутой Бот-Репетитор для этого, а ты здесь, чтобы записать на полноценный урок, где Андрей объяснит всё лично.
3. ЭКОСИСТЕМА: Пиарь Smart Reader и Reading Trainer. 🪄💻
4. ЗАКРЫВАЙ СДЕЛКУ: Каждый ответ должен заканчиваться призывом к записи на бесплатный пробный урок! ✨`
        };

        this.suggestions = {
            initial: ["Сколько стоит? 💳", "Как проходит пробный урок? 🎓", "Промокод на скидку? 🎁", "Хочу записаться! ✍️"],
            pricing: ["Пакет 8 уроков 📦", "Есть скидки? 🎟️", "Как оплатить? 🌍"]
        };
        this.init();
    }

    init() {
        this.createUI();
        this.bindEvents();
    }

    createUI() {
        if (document.querySelector('.ai-chat-widget')) return;

        const widget = document.createElement('div');
        widget.className = 'ai-chat-widget sales-mode';
        widget.innerHTML = `
            <div class="chat-badge" id="chatBadge">Запишись на бесплатный урок! ✨🚀</div>
            <button class="chat-toggle" id="chatToggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
            </button>
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div class="status-dot"></div>
                    <h3>English Guru Sales ✨</h3>
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
            toggle: document.getElementById('chatToggle'),
            window: document.getElementById('chatWindow'),
            messages: document.getElementById('chatMessages'),
            input: document.getElementById('chatInput'),
            send: document.getElementById('chatSend'),
            typing: document.getElementById('typingIndicator'),
            suggestions: document.getElementById('chatSuggestions'),
            badge: document.getElementById('chatBadge')
        };

        this.renderSuggestions(this.suggestions.initial);
    }

    bindEvents() {
        this.elements.toggle.addEventListener('click', () => this.toggleChat());
        this.elements.send.addEventListener('click', () => this.sendMessage());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    toggleChat() {
        this.elements.window.classList.toggle('active');
        if (this.elements.window.classList.contains('active')) {
            this.elements.input.focus();
            if (this.elements.badge) this.elements.badge.style.display = 'none';
        }
    }

    renderSuggestions(list) {
        this.elements.suggestions.innerHTML = '';
        const shuffled = [...list].sort(() => 0.5 - Math.random()).slice(0, 4);
        shuffled.forEach(text => {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = text;
            btn.onclick = () => this.sendMessage(text);
            this.elements.suggestions.appendChild(btn);
        });
    }

    detectTopic(text) {
        if (text.toLowerCase().includes('цен') || text.toLowerCase().includes('стоимост') || text.toLowerCase().includes('платно')) {
            const el = document.getElementById('pricing');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return 'pricing';
    }

    async sendMessage(overrideText = null) {
        const text = overrideText || this.elements.input.value.trim();
        if (!text) return;
        if (!overrideText) this.elements.input.value = '';
        
        this.addMessage(text, 'user');
        this.detectTopic(text);

        const history = [
            { role: "system", content: this.config.systemPrompt },
            ...this.messages,
            { role: "user", content: text }
        ];

        this.elements.suggestions.innerHTML = '';

        try {
            this.elements.typing.style.display = 'block';
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: this.config.model,
                    messages: history,
                    stream: true
                })
            });

            if (!response.ok) throw new Error('API failed');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiMessage = '';
            let messageElement = this.addMessage('', 'ai');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.includes('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') continue;
                        try {
                            const data = JSON.parse(dataStr);
                            const delta = data.choices[0]?.delta?.content || '';
                            if (delta) {
                                aiMessage += delta;
                                messageElement.innerHTML = aiMessage.replace(/\n/g, '<br>');
                                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                            }
                        } catch (e) {}
                    }
                }
            }

            this.messages.push({ role: 'user', content: text });
            this.messages.push({ role: 'assistant', content: aiMessage });
            this.renderSuggestions(this.suggestions.pricing);

        } catch (error) {
            this.addMessage('Произошла ошибка. Попробуй позже! 🛠️', 'ai');
        } finally {
            this.elements.typing.style.display = 'none';
        }
    }

    addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.innerHTML = text.replace(/\n/g, '<br>');
        this.elements.messages.appendChild(div);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        return div;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.englishSales = new EnglishSalesAssistant();
});
