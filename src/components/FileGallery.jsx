import { useState, useEffect, useCallback } from 'react';
import { Trash2, RefreshCw, Image, Calendar, Tag, Loader2, AlertCircle } from 'lucide-react';
import { listFiles, deleteFile } from '../services/r2';

function FileGallery({ onRefresh }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await listFiles();
            setFiles(result.files || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleDelete = async (file) => {
        setDeleting(file.key);
        try {
            await deleteFile(file.key);
            setFiles(prev => prev.filter(f => f.key !== file.key));
            setConfirmDelete(null);
            if (onRefresh) onRefresh();
        } catch (err) {
            setError(`Failed to delete: ${err.message}`);
        } finally {
            setDeleting(null);
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-400">Loading files...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-red-400">{error}</p>
                <button
                    onClick={fetchFiles}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Image className="w-12 h-12 text-gray-500" />
                <p className="text-gray-400">No files uploaded yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{files.length} file(s)</span>
                <button
                    onClick={fetchFiles}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* File Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((file) => (
                    <div
                        key={file.key}
                        className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all"
                    >
                        {/* Thumbnail */}
                        <div className="aspect-square relative overflow-hidden bg-black/20">
                            <img
                                src={file.url}
                                alt={file.originalName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => setConfirmDelete(file)}
                                    className="p-3 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                                    disabled={deleting === file.key}
                                >
                                    {deleting === file.key ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* File Info */}
                        <div className="p-2 space-y-1">
                            <p className="text-xs font-medium truncate" title={file.originalName}>
                                {file.originalName}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <span>{formatSize(file.size)}</span>
                                <span>•</span>
                                <span>{formatDate(file.uploaded)}</span>
                            </div>
                            {file.categories && file.categories.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                    {file.categories.slice(0, 2).map((cat) => (
                                        <span
                                            key={cat}
                                            className="px-1.5 py-0.5 text-[9px] bg-blue-500/20 text-blue-300 rounded"
                                        >
                                            {cat}
                                        </span>
                                    ))}
                                    {file.categories.length > 2 && (
                                        <span className="text-[9px] text-gray-500">
                                            +{file.categories.length - 2}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#2a2a2a] rounded-xl p-6 max-w-sm w-full border border-white/10">
                        <h3 className="text-lg font-semibold mb-2">Delete File?</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Are you sure you want to delete "{confirmDelete.originalName}"? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(confirmDelete)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FileGallery;
