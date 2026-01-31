import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, RefreshCw, Image, Loader2, AlertCircle, GripVertical, Save, Lock } from 'lucide-react';
import { listFiles, deleteFile, getGalleryOrder, saveGalleryOrder } from '../services/r2';

// Threshold for long-press to initiate drag on mobile (ms)
const TOUCH_HOLD_DURATION = 300;

// Static images from portfolio constants (non-deletable but reorderable)
const STATIC_IMAGES = [
    {
        key: 'static/goreme.JPG',
        url: 'https://sanaan.dev/images/goreme.JPG',
        thumbnail: 'https://sanaan.dev/images/thumbnails/goreme.webp',
        originalName: 'goreme.JPG',
        categories: ['Library', 'Favorites', 'Turkey'],
        isStatic: true,
    },
    {
        key: 'static/sapanca.JPG',
        url: 'https://sanaan.dev/images/sapanca.JPG',
        thumbnail: 'https://sanaan.dev/images/thumbnails/sapanca.webp',
        originalName: 'sapanca.JPG',
        categories: ['Library', 'Favorites', 'Turkey'],
        isStatic: true,
    },
    {
        key: 'static/volcano.JPG',
        url: 'https://sanaan.dev/images/volcano.JPG',
        thumbnail: 'https://sanaan.dev/images/thumbnails/volcano.webp',
        originalName: 'volcano.JPG',
        categories: ['Library', 'Favorites', 'Turkey'],
        isStatic: true,
    },
    {
        key: 'static/cave.JPG',
        url: 'https://assets.sanaan.dev/constants/cave.JPG',
        thumbnail: 'https://sanaan.dev/images/thumbnails/cave.webp',
        originalName: 'cave.JPG',
        categories: ['Library', 'Turkey'],
        isStatic: true,
    },
    {
        key: 'static/sanaanfull.JPG',
        url: 'https://sanaan.dev/images/sanaanfull.JPG',
        thumbnail: 'https://sanaan.dev/images/thumbnails/sanaanfull.webp',
        originalName: 'sanaanfull.JPG',
        categories: ['Library', 'People'],
        isStatic: true,
    },
    {
        key: 'static/balloon1.JPG',
        url: 'https://sanaan.dev/images/balloon1.JPG',
        thumbnail: 'https://sanaan.dev/images/thumbnails/balloon1.webp',
        originalName: 'balloon1.JPG',
        categories: ['Library', 'Turkey'],
        isStatic: true,
    },
    {
        key: 'static/balloon2.JPG',
        url: 'https://sanaan.dev/images/balloon2.JPG',
        thumbnail: 'https://sanaan.dev/images/thumbnails/balloon2.webp',
        originalName: 'balloon2.JPG',
        categories: ['Library', 'Turkey'],
        isStatic: true,
    },
    {
        key: 'static/balloon3.JPG',
        url: 'https://sanaan.dev/images/balloon3.JPG',
        thumbnail: 'https://sanaan.dev/images/thumbnails/balloon3.webp',
        originalName: 'balloon3.JPG',
        categories: ['Library', 'Turkey'],
        isStatic: true,
    },
];

// Generate Cloudflare Image Resizing thumbnail URL
// MUST match gallery.json.js format exactly so we use the same cached thumbnail
const getThumbnailUrl = (url) => {
    if (!url) return '';
    // 800px long side, maintain aspect ratio, same as portfolio
    return `https://sanaan.dev/cdn-cgi/image/width=800,fit=scale-down,quality=85,format=auto/${url}`;
};

function FileGallery({ onRefresh, onToast }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [orderChanged, setOrderChanged] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const originalOrderRef = useRef([]);

    // Touch drag state
    const touchStartRef = useRef(null);
    const touchHoldTimerRef = useRef(null);
    const touchDraggingRef = useRef(false);
    const gridRef = useRef(null);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch uploaded files and saved order in parallel
            const [filesResult, orderResult] = await Promise.all([
                listFiles(),
                getGalleryOrder().catch(() => ({ order: [] })),
            ]);

            const uploadedFiles = (filesResult.files || []).map(f => ({
                ...f,
                isStatic: false,
                // Generate Cloudflare CDN thumbnail if not already set
                thumbnail: f.thumbnail || getThumbnailUrl(f.url),
            }));
            const allFiles = [...uploadedFiles, ...STATIC_IMAGES];

            // Apply saved order if it exists
            const savedOrder = orderResult.order || [];
            if (savedOrder.length > 0) {
                // Create a map for quick lookup
                const fileMap = new Map(allFiles.map(f => [f.key, f]));
                const orderedFiles = [];

                // Add files in saved order
                for (const key of savedOrder) {
                    if (fileMap.has(key)) {
                        orderedFiles.push(fileMap.get(key));
                        fileMap.delete(key);
                    }
                }

                // Add any remaining files not in the saved order (new uploads)
                for (const file of fileMap.values()) {
                    orderedFiles.unshift(file); // New files at the start
                }

                setFiles(orderedFiles);
                originalOrderRef.current = orderedFiles.map(f => f.key);
            } else {
                setFiles(allFiles);
                originalOrderRef.current = allFiles.map(f => f.key);
            }

            setOrderChanged(false);
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
        if (file.isStatic) return; // Can't delete static files

        setDeleting(file.key);
        try {
            await deleteFile(file.key);
            setFiles(prev => prev.filter(f => f.key !== file.key));
            setConfirmDelete(null);
            setOrderChanged(true);
            if (onRefresh) onRefresh();
        } catch (err) {
            setError(`Failed to delete: ${err.message}`);
        } finally {
            setDeleting(null);
        }
    };

    const handleSaveOrder = async () => {
        setSaving(true);
        try {
            const order = files.map(f => f.key);
            await saveGalleryOrder(order);
            originalOrderRef.current = order;
            setOrderChanged(false);
            if (onToast) {
                onToast({ message: 'Gallery order saved!', type: 'success' });
            }
        } catch (err) {
            setError(`Failed to save order: ${err.message}`);
            if (onToast) {
                onToast({ message: `Failed to save order: ${err.message}`, type: 'error' });
            }
        } finally {
            setSaving(false);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newFiles = [...files];
        const [draggedFile] = newFiles.splice(draggedIndex, 1);
        newFiles.splice(dropIndex, 0, draggedFile);

        setFiles(newFiles);
        setDraggedIndex(null);
        setDragOverIndex(null);

        // Check if order changed from original
        const newOrder = newFiles.map(f => f.key);
        const hasChanged = newOrder.some((key, i) => key !== originalOrderRef.current[i]);
        setOrderChanged(hasChanged);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Touch event handlers for mobile drag-and-drop
    const handleTouchStart = useCallback((e, index) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, index };

        // Start a timer for long-press detection
        touchHoldTimerRef.current = setTimeout(() => {
            touchDraggingRef.current = true;
            setDraggedIndex(index);
            // Add haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, TOUCH_HOLD_DURATION);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!touchDraggingRef.current || draggedIndex === null) {
            // Cancel the long-press timer if user moves before it triggers
            if (touchHoldTimerRef.current) {
                const touch = e.touches[0];
                const start = touchStartRef.current;
                if (start) {
                    const dx = Math.abs(touch.clientX - start.x);
                    const dy = Math.abs(touch.clientY - start.y);
                    if (dx > 10 || dy > 10) {
                        clearTimeout(touchHoldTimerRef.current);
                        touchHoldTimerRef.current = null;
                    }
                }
            }
            return;
        }

        e.preventDefault();
        const touch = e.touches[0];

        // Find which element we're over
        const elements = gridRef.current?.querySelectorAll('[data-drag-index]');
        if (!elements) return;

        let targetIndex = null;
        elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (
                touch.clientX >= rect.left &&
                touch.clientX <= rect.right &&
                touch.clientY >= rect.top &&
                touch.clientY <= rect.bottom
            ) {
                targetIndex = parseInt(el.dataset.dragIndex, 10);
            }
        });

        if (targetIndex !== null && targetIndex !== draggedIndex) {
            setDragOverIndex(targetIndex);
        } else {
            setDragOverIndex(null);
        }
    }, [draggedIndex]);

    const handleTouchEnd = useCallback(() => {
        // Clear the long-press timer
        if (touchHoldTimerRef.current) {
            clearTimeout(touchHoldTimerRef.current);
            touchHoldTimerRef.current = null;
        }

        if (!touchDraggingRef.current || draggedIndex === null) {
            touchDraggingRef.current = false;
            touchStartRef.current = null;
            return;
        }

        // Perform the reorder if we have a valid drop target
        if (dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            const newFiles = [...files];
            const [draggedFile] = newFiles.splice(draggedIndex, 1);
            newFiles.splice(dragOverIndex, 0, draggedFile);

            setFiles(newFiles);

            // Check if order changed from original
            const newOrder = newFiles.map(f => f.key);
            const hasChanged = newOrder.some((key, i) => key !== originalOrderRef.current[i]);
            setOrderChanged(hasChanged);
        }

        // Reset touch state
        touchDraggingRef.current = false;
        touchStartRef.current = null;
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, [draggedIndex, dragOverIndex, files]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (touchHoldTimerRef.current) {
                clearTimeout(touchHoldTimerRef.current);
            }
        };
    }, []);

    const formatSize = (bytes) => {
        if (!bytes) return 'Static';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (date) => {
        if (!date) return 'Constant';
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
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-gray-400">
                    {files.length} file(s) • Drag to reorder
                </span>
                <div className="flex gap-2">
                    {orderChanged && (
                        <button
                            onClick={handleSaveOrder}
                            disabled={saving}
                            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg transition-colors"
                        >
                            {saving ? (
                                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                            ) : (
                                <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                            <span className="hidden sm:inline">Save Order</span>
                            <span className="sm:hidden">Save</span>
                        </button>
                    )}
                    <button
                        onClick={fetchFiles}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
            </div>

            {/* File Grid */}
            <div
                ref={gridRef}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {files.map((file, index) => (
                    <div
                        key={file.key}
                        data-drag-index={index}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => handleTouchStart(e, index)}
                        className={`group relative bg-white/5 rounded-xl overflow-hidden border transition-all cursor-grab active:cursor-grabbing select-none
                            ${dragOverIndex === index ? 'border-blue-500 scale-105' : 'border-white/10 hover:border-white/20'}
                            ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                    >
                        {/* Drag Handle - Always visible on mobile for touch feedback */}
                        <div className="absolute top-1 left-1 z-10 p-1 bg-black/50 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-4 h-4 text-white" />
                        </div>

                        {/* Static Badge */}
                        {file.isStatic && (
                            <div className="absolute top-1 right-1 z-10 p-1 bg-yellow-500/80 rounded" title="Static image (non-deletable)">
                                <Lock className="w-3 h-3 text-black" />
                            </div>
                        )}

                        {/* Thumbnail */}
                        <div className="aspect-square relative overflow-hidden bg-black/20">
                            <img
                                src={file.thumbnail || file.url}
                                alt={file.originalName}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />

                            {/* Hover Overlay - only show delete for non-static */}
                            {!file.isStatic && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDelete(file);
                                        }}
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
                            )}
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
