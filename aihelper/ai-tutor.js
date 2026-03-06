class EnglishAssistant {
    constructor() {
        this.messages = [];
        // Шифрование ключа (Base64)
        const _k = "c2stb3ItdjEtYTgyNjBkMjcwODAxM2Q5NDBlZmFjNWEzMjc5OWE1ZjY4OWJiZDM2ZDNiZTcyZmEyNTg3NWMyNmFjZTgxOTE0Mg==";
        this.apiKey = atob(_k); 
        this.currentImage = null;
        
        this.config = {
            model: "google/gemma-3-27b-it:free",
            systemPrompt: `Ты — супер-полезный ИИ-репетитор, встроенный в платформу Андрея Чеботарева. 🎓🤖✨
ТВОЯ ЦЕЛЬ: Помочь студенту разобраться с английским, проверить домашку или объяснить сложную тему.

ТВОИ ПРАВИЛА:
1. ВИЗУАЛЬНАЯ ПОМОЩЬ: Ты видишь фото тетрадок, учебников и скриншоты. Если прислали фото — внимательно разбери его, найди ошибки и объясни их. 📸👁️
2. ОБЪЯСНЯЙ, А НЕ ПРОСТО ДАВАЙ ОТВЕТ: Если студент просит сделать задание, сначала спроси его вариант, а потом объясни логику. Мы за осознанное обучение! 💡
3. ПОДДЕРЖКА: Будь дружелюбным и поддерживающим "бро-репетитором". Используй эмодзи (2-3 на предложение). 🌟
4. КОНТЕКСТ: Упоминай, что на уроках с Андреем вы разберете такие темы еще глубже через Smart Reader. 🪄
5. ОГРАНИЧЕНИЕ: Если вопрос чисто про покупку уроков или запись — вежливо скажи, что для этого есть "Менеджер по продажам" на главной, но ты можешь вкратце напомнить, что первый урок бесплатный. 🎁

Твой тон: Умный, терпеливый, вдохновляющий. 📚🔭`
        };

        this.suggestions = {
            initial: ["Проверь мою домашку 📸", "Объясни Present Perfect ⏳", "Как пользоваться Smart Reader? 🔍", "Переведи этот текст ✍️"],
            grammar: ["Дай упражнение на Past Simple", "В чем разница между Do и Make?", "Правила артиклей 📚"],
            homework: ["Посмотри фото задания 📸", "Я правильно написал?", "Помоги с сочинением 📝"]
        };
        this.init();
    }

    init() {
        this.createUI();
        this.bindEvents();
    }

    createUI() {
        // Проверяем, нет ли уже виджета
        if (document.querySelector('.ai-chat-widget')) return;

        const widget = document.createElement('div');
        widget.className = 'ai-chat-widget tutor-mode';
        widget.innerHTML = `
            <div class="chat-badge" id="chatBadge">Учитель-помощник: Присылай домашку! 📸📚</div>
            <button class="chat-toggle" id="chatToggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
            </button>
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div class="status-dot"></div>
                    <h3>English Guru Tutor 🎓</h3>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="message ai">Привет! Я твой персональный ИИ-тьютор. Можешь задать любой вопрос по английскому или просто скинуть фото домашки/учебника — я помогу разобраться! 📸📔✨</div>
                </div>
                <div id="imagePreviewContainer" class="image-preview-container" style="display: none;">
                    <img id="imagePreview" src="" alt="preview">
                    <button id="removeImage" class="remove-image">&times;</button>
                </div>
                <div id="typingIndicator" class="typing-indicator">Tutor is thinking...</div>
                <div class="chat-suggestions" id="chatSuggestions"></div>
                <div class="chat-input-area">
                    <label for="imageUpload" class="image-upload-btn" title="Загрузить задание">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <input type="file" id="imageUpload" accept="image/*" style="display: none;">
                    </label>
                    <input type="text" class="chat-input" id="chatInput" placeholder="Спроси правило или скинь фото...">
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
            badge: document.getElementById('chatBadge'),
            imageUpload: document.getElementById('imageUpload'),
            imagePreviewContainer: document.getElementById('imagePreviewContainer'),
            imagePreview: document.getElementById('imagePreview'),
            removeImage: document.getElementById('removeImage')
        };

        this.renderSuggestions(this.suggestions.initial);
    }

    bindEvents() {
        this.elements.toggle.addEventListener('click', () => this.toggleChat());
        this.elements.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.elements.removeImage.addEventListener('click', () => this.clearImage());
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

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            this.currentImage = event.target.result;
            this.elements.imagePreview.src = this.currentImage;
            this.elements.imagePreviewContainer.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }

    clearImage() {
        this.currentImage = null;
        this.elements.imageUpload.value = '';
        this.elements.imagePreviewContainer.style.display = 'none';
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

    async sendMessage(overrideText = null) {
        const text = overrideText || this.elements.input.value.trim();
        if (!text && !this.currentImage) return;
        const userMessageText = text || "Посмотри это задание 📸";
        if (!overrideText) this.elements.input.value = '';
        
        const msgDiv = this.addMessage(userMessageText, 'user');
        if (this.currentImage) {
            const img = document.createElement('img');
            img.src = this.currentImage;
            img.className = 'message-image';
            msgDiv.appendChild(img);
        }

        const content = [{ type: "text", text: userMessageText }];
        if (this.currentImage) {
            content.push({ type: "image_url", image_url: { url: this.currentImage } });
        }

        const history = [
            { role: "system", content: this.config.systemPrompt },
            ...this.messages,
            { role: "user", content: content }
        ];

        this.elements.suggestions.innerHTML = '';
        this.clearImage();

        try {
            this.elements.typing.style.display = 'block';
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.href, 
                    "X-Title": "English Tutor Vision"
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
                                messageElement.innerHTML = this.formatMessage(aiMessage);
                                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                            }
                        } catch (e) {}
                    }
                }
            }

            this.messages.push({ role: 'user', content: content });
            this.messages.push({ role: 'assistant', content: aiMessage });
            this.renderSuggestions(this.suggestions.grammar);

        } catch (error) {
            this.addMessage('Извини, я притомился. Попробуй позже! 💤', 'ai');
        } finally {
            this.elements.typing.style.display = 'none';
        }
    }

    formatMessage(text) {
        return text.replace(/\n/g, '<br>');
    }

    addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.innerHTML = type === 'ai' ? this.formatMessage(text) : text;
        this.elements.messages.appendChild(div);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        return div;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.englishTutor = new EnglishAssistant();
});
