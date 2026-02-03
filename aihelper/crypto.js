/**
 * Simple XOR-based obfuscation for API keys
 * Not cryptographically secure, but prevents casual GitHub scanning
 */
class KeyObfuscator {
    constructor() {
        // Obfuscation key (stored separately from encrypted data)
        this.salt = 'EnglishTutor2026';
    }

    /**
     * XOR encrypt/decrypt (symmetric)
     */
    xorCipher(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    }

    /**
     * Encrypt API key
     */
    encrypt(apiKey) {
        const encrypted = this.xorCipher(apiKey, this.salt);
        return btoa(encrypted); // Base64 encode
    }

    /**
     * Decrypt API key
     */
    decrypt(encryptedKey) {
        try {
            const decoded = atob(encryptedKey);
            return this.xorCipher(decoded, this.salt);
        } catch (e) {
            console.error('Failed to decrypt API key');
            return null;
        }
    }
}

// Export for use in other scripts
window.KeyObfuscator = KeyObfuscator;
