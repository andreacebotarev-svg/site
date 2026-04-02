const fs = require('fs');

const file = fs.readFileSync('c:/site/privacy.html', 'utf8');
const encryptedMatch = file.match(/const encrypted = "([^"]+)"/);

if (encryptedMatch) {
    const encrypted = encryptedMatch[1];
    const salt = 'EnglishTutor2026';
    
    // Decrypt
    const xorCipher = (text, key) => {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    };
    
    const decoded = atob(encrypted);
    const text = xorCipher(decoded, salt);
    
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
        bytes[i] = text.charCodeAt(i);
    }
    const decodedText = new TextDecoder('utf-8').decode(bytes);
    
    console.log("OLD TEXT:");
    console.log(decodedText);
    
    // Modify text
    const newText = decodedText.replace('сервис Web3Forms, который обеспечивает безопасную передачу писем.', 'сервис Яндекс Формы, который обеспечивает безопасную передачу данных.');
    
    console.log("\nNEW TEXT:");
    console.log(newText);
    
    // Encrypt
    const encoder = new TextEncoder();
    const newBytes = encoder.encode(newText);
    let newBinaryString = '';
    for (let i = 0; i < newBytes.length; i++) {
        newBinaryString += String.fromCharCode(newBytes[i]);
    }
    
    const newEncryptedBin = xorCipher(newBinaryString, salt);
    const newEncrypted = btoa(newEncryptedBin);
    
    // Save to file
    const newFileContent = file.replace(encrypted, newEncrypted);
    fs.writeFileSync('c:/site/privacy.html', newFileContent, 'utf8');
    
    console.log("\nSaved back to c:/site/privacy.html");
} else {
    console.log('Not found');
}
