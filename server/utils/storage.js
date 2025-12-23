const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

/**
 * Generate a unique filename with organization prefix
 * @param {string} orgId - Organization ID
 * @param {string} originalName - Original filename
 * @returns {string} - Unique key for storage
 */
const generateKey = (orgId, originalName) => {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const safeName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');

    return `${orgId}/${timestamp}-${randomId}-${safeName}${ext}`;
};

/**
 * Upload a file to R2
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} key - Storage key
 * @param {string} contentType - MIME type
 * @param {object} metadata - Additional metadata
 * @returns {Promise<object>} - Upload result with key and url
 */
const uploadFile = async (fileBuffer, key, contentType, metadata = {}) => {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        Metadata: {
            ...metadata,
            uploadedAt: new Date().toISOString(),
        },
    });

    await r2Client.send(command);

    return {
        key,
        size: fileBuffer.length,
        contentType,
    };
};

/**
 * Get a signed URL for downloading a file
 * @param {string} key - Storage key
 * @param {number} expiresIn - URL expiry in seconds (default: 1 hour)
 * @returns {Promise<string>} - Signed URL
 */
const getDownloadUrl = async (key, expiresIn = 3600) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return getSignedUrl(r2Client, command, { expiresIn });
};

/**
 * Delete a file from R2
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
const deleteFile = async (key) => {
    if (!key) return;

    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await r2Client.send(command);
};

/**
 * Check if R2 is configured
 * @returns {boolean}
 */
const isConfigured = () => {
    return !!(
        process.env.R2_ENDPOINT &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME
    );
};

module.exports = {
    r2Client,
    generateKey,
    uploadFile,
    getDownloadUrl,
    deleteFile,
    isConfigured,
    BUCKET_NAME,
};
