import { useCallback } from 'react';
import { X, Copy, Check, Loader2, ExternalLink } from 'lucide-react';

const FileCard = ({ file, onRemove, onCopyUrl }) => {
    const { id, name, preview, status, progress, url, error } = file;

    const handleCopy = useCallback(() => {
        if (url) {
            navigator.clipboard.writeText(url);
            onCopyUrl(id);
        }
    }, [url, id, onCopyUrl]);

    const statusLabel = {
        pending: 'Pending',
        uploading: 'Uploading...',
        success: 'Uploaded',
        error: 'Failed',
    };

    return (
        <div className="file-card">
            <img src={preview} alt={name} />

            {/* Overlay */}
            <div className="overlay" />

            {/* Status badge */}
            <div className="absolute top-2 left-2">
                <span className={`status-badge ${status}`}>
                    {statusLabel[status]}
                </span>
            </div>

            {/* Remove button (only for pending) */}
            {status === 'pending' && (
                <button
                    onClick={() => onRemove(id)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            {/* Upload progress */}
            {status === 'uploading' && (
                <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="progress-bar uploading">
                        <div className="progress" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* Actions for uploaded files */}
            {status === 'success' && (
                <div className="actions">
                    <button
                        onClick={handleCopy}
                        className="btn-icon flex-1 flex-center gap-1 text-xs"
                        title="Copy URL"
                    >
                        {file.copied ? (
                            <>
                                <Check className="w-3 h-3 text-green-500" />
                                <span>Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3" />
                                <span>Copy URL</span>
                            </>
                        )}
                    </button>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-icon"
                        title="Open in new tab"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            )}

            {/* Error message */}
            {status === 'error' && (
                <div className="absolute bottom-2 left-2 right-2 text-xs text-red-300 truncate">
                    {error || 'Upload failed'}
                </div>
            )}

            {/* Loading spinner */}
            {status === 'uploading' && (
                <div className="absolute inset-0 flex-center bg-black/30">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
            )}

            {/* File name tooltip */}
            <div className="file-name-tooltip">
                <p className="text-xs text-white truncate font-roboto">{name}</p>
            </div>
        </div>
    );
};

const FileList = ({ files, onRemove, onCopyUrl }) => {
    if (files.length === 0) {
        return null;
    }

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-200 font-georama">
                    Files ({files.length})
                </h3>
                <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Pending: {files.filter((f) => f.status === 'pending').length}
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Uploaded: {files.filter((f) => f.status === 'success').length}
                    </span>
                </div>
            </div>

            <div className="file-grid">
                {files.map((file) => (
                    <FileCard
                        key={file.id}
                        file={file}
                        onRemove={onRemove}
                        onCopyUrl={onCopyUrl}
                    />
                ))}
            </div>
        </div>
    );
};

export default FileList;
