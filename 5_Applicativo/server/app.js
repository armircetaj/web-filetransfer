require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const { testConnection } = require('./db/connection');
const { FileModel, NotificationModel, AuditLogModel } = require('./db/models');

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(path.join(__dirname, '../client')));
app.get('/vendor/sodium.js', (req, res) => {
    try {
	const resolved = require.resolve('libsodium-wrappers/dist/browser/sodium.js');    
        res.type('application/javascript');
        return res.sendFile(resolved);
    } catch (e) {
        return res.status(404).send('sodium.js not found');
    }
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024,
        fieldSize: 130 * 1024 * 1024,
        fields: 20
    },
    fileFilter: (req, file, cb) => {
        cb(null, true);
    }
});
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function rateLimit(req, res, next) {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(clientIp)) {
        rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }
    const clientData = rateLimitMap.get(clientIp);
    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + RATE_LIMIT_WINDOW;
        return next();
    }
    if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    clientData.count++;
    next();
}
app.use('/api/upload', rateLimit);
async function ensureStorageDir() {
    const storageDir = path.join(__dirname, '../storage');
    try {
        await fs.access(storageDir);
    } catch {
        await fs.mkdir(storageDir, { recursive: true });
        console.log('Created storage directory');
    }
}
function hashToken(token, salt) {
    const tokenBuffer = Buffer.from(token, 'base64');
    const combined = Buffer.concat([tokenBuffer, salt]);
    return crypto.createHash('sha256').update(combined).digest();
}
async function sendEmailNotification(email, filename, downloadCount) {
    const subject = 'File Download Notification';
    const body = `
Hello,

Your file has been downloaded ${downloadCount} time(s).

This is an automated notification from Web File Transfer.

Best regards,
Web File Transfer System
    `.trim();

    try {
        const fromAddress = process.env.NOTIFY_FROM || 'noreply@webfiletransfer.local';
        const command = `echo "${body}" | mail -aFrom:'${fromAddress}' -s "${subject}" "${email}"`;
        await execAsync(command);
        console.log(`Email notification sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Failed to send email notification:', error.message);
        return false;
    }
}
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const {
            encryptedData,
            encryptedMetadata,
            salt,
            token,
            maxDownloads,
            expiresAt,
            senderEmail
        } = req.body;
        if (!encryptedData || !encryptedMetadata || !salt || !token) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (token.length < 32) {
            return res.status(400).json({ error: 'Invalid token format' });
        }
        const saltBuffer = Buffer.from(salt, 'base64');
        const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
        const encryptedMetadataBuffer = Buffer.from(encryptedMetadata, 'base64');
        const fileId = crypto.randomUUID();
        const storagePath = path.join(__dirname, '../storage', `${fileId}.enc`);
        await fs.writeFile(storagePath, encryptedDataBuffer);
        const tokenHash = hashToken(token, saltBuffer);
        const fileData = {
            tokenHash,
            salt: saltBuffer,
            metadata: encryptedMetadataBuffer,
            path: storagePath,
            ciphertextLength: encryptedDataBuffer.length,
            maxDownloads: parseInt(maxDownloads) || 1,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        };
        const fileRecord = await FileModel.create(fileData);
        if (senderEmail && senderEmail.trim()) {
            await NotificationModel.create({
                fileId: fileRecord.id,
                email: Buffer.from(senderEmail.trim(), 'utf8')
            });
        }
        await AuditLogModel.create({
            fileId: fileRecord.id,
            type: 'upload',
            actorIp: req.ip,
            details: `File uploaded, size: ${encryptedDataBuffer.length} bytes`
        });
        const downloadUrl = `${req.protocol}://${req.get('host')}/download/${token}`;
        res.json({
            success: true,
            download_url: downloadUrl,
            token_display: token.substring(0, 16) + '...'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});
app.get('/download/:token', async (req, res) => {
    try {
        const { token } = req.params;
        if (!token || token.length < 32) {
            return res.status(400).json({ error: 'Invalid token format' });
        }
        const files = await FileModel.findAll();
        let fileRecord = null;
        let matchedSalt = null;
        for (const file of files) {
            const tokenHash = hashToken(token, file.salt);
            if (tokenHash.equals(file.token_hash)) {
                fileRecord = file;
                matchedSalt = file.salt;
                break;
            }
        }
        if (!fileRecord) {
            return res.status(404).json({ error: 'File not found or invalid token' });
        }
        const isValid = await FileModel.isValidForDownload(fileRecord.id);
        if (!isValid) {
            return res.status(410).json({ error: 'File has expired or download limit reached' });
        }
        await FileModel.incrementDownloadCount(fileRecord.id);
        await AuditLogModel.create({
            fileId: fileRecord.id,
            type: 'download',
            actorIp: req.ip,
            details: `File downloaded`
        });
        const notification = await NotificationModel.findByFileId(fileRecord.id);
        if (notification && !notification.notified_at) {
            try {
                const email = notification.email.toString('utf8');
                const filename = 'encrypted_file';
                const downloadCount = fileRecord.download_count + 1;
                
                await sendEmailNotification(email, filename, downloadCount);
                await NotificationModel.markAsNotified(notification.id);
            } catch (error) {
                console.error('Failed to send notification:', error);
            }
        }
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', fileRecord.ciphertext_length);
        res.setHeader('Content-Disposition', 'attachment; filename="encrypted_file.bin"');
        res.setHeader('X-File-Salt', fileRecord.salt.toString('base64'));

        const fileStream = require('fs').createReadStream(fileRecord.path);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
    }
});
app.get('/status/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const files = await FileModel.findAll();
        let fileRecord = null;
        for (const file of files) {
            const tokenHash = hashToken(token, file.salt);
            if (tokenHash.equals(file.token_hash)) {
                fileRecord = file;
                break;
            }
        }
        if (!fileRecord) {
            return res.status(404).json({ error: 'File not found' });
        }
        const status = await FileModel.getStatus(fileRecord.id);
        if (!status) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.json(status);
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        res.json({
            status: 'ok',
            database: dbConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
// Return encrypted metadata (base64) and salt (base64) without consuming a download
app.get('/metadata/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const files = await FileModel.findAll();
        let fileRecord = null;

        for (const file of files) {
            const tokenHash = hashToken(token, file.salt);
            if (tokenHash.equals(file.token_hash)) {
                fileRecord = file;
                break;
            }
        }

        if (!fileRecord) {
            return res.status(404).json({ error: 'File not found' });
        }

        const status = await FileModel.getStatus(fileRecord.id);
        if (!status) {
            return res.status(404).json({ error: 'File not found' });
        }
        if (status.expires_at && new Date(status.expires_at) <= new Date()) {
            return res.status(410).json({ error: 'File has expired' });
        }
        if (status.downloads_remaining <= 0) {
            return res.status(410).json({ error: 'Download limit reached' });
        }

        res.setHeader('Cache-Control', 'no-store');
        return res.json({
            encrypted_metadata_base64: fileRecord.metadata.toString('base64'),
            salt_base64: fileRecord.salt.toString('base64')
        });
    } catch (error) {
        console.error('Metadata error:', error);
        res.status(500).json({ error: 'Failed to get metadata' });
    }
});
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
async function startServer() {
    try {
        await ensureStorageDir();
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }
        app.listen(PORT, () => {
            console.log(`Web File Transfer server running on port ${PORT}`);
            console.log(`Database connection: ${dbConnected ? 'OK' : 'FAILED'}`);
            console.log(`Storage directory: ${path.join(__dirname, '../storage')}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

startServer();

module.exports = app;
