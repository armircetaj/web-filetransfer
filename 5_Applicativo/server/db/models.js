const { query, getClient } = require('./connection');

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

    static async softDelete(fileId) {
        const text = `
            UPDATE files 
            SET deleted_at = NOW() 
            WHERE id = $1 AND deleted_at IS NULL
        `;
        
        const result = await query(text, [fileId]);
        return result.rowCount > 0;
    }

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

    static async findAll() {
        const text = `
            SELECT id, token_hash, salt, metadata, path, ciphertext_length, 
                   max_downloads, download_count, expires_at, created_at
            FROM files 
            WHERE deleted_at IS NULL
        `;
        
        const result = await query(text);
        return result.rows;
    }

    static async findExpired() {
        const text = `
            SELECT id, path FROM files 
            WHERE expires_at IS NOT NULL 
            AND expires_at <= NOW() 
            AND deleted_at IS NULL
        `;
        
        const result = await query(text);
        return result.rows;
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

    static async getPendingNotifications() {
        const text = `
            SELECT n.id, n.file_id, n.email, f.path, f.ciphertext_length
            FROM notifications n
            JOIN files f ON n.file_id = f.id
            WHERE n.notified_at IS NULL 
            AND f.deleted_at IS NULL
        `;
        
        const result = await query(text);
        return result.rows;
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

    static async findByFileId(fileId) {
        const text = `
            SELECT type, time, actor_ip, details
            FROM audit_logs 
            WHERE file_id = $1
            ORDER BY time DESC
        `;
        
        const result = await query(text, [fileId]);
        return result.rows;
    }
}
module.exports = {
    FileModel,
    NotificationModel,
    AuditLogModel
};
