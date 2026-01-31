import { useState, useRef, useCallback } from 'react';
import { Upload, Image, X, Loader2 } from 'lucide-react';

const Uploader = ({ onFilesSelected }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isTouching, setIsTouching] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files).filter((file) =>
            file.type.startsWith('image/')
        );

        if (files.length > 0) {
            onFilesSelected(files);
        }
    }, [onFilesSelected]);

    const handleFileSelect = useCallback((e) => {
        const files = Array.from(e.target.files).filter((file) =>
            file.type.startsWith('image/')
        );

        if (files.length > 0) {
            onFilesSelected(files);
        }

        // Reset input so same file can be selected again
        e.target.value = '';
    }, [onFilesSelected]);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    // Touch handlers for visual feedback
    const handleTouchStart = useCallback(() => {
        setIsTouching(true);
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsTouching(false);
    }, []);

    return (
        <div
            className={`upload-zone ${isDragOver ? 'dragover' : ''} ${isTouching ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            <div className="col-center gap-4 text-gray-500 dark:text-gray-400">
                <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-200 font-georama">
                        <span className="hidden sm:inline">Drop images here</span>
                        <span className="sm:hidden">Tap to upload images</span>
                    </p>
                    <p className="text-sm mt-1">
                        <span className="hidden sm:inline">or <span className="text-blue-600 dark:text-blue-400 hover:underline">browse</span> to upload</span>
                        <span className="sm:hidden text-blue-600 dark:text-blue-400">Select from gallery or camera</span>
                    </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                    Supports JPG, PNG, WebP, GIF
                </p>
            </div>
        </div>
    );
};

export default Uploader;
