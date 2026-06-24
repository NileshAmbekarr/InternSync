import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, FileArchive, Image as ImageIcon, File } from 'lucide-react';
import './FileDropzone.css';

const FileDropzone = ({ onFileSelect, currentFile, onRemove }) => {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/zip': ['.zip'],
            'text/plain': ['.txt'],
            'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon size={20} />;
        if (ext === 'zip') return <FileArchive size={20} />;
        if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return <FileText size={20} />;
        return <File size={20} />;
    };

    return (
        <div className="file-dropzone-container">
            {currentFile ? (
                <div className="file-preview">
                    <div className="file-info">
                        <span className="file-icon">
                            {renderFileIcon(currentFile.name)}
                        </span>
                        <div className="file-details">
                            <span className="file-name">{currentFile.name}</span>
                            <span className="file-size">{formatFileSize(currentFile.size)}</span>
                        </div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}>
                        Remove
                    </button>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`file-dropzone ${isDragActive ? 'active' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="dropzone-content">
                        <span className="dropzone-icon">
                            <UploadCloud size={24} />
                        </span>
                        {isDragActive ? (
                            <p className="dropzone-text">Drop the file here</p>
                        ) : (
                            <>
                                <p className="dropzone-text">
                                    Drag & drop a file, or <span className="dropzone-link">browse</span>
                                </p>
                                <p className="dropzone-hint">
                                    PDF, DOC, DOCX, ZIP, TXT, or images — max 10MB
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileDropzone;
