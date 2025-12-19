class CryptoClient {
    constructor() {
        this.sodium = null;
        this.isInitialized = false;
    }
    async initialize() {
        if (this.isInitialized) return;
        try {
            await sodium.ready;
            this.sodium = sodium;
            this.isInitialized = true;
            console.log('Crypto client initialized successfully');
        } catch (error) {
            throw new Error('Failed to initialize crypto client: ' + error.message);
        }
    }
    // Genera un token casuale di 256 bit (32 byte)
    generateToken() {
        if (!this.isInitialized) throw new Error('Crypto client not initialized');
        const tokenBytes = this.sodium.randombytes_buf(32); // 256 bits
        return this.sodium.to_base64(tokenBytes, this.sodium.base64_variants.URLSAFE_NO_PADDING);
    }
    // Genera un salt casuale di 256 bit (32 byte) per la derivazione della chiave
    generateSalt() {
        if (!this.isInitialized) throw new Error('Crypto client not initialized');
        return this.sodium.randombytes_buf(32);
    }
    // Deriva la chiave di cifratura dal token e salt usando il KDF di libsodium
    deriveKey(token, salt, context = "WEBXFER1") {
        if (!this.isInitialized) throw new Error('Crypto client not initialized');
        const tokenBytes = this.sodium.from_base64(token, this.sodium.base64_variants.URLSAFE_NO_PADDING);
        const ctxString = String(context);
        if (ctxString.length !== 8) {
            throw new Error('KDF context must be exactly 8 ASCII characters');
        }
        const key = this.sodium.crypto_kdf_derive_from_key(32, 1, ctxString, tokenBytes);
        const saltedKey = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            saltedKey[i] = key[i] ^ salt[i];
        }
        return saltedKey;
    }
    // Crittografa il file con ChaCha20-Poly1305 usando un nonce casuale
    encryptFile(data, key) {
        if (!this.isInitialized) throw new Error('Crypto client not initialized');
        const nonce = this.sodium.randombytes_buf(this.sodium.crypto_aead_chacha20poly1305_NPUBBYTES);
        const ciphertext = this.sodium.crypto_aead_chacha20poly1305_encrypt(
            data,
            null, 
            null, 
            nonce,
            key
        );
        const result = new Uint8Array(nonce.length + ciphertext.length);
        result.set(nonce, 0);
        result.set(ciphertext, nonce.length);
        
        return result;
    }
    // Decrittografa il file usando il nonce
    decryptFile(encryptedData, key) {
        if (!this.isInitialized) throw new Error('Crypto client not initialized');
        const nonceLength = this.sodium.crypto_aead_chacha20poly1305_NPUBBYTES;
        const nonce = encryptedData.slice(0, nonceLength);
        const ciphertext = encryptedData.slice(nonceLength);
        const plaintext = this.sodium.crypto_aead_chacha20poly1305_decrypt(
            null,
            ciphertext,
            null, 
            nonce,
            key
        );
        return plaintext;
    }
    // Crittografa i metadati (nome file, tipo, dimensione, data di modifica)
    encryptMetadata(metadata, key) {
        if (!this.isInitialized) throw new Error('Crypto client not initialized');
        const metadataJson = JSON.stringify(metadata);
        const metadataBytes = new TextEncoder().encode(metadataJson);
        return this.encryptFile(metadataBytes, key);
    }
    // Decrittografa i metadati e li converte in JSON
    decryptMetadata(encryptedMetadata, key) {
        if (!this.isInitialized) throw new Error('Crypto client not initialized');
        const metadataBytes = this.decryptFile(encryptedMetadata, key);
        const metadataJson = new TextDecoder().decode(metadataBytes);
        return JSON.parse(metadataJson);
    }
    // Converte bytes in base64 URL-safe 
    bytesToBase64(bytes) {
        if (!this.isInitialized) throw new Error('Crypto client not initialized');
        return this.sodium.to_base64(bytes, this.sodium.base64_variants.URLSAFE_NO_PADDING);
    }
}
window.cryptoClient = new CryptoClient();
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await window.cryptoClient.initialize();
        console.log('Crypto client ready');
    } catch (error) {
        console.error('Failed to initialize crypto client:', error);
        showError('Failed to initialize encryption. Please refresh the page.');
    }
});
