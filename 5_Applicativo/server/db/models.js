const { query, getClient } = require('./connection');
// Modello per gestione file nel database
class FileModel {
    static async create(fileData) {
        const {
            tokenHash,
            salt,
            metadata,
            path,
            ciphertextLength,
            maxDownloads = 1,
            expiresAt = null
        } = fileData;

        const text = `
            INSERT INTO files (token_hash, salt, metadata, path, ciphertext_length, max_downloads, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, created_at
        `;
        const values = [tokenHash, salt, metadata, path, ciphertextLength, maxDownloads, expiresAt];
        const result = await query(text, values);
        return result.rows[0];
    }
    // Trova un file per il suo hash del token O(1), usa un indice
    static async findByTokenHash(tokenHash) {
        const text = `
            SELECT id, token_hash, salt, metadata, path, ciphertext_length, 
                   max_downloads, download_count, expires_at, created_at
            FROM files 
            WHERE token_hash = $1 AND deleted_at IS NULL
        `;
        
        const result = await query(text, [tokenHash]);
        return result.rows[0] || null;
    }
    static async incrementDownloadCount(fileId) {
        const text = `
            UPDATE files 
            SET download_count = download_count + 1 
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING download_count, max_downloads, expires_at
        `;
        
        const result = await query(text, [fileId]);
        return result.rows[0];
    }
    static async isValidForDownload(fileId) {
        const text = `
            SELECT id FROM files 
            WHERE id = $1 
            AND deleted_at IS NULL 
            AND (expires_at IS NULL OR expires_at > NOW())
            AND download_count < max_downloads
        `;
        
        const result = await query(text, [fileId]);
        return result.rows.length > 0;
    }
    // Verifica lo stato di un file per un download (limite di download e scadenza)
    static async getStatus(fileId) {
        const text = `
            SELECT download_count, max_downloads, expires_at, created_at
            FROM files 
            WHERE id = $1 AND deleted_at IS NULL
        `;
        const result = await query(text, [fileId]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            downloads_remaining: Math.max(0, row.max_downloads - row.download_count),
            expires_at: row.expires_at,
            created_at: row.created_at
        };
    }
}
class NotificationModel {
    static async create(notificationData) {
        const { fileId, email } = notificationData;

        const text = `
            INSERT INTO notifications (file_id, email)
            VALUES ($1, $2)
            RETURNING id, created_at
        `;
        const values = [fileId, email];
        const result = await query(text, values);
        return result.rows[0];
    }
    static async findByFileId(fileId) {
	const text = `
	    SELECT id, email, notified_at, created_at
	    FROM notifications
	    WHERE file_id = $1
	`;
	const result = await query(text, [fileId]);
	return result.rows[0] || null;
    }
    static async markAsNotified(notificationId) {
        const text = `
            UPDATE notifications 
            SET notified_at = NOW() 
            WHERE id = $1
        `;
        const result = await query(text, [notificationId]);
        return result.rowCount > 0;
    }
}
class AuditLogModel {
    static async create(logData) {
        const { fileId, type, actorIp, details } = logData;
        const text = `
            INSERT INTO audit_logs (file_id, type, actor_ip, details)
            VALUES ($1, $2, $3, $4)
            RETURNING id, time
        `;
        const values = [fileId, type, actorIp, details];
        const result = await query(text, values);
        return result.rows[0];
    }
}
module.exports = {
    FileModel,
    NotificationModel,
    AuditLogModel
};
