/**
 * File Service - Abstraction layer for R2 storage
 * Serverless-compatible (no local file system)
 */

const storage = require('./storage');

/**
 * Upload a file to R2
 * @param {object} file - Multer file object (with buffer)
 * @param {string} orgId - Organization ID
 * @returns {Promise<object>} - { fileKey, fileName, fileType, fileSizeMB }
 */
const uploadFile = async (file, orgId) => {
    if (!storage.isConfigured()) {
        throw new Error('R2 storage is not configured. Please set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.');
    }

    const fileSizeMB = file.size / (1024 * 1024);

    // Upload to R2
    const key = storage.generateKey(orgId, file.originalname);
    await storage.uploadFile(file.buffer, key, file.mimetype, {
        originalName: file.originalname,
        organizationId: orgId,
    });

    return {
        fileKey: key,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSizeMB,
    };
};

/**
 * Get download URL for a file (signed URL from R2)
 * @param {object} report - Report with fileKey
 * @returns {Promise<string>} - Signed URL
 */
const getDownloadUrl = async (report) => {
    if (!report.fileKey) {
        return null;
    }

    return storage.getDownloadUrl(report.fileKey);
};

/**
 * Delete a file from R2
 * @param {object} report - Report with fileKey
 * @returns {Promise<void>}
 */
const deleteFile = async (report) => {
    if (!report.fileKey) return;

    try {
        await storage.deleteFile(report.fileKey);
    } catch (error) {
        console.error('Error deleting file from R2:', error);
        // Don't throw - file deletion shouldn't break main operation
    }
};

module.exports = {
    uploadFile,
    getDownloadUrl,
    deleteFile,
};
