/**
 * File Service - Abstraction layer for file storage
 * Supports both Cloudflare R2 (S3-compatible) and local filesystem
 */

const path = require('path');
const fs = require('fs');
const storage = require('./storage');

// Check if R2 is configured
const useR2 = storage.isConfigured();
const uploadDir = path.join(__dirname, '../middleware/../uploads');

/**
 * Upload a file
 * @param {object} file - Multer file object
 * @param {string} orgId - Organization ID
 * @returns {Promise<object>} - { fileUrl, fileName, fileType, fileSizeMB, fileKey }
 */
const uploadFile = async (file, orgId) => {
    const fileSizeMB = file.size / (1024 * 1024);

    if (useR2) {
        // Upload to R2
        const key = storage.generateKey(orgId, file.originalname);
        await storage.uploadFile(file.buffer, key, file.mimetype, {
            originalName: file.originalname,
            organizationId: orgId,
        });

        return {
            fileUrl: null, // Not used for R2, we use signed URLs
            fileKey: key,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSizeMB,
        };
    } else {
        // Local storage - file already saved by multer
        return {
            fileUrl: `/uploads/${file.filename}`,
            fileKey: null,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSizeMB,
        };
    }
};

/**
 * Get download URL for a file
 * @param {object} report - Report with fileUrl or fileKey
 * @returns {Promise<string>} - URL to download the file
 */
const getDownloadUrl = async (report) => {
    if (useR2 && report.fileKey) {
        // Generate signed URL for R2
        return storage.getDownloadUrl(report.fileKey);
    } else if (report.fileUrl) {
        // Local file - return relative path
        return report.fileUrl;
    }
    return null;
};

/**
 * Delete a file
 * @param {object} report - Report with fileUrl or fileKey
 * @returns {Promise<void>}
 */
const deleteFile = async (report) => {
    try {
        if (useR2 && report.fileKey) {
            await storage.deleteFile(report.fileKey);
        } else if (report.fileUrl) {
            const filePath = path.join(__dirname, '..', report.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        // Don't throw - file deletion shouldn't break main operation
    }
};

/**
 * Check if using cloud storage
 * @returns {boolean}
 */
const isCloudStorage = () => useR2;

module.exports = {
    uploadFile,
    getDownloadUrl,
    deleteFile,
    isCloudStorage,
};
