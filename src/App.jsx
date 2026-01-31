import { useState, useEffect, useCallback } from 'react';
import { Upload, AlertCircle, Settings } from 'lucide-react';
import { WindowFrame, Uploader, FileList, Toast, ThemeToggle } from './components';
import { uploadFile, isR2Configured, getConfig } from './services/r2';

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);

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
    }));

    setFiles((prev) => [...prev, ...fileEntries]);
  }, []);

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

    // Reset copied state after 2 seconds
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, copied: false } : f))
      );
    }, 2000);

    setToast({ message: 'URL copied to clipboard!', type: 'success' });
  }, []);

  // Upload all pending files
  const handleUploadAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    if (!isR2Configured()) {
      setToast({
        message: 'R2 not configured. Please set up your .env file.',
        type: 'error',
      });
      return;
    }

    setIsUploading(true);

    for (const fileEntry of pendingFiles) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileEntry.id ? { ...f, status: 'uploading', progress: 10 } : f
        )
      );

      try {
        const result = await uploadFile(fileEntry.file, null, (progress) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileEntry.id ? { ...f, progress } : f
            )
          );
        });

        // Update status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileEntry.id
              ? { ...f, status: 'success', progress: 100, url: result.url }
              : f
          )
        );
      } catch (error) {
        console.error('Upload error:', error);
        // Update status to error
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

    const successCount = files.filter(
      (f) => pendingFiles.some((p) => p.id === f.id) && f.status === 'success'
    ).length;

    if (successCount > 0) {
      setToast({
        message: `Successfully uploaded ${pendingFiles.length} file(s)!`,
        type: 'success',
      });
    }
  }, [files]);

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
    <main className="p-6 flex-center min-h-screen">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white font-georama">
              R2 Gallery Uploader
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-roboto">
              Upload images to your macOS Portfolio gallery
            </p>
          </div>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>

        {/* Configuration Warning */}
        {!config.isConfigured && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-200 font-medium">R2 Not Configured</p>
              <p className="text-yellow-300/70 text-sm mt-1">
                Copy <code className="bg-yellow-500/20 px-1 rounded">.env.example</code> to{' '}
                <code className="bg-yellow-500/20 px-1 rounded">.env</code> and add your
                Cloudflare R2 credentials.
              </p>
            </div>
          </div>
        )}

        {/* Main Window */}
        <WindowFrame title="Gallery Upload">
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
        </WindowFrame>

        {/* Config Info */}
        {config.isConfigured && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Settings className="w-3 h-3" />
            <span>
              Uploading to: <span className="text-gray-400">{config.bucketName}</span>
              {config.pathPrefix && (
                <span className="text-gray-600"> / {config.pathPrefix}</span>
              )}
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
