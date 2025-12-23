const multer = require('multer');

// Always use memory storage for R2 uploads (serverless-compatible)
const storage = multer.memoryStorage();

// File filter - allowed types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error('Invalid file type. Allowed: PDF, DOC, DOCX, ZIP, TXT, JPG, PNG, GIF'),
            false
        );
    }
};

// Configure multer - memory storage only (for R2)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

module.exports = upload;
