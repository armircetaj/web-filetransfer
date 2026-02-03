# 🔐 Web File Transfer - Crittografia End-to-End

**Trasferimento file sicuro con crittografia lato client.** Il server non vedrà mai i tuoi dati.

[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue)](https://www.postgresql.org/)
[![Libsodium](https://img.shields.io/badge/Crypto-Libsodium-yellow)](https://libsodium.org/)
[![License](https://img.shields.io/badge/License-Educational-lightgrey)](LICENSE)

## ✨ Funzionalità Principali

- **🔒 Crittografia E2E nel browser** - File cifrati prima di lasciare il tuo computer
- **🕐 Link temporanei** - Scadenze personalizzabili (1 ora, 1 giorno, 1 settimana)
- **📊 Limiti di download** - Controllo su quanti download permettere
- **📧 Notifiche email** - Avviso quando il file viene scaricato
- **🚫 Rate limiting** - Protezione da abusi e attacchi
- **🎯 Zero-knowledge** - Il server non può decifrare i tuoi file
- **📱 Interfaccia moderna** - Drag & drop, progress bar, design responsive

## 🚀 Installazione Rapida

```bash
# 1. Clona il repository
git clone https://github.com/armircetaj/web-filetransfer.git
cd web-filetransfer

# 2. Installa dipendenze
npm install

# 3. Configura database PostgreSQL
psql -U postgres -f sql/schema.sql

# 4. Crea file .env
cp .env.example .env
# Modifica .env con le tue configurazioni

# 5. Avvia il server
npm start
# Visita http://localhost:3000
```

### Stack Tecnologico
- **Frontend**: HTML5, CSS3, ES6+, Libsodium.js
- **Backend**: Node.js 22, Express.js 5
- **Database**: PostgreSQL 18
- **Crittografia**: ChaCha20-Poly1305, HMAC-SHA256
- **Storage**: File system con estensione `.enc`
- **Email**: Postfix + Dovecot (notifiche locali)

## 🔐 Come Funziona la Sicurezza

### 1. **Generazione Token (256-bit)**
```javascript
// Lato client - mai inviato in chiaro al server
const token = sodium.randombytes_buf(32); // 256 bit di entropia
const tokenB64 = base64url.encode(token); // Base64 URL-safe
```

### 2. **Derivazione Chiave**
```javascript
const salt = sodium.randombytes_buf(32); // Unico per ogni file
const key = sodium.crypto_kdf_derive_from_key(
  32,           // 256 bit
  1,            // Subkey ID
  "FILE_CTX",   // Contesto
  token         // Master key
);
```

### 3. **Crittografia ChaCha20-Poly1305**
```javascript
const nonce = sodium.randombytes_buf(12); // 96 bit, usa-e-getta
const encrypted = sodium.crypto_aead_chacha20poly1305_encrypt(
  fileData,    // Dati in chiaro
  null,        // Associated Data
  null,        // Secret nonce
  nonce,       // Public nonce
  key          // Chiave derivata
);
```

### 4. **Storage Sicuro sul Server**
- Solo hash HMAC del token (non il token stesso)
- Metadati crittografati (nome file, dimensione, MIME type)
- File salvati come `.enc` (ciphertext + nonce)


## 📊 API Endpoints

| Metodo | Endpoint | Descrizione | Autenticazione |
|--------|----------|-------------|----------------|
| `POST` | `/upload` | Upload file cifrato | Nessuna |
| `GET` | `/download/:token` | Download file | Token nell'URL |
| `GET` | `/status/:token` | Stato file (non consuma download) | Token nell'URL |
| `GET` | `/metadata/:token` | Metadati cifrati | Token nell'URL |

## 🧪 Testing

Il sistema è stato testato con:

- ✅ Upload e cifratura file (fino a 100MB)
- ✅ Generazione token crittograficamente sicuri
- ✅ Download e decifratura corretta
- ✅ Scadenze temporali funzionanti
- ✅ Limiti di download rispettati
- ✅ Notifiche email (locale)
- ✅ Rate limiting (10 richieste/15 minuti)


## 🚀 Deploy in Produzione

### 1. **Server Configurazione Base**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm postgresql postfix

# Configura PostgreSQL
sudo -u postgres psql -c "CREATE USER webfiletransfer WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "CREATE DATABASE filetransfer_db OWNER webfiletransfer;"
```

## 🎯 Roadmap & Sviluppi Futuri

- [ ] **Upload multipli** - Più file contemporaneamente
- [ ] **Password aggiuntiva** - Doppio fattore per download
- [ ] **Preview immagini** - Anteprima sicura lato client
- [ ] **API REST completa** - Per integrazioni esterne
- [ ] **Docker support** - Containerizzazione facile
- [ ] **CDN integration** - Distribuzione globale file
- [ ] **WebSocket updates** - Notifiche in tempo reale
- [ ] **QR code generation** - Condivisione mobile-friendly

## ⚠️ Limitazioni Note

1. **Single file upload** - Un file alla volta (per ora)
2. **Email solo locale** - Configurazione DKIM/DMARC necessaria per domini esterni
3. **JavaScript required** - Necessario per crittografia lato client
4. **No mobile app** - Solo browser web per ora

## 👨‍💻 Autore & Crediti

**Armir Cetaj** - Sviluppatore  
**Scuola Arti e Mestieri** - Ticino, Svizzera  
**Periodo progetto**: Settembre 2025 - Dicembre 2025  

## 📚 Risorse & Link

- [📖 Documentazione Completa](3_Documentazione/Documentazione_WebFileTransfer.docx) - Analisi, design, test
- [🔗 Demo Live](#) - *(Coming soon)*

## 📄 Licenza

Progetto educativo sviluppato per la **Scuola Arti e Mestieri di Trevano**.  
Codice rilasciato per scopi didattici e dimostrativi.
