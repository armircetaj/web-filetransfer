require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { query, closePool } = require('../server/db/connection');

async function cleanupExpiredFiles() {
    console.log('Starting cleanup of expired files...');
    try {
        const expiredFiles = await query(`
            SELECT id, path FROM files 
            WHERE expires_at IS NOT NULL 
            AND expires_at <= NOW() 
            AND deleted_at IS NULL
        `);
        console.log(`Found ${expiredFiles.rows.length} expired files`);
        for (const file of expiredFiles.rows) {
            try {
                await fs.unlink(file.path);
                console.log(`Deleted file: ${file.path}`);
                await query(`
                    UPDATE files 
                    SET deleted_at = NOW() 
                    WHERE id = $1
                `, [file.id]);
                
                console.log(`Marked file ${file.id} as deleted`);
            } catch (error) {
                console.error(`Failed to delete file ${file.id}:`, error.message);
            }
        }
        const oldLogs = await query(`
            DELETE FROM audit_logs 
            WHERE time < NOW() - INTERVAL '30 days'
        `);
        console.log(`Cleaned up ${oldLogs.rowCount} old audit log entries`);
        console.log('Cleanup completed successfully');
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    } finally {
        await closePool();
    }
}
if (require.main === module) {
    cleanupExpiredFiles();
}
module.exports = { cleanupExpiredFiles };
