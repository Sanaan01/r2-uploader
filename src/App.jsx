import { useState, useEffect, useCallback } from 'react';
import { Upload, AlertCircle, Settings, Tag, Image, FolderOpen } from 'lucide-react';
import { WindowFrame, Uploader, FileList, FileGallery, Toast, ThemeToggle } from './components';
import { uploadFile, isR2Configured, getConfig } from './services/r2';

// Available categories (must match portfolio galleryLinks)
const AVAILABLE_CATEGORIES = ['Library', 'Cappadocia', 'Qatar', 'People', 'Favorites'];

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'gallery'
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(['Library']);
  const [galleryKey, setGalleryKey] = useState(0); // Force gallery refresh

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Handle new files selected
  const handleFilesSelected = useCallback((newFiles) => {
    const fileEntries = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      url: null,
      error: null,
      copied: false,
      categories: [...selectedCategories],
    }));

    setFiles((prev) => [...prev, ...fileEntries]);
  }, [selectedCategories]);

  // Remove a file
  const handleRemoveFile = useCallback((id) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Copy URL to clipboard
  const handleCopyUrl = useCallback((id) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, copied: true } : f))
    );

    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, copied: false } : f))
      );
    }, 2000);

    setToast({ message: 'URL copied to clipboard!', type: 'success' });
  }, []);

  // Toggle a category selection
  const handleCategoryToggle = useCallback((category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        if (prev.length === 1) {
          setToast({ message: 'At least one category is required', type: 'error' });
          return prev;
        }
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  }, []);

  // Upload all pending files
  const handleUploadAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    if (!isR2Configured()) {
      setToast({
        message: 'Upload API not configured. Set VITE_UPLOAD_API_URL and VITE_UPLOAD_API_KEY in .env',
        type: 'error',
      });
      return;
    }

    setIsUploading(true);

    for (const fileEntry of pendingFiles) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileEntry.id ? { ...f, status: 'uploading', progress: 10 } : f
        )
      );

      try {
        const result = await uploadFile(
          fileEntry.file,
          null,
          (progress) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileEntry.id ? { ...f, progress } : f
              )
            );
          },
          selectedCategories
        );

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileEntry.id
              ? { ...f, status: 'success', progress: 100, url: result.url }
              : f
          )
        );
      } catch (error) {
        console.error('Upload error:', error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileEntry.id
              ? { ...f, status: 'error', error: error.message }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    setGalleryKey((k) => k + 1); // Refresh gallery after upload

    const successCount = files.filter(
      (f) => pendingFiles.some((p) => p.id === f.id) && f.status === 'success'
    ).length;

    if (successCount > 0) {
      setToast({
        message: `Successfully uploaded ${pendingFiles.length} file(s)!`,
        type: 'success',
      });
    }
  }, [files, selectedCategories]);

  // Clear all completed uploads
  const handleClearCompleted = useCallback(() => {
    setFiles((prev) => {
      prev
        .filter((f) => f.status === 'success')
        .forEach((f) => {
          if (f.preview) URL.revokeObjectURL(f.preview);
        });
      return prev.filter((f) => f.status !== 'success');
    });
  }, []);

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const config = getConfig();

  return (
    <main className="sm:p-6 flex-center min-h-screen">
      <div className="w-full max-w-4xl sm:block">
        {/* Header - hidden on mobile */}
        <div className="hidden sm:flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white font-georama">
              R2 Gallery Uploader
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-roboto">
              Upload and manage images in your gallery
            </p>
          </div>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>

        {/* Configuration Warning - hidden on mobile */}
        {!config.isConfigured && (
          <div className="hidden sm:flex mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200 font-medium">Upload API Not Configured</p>
              <p className="text-yellow-300/70 text-sm mt-1">
                Set <code className="bg-yellow-500/20 px-1 rounded">VITE_UPLOAD_API_URL</code> and{' '}
                <code className="bg-yellow-500/20 px-1 rounded">VITE_UPLOAD_API_KEY</code> in your .env file.
              </p>
            </div>
          </div>
        )}

        {/* Main Window */}
        <WindowFrame title="Gallery Manager">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10 mb-4">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                ${activeTab === 'upload'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'}`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                ${activeTab === 'gallery'
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'}`}
            >
              <Image className="w-4 h-4" />
              Gallery
            </button>
          </div>

          {/* Upload Tab Content */}
          {activeTab === 'upload' && (
            <>
              {/* Category Selector */}
              <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">Upload Categories</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_CATEGORIES.map((category) => (
                    <label
                      key={category}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all text-sm
                        ${selectedCategories.includes(category)
                          ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="sr-only"
                      />
                      <span className={`w-3 h-3 rounded border flex items-center justify-center
                        ${selectedCategories.includes(category)
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-500'}`}
                      >
                        {selectedCategories.includes(category) && (
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                          </svg>
                        )}
                      </span>
                      {category}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected categories will be applied to all new uploads
                </p>
              </div>

              <Uploader onFilesSelected={handleFilesSelected} />

              <FileList
                files={files}
                onRemove={handleRemoveFile}
                onCopyUrl={handleCopyUrl}
              />

              {/* Action Buttons */}
              {files.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex gap-2">
                    {successCount > 0 && (
                      <button
                        onClick={handleClearCompleted}
                        className="btn-secondary text-sm"
                      >
                        Clear Completed ({successCount})
                      </button>
                    )}
                  </div>

                  {pendingCount > 0 && (
                    <button
                      onClick={handleUploadAll}
                      disabled={isUploading || !config.isConfigured}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Uploading...' : `Upload ${pendingCount} File(s)`}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Gallery Tab Content */}
          {activeTab === 'gallery' && (
            <FileGallery key={galleryKey} onRefresh={() => setGalleryKey((k) => k + 1)} />
          )}
        </WindowFrame>

        {/* Config Info - hidden on mobile */}
        {config.isConfigured && (
          <div className="hidden sm:flex mt-4 items-center justify-center gap-2 text-xs text-gray-500">
            <Settings className="w-3 h-3" />
            <span>
              API: <span className="text-gray-400">{config.apiUrl}</span>
            </span>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}

export default App;
