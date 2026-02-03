/**
 * GeoRouter — определяет провайдера AI на основе IP геолокации
 * Если IP из России → OpenRouter (Gemma 3)
 * Иначе → Groq (Llama 4)
 */
class GeoRouter {
    constructor() {
        this.isRussianIP = null;
        this.detectionPromise = null;
        
        // Зашифрованные ключи (XOR + Base64 через KeyObfuscator)
        this.keys = {
            openrouter: "NgVKAxteHmVYEAkXAwNTBHBZX1tfSwsxQRZXEAAGCwNwWlEIXEJYNRdNDRcABQFSdF8EXl9FWWFDRwtLVgQBU3FYBA1ZEl5mRg==",
            groq: "Ih0MMxk+ITshEVxEVFsCRQI7KyhaGRhkIjMLC1ADdG8EKxEWWSktZB0XJwhkfUh7FhYVB1ELDyQ="
        };
        
        this.providers = {
            // Для России и ошибок — OpenRouter поддерживает CORS
            russia: {
                name: 'OpenRouter',
                endpoint: 'https://openrouter.ai/api/v1/chat/completions',
                model: 'google/gemma-3-27b-it',
                getHeaders: (apiKey) => ({
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": window.location.href,
                    "X-Title": "English Tutor"
                })
            },
            // Для не-России — Groq напрямую (работает без прокси за рубежом)
            default: {
                name: 'Groq',
                endpoint: 'https://api.groq.com/openai/v1/chat/completions',
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                getHeaders: (apiKey) => ({
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                })
            }
        };
    }

    /**
     * Определить страну по IP (с кешированием Promise)
     * Fallback chain: ipapi.co → ip-api.com → default (Groq)
     */
    async detectCountry() {
        // Возвращаем закешированный результат
        if (this.isRussianIP !== null) {
            return this.isRussianIP;
        }
        
        // Если уже идёт запрос — ждём его
        if (this.detectionPromise) {
            return this.detectionPromise;
        }
        
        this.detectionPromise = this._doDetection();
        return this.detectionPromise;
    }

    async _doDetection() {
        // API chain для определения страны
        // Некоторые могут быть заблокированы tracking protection
        const apis = [
            { url: 'https://ipwho.is/', parse: (d) => d.country_code },
            { url: 'https://freeipapi.com/api/json', parse: (d) => d.countryCode },
            { url: 'https://ipapi.co/json/', parse: (d) => d.country_code },
            { url: 'https://ip-api.com/json/?fields=countryCode', parse: (d) => d.countryCode }
        ];
        
        for (const api of apis) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const res = await fetch(api.url, { 
                    signal: controller.signal,
                    mode: 'cors'
                });
                clearTimeout(timeoutId);
                
                if (!res.ok) continue;
                
                const data = await res.json();
                const code = api.parse(data);
                
                if (code) {
                    this.isRussianIP = (code === 'RU');
                    console.log(`🌍 GeoRouter: ${code} → ${this.isRussianIP ? 'OpenRouter (Gemma)' : 'Groq (Llama)'}`);
                    return this.isRussianIP;
                }
            } catch (e) {
                console.warn('GeoRouter: API failed, trying next...', e.message);
            }
        }
        
        // Fallback: определяем по часовому поясу браузера
        // Российские часовые пояса: Europe/Moscow, Asia/Yekaterinburg, и т.д.
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const russianTimezones = [
                'Europe/Moscow', 'Europe/Samara', 'Europe/Volgograd', 'Europe/Saratov',
                'Europe/Kirov', 'Europe/Astrakhan', 'Europe/Ulyanovsk',
                'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk', 'Asia/Barnaul',
                'Asia/Tomsk', 'Asia/Novokuznetsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk',
                'Asia/Chita', 'Asia/Yakutsk', 'Asia/Khandyga', 'Asia/Vladivostok',
                'Asia/Ust-Nera', 'Asia/Magadan', 'Asia/Sakhalin', 'Asia/Srednekolymsk',
                'Asia/Kamchatka', 'Asia/Anadyr', 'Europe/Kaliningrad'
            ];
            
            if (russianTimezones.includes(tz)) {
                console.log(`🌍 GeoRouter: Timezone ${tz} → OpenRouter (Gemma)`);
                this.isRussianIP = true;
                return true;
            }
        } catch (e) {
            console.warn('GeoRouter: Timezone detection failed', e);
        }
        
        // Последний fallback: при любой ошибке определения → OpenRouter (безопаснее)
        console.warn('🌍 GeoRouter: All detection failed, defaulting to OpenRouter (safer)');
        this.isRussianIP = true;  // true = OpenRouter
        return true;
    }

    /**
     * Получить конфигурацию провайдера
     */
    async getProvider() {
        await this.detectCountry();
        return this.isRussianIP ? this.providers.russia : this.providers.default;
    }

    /**
     * Получить расшифрованный API ключ
     */
    async getApiKey() {
        await this.detectCountry();
        const obfuscator = new window.KeyObfuscator();
        const encryptedKey = this.isRussianIP ? this.keys.openrouter : this.keys.groq;
        return obfuscator.decrypt(encryptedKey);
    }

    /**
     * Получить всё сразу (provider + apiKey + headers)
     */
    async getConfig() {
        const [provider, apiKey] = await Promise.all([
            this.getProvider(),
            this.getApiKey()
        ]);
        
        return {
            endpoint: provider.endpoint,
            model: provider.model,
            headers: provider.getHeaders(apiKey),
            providerName: provider.name
        };
    }
}

// Singleton instance
window.GeoRouter = new GeoRouter();
