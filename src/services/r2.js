/**
 * R2 Upload Service - Secure API Client
 * Communicates with Cloudflare Worker backend for secure uploads
 */

// API Configuration from environment variables
const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL || 'http://localhost:8787';
const UPLOAD_API_KEY = import.meta.env.VITE_UPLOAD_API_KEY || '';

// Check if API is configured
export const isR2Configured = () => {
    return !!(UPLOAD_API_URL && UPLOAD_API_KEY);
};

/**
 * Upload a file to R2 via the secure Worker API
 * @param {File} file - The file to upload
 * @param {string} customPath - Optional custom path/filename (unused, worker handles naming)
 * @param {function} onProgress - Optional progress callback (0-100)
 * @param {string[]} categories - Categories for the image (default: ['Library'])
 * @returns {Promise<{key: string, url: string}>}
 */
export const uploadFile = async (file, customPath = null, onProgress = null, categories = ['Library']) => {
    if (!isR2Configured()) {
        throw new Error('Upload API not configured. Please set VITE_UPLOAD_API_URL and VITE_UPLOAD_API_KEY.');
    }

    if (onProgress) onProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('categories', JSON.stringify(categories));

    if (onProgress) onProgress(30);

    try {
        const response = await fetch(`${UPLOAD_API_URL}/upload`, {
            method: 'POST',
            headers: { 'X-Upload-Key': UPLOAD_API_KEY },
            body: formData,
        });

        if (onProgress) onProgress(80);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Upload failed with status ${response.status}`);
        }

        if (onProgress) onProgress(100);

        return { key: result.key, url: result.url };
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to upload server. Make sure the Worker is running.');
        }
        throw error;
    }
};

/**
 * List all files from R2
 * @returns {Promise<{files: Array, count: number}>}
 */
export const listFiles = async () => {
    if (!isR2Configured()) {
        throw new Error('Upload API not configured.');
    }

    try {
        const response = await fetch(`${UPLOAD_API_URL}/files`, {
            method: 'GET',
            headers: { 'X-Upload-Key': UPLOAD_API_KEY },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Failed to list files`);
        }

        return result;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server.');
        }
        throw error;
    }
};

/**
 * Delete a file from R2
 * @param {string} key - The file key to delete
 * @returns {Promise<{success: boolean}>}
 */
export const deleteFile = async (key) => {
    if (!isR2Configured()) {
        throw new Error('Upload API not configured.');
    }

    try {
        const response = await fetch(`${UPLOAD_API_URL}/files/${encodeURIComponent(key)}`, {
            method: 'DELETE',
            headers: { 'X-Upload-Key': UPLOAD_API_KEY },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Failed to delete file`);
        }

        return result;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server.');
        }
        throw error;
    }
};

/**
 * Check API health
 * @returns {Promise<{status: string, timestamp: string}>}
 */
export const checkHealth = async () => {
    const response = await fetch(`${UPLOAD_API_URL}/health`, { method: 'GET' });
    if (!response.ok) throw new Error('API health check failed');
    return response.json();
};

/**
 * Get R2 configuration status
 * @returns {object}
 */
export const getConfig = () => ({
    isConfigured: isR2Configured(),
    apiUrl: UPLOAD_API_URL,
    hasApiKey: !!UPLOAD_API_KEY,
});
