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
 * Get all categories from server
 * @returns {Promise<{categories: Array}>}
 */
export const getCategories = async () => {
    try {
        const response = await fetch(`${UPLOAD_API_URL}/categories`, {
            method: 'GET',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch categories');
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
 * Create a new category
 * @param {string} title - Category title
 * @param {string} icon - Optional icon path
 * @returns {Promise<{category: object, categories: Array}>}
 */
export const createCategory = async (title, icon = null) => {
    if (!isR2Configured()) {
        throw new Error('Upload API not configured.');
    }

    try {
        const response = await fetch(`${UPLOAD_API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Upload-Key': UPLOAD_API_KEY,
            },
            body: JSON.stringify({ title, icon }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to create category');
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
 * Delete a category
 * @param {string} categoryId - Category ID to delete
 * @returns {Promise<{success: boolean}>}
 */
export const deleteCategory = async (categoryId) => {
    if (!isR2Configured()) {
        throw new Error('Upload API not configured.');
    }

    try {
        const response = await fetch(`${UPLOAD_API_URL}/categories/${encodeURIComponent(categoryId)}`, {
            method: 'DELETE',
            headers: { 'X-Upload-Key': UPLOAD_API_KEY },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete category');
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
 * Save category order to server
 * @param {Array} categories - Array of category objects in display order
 * @returns {Promise<{success: boolean, categories: Array}>}
 */
export const saveCategoryOrder = async (categories) => {
    if (!isR2Configured()) {
        throw new Error('Upload API not configured.');
    }

    try {
        const response = await fetch(`${UPLOAD_API_URL}/categories/order`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Upload-Key': UPLOAD_API_KEY,
            },
            body: JSON.stringify({ categories }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save category order');
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
 * Get gallery order from server
 * @returns {Promise<{order: string[]}>}
 */
export const getGalleryOrder = async () => {
    try {
        const response = await fetch(`${UPLOAD_API_URL}/gallery-order`, {
            method: 'GET',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch gallery order');
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
 * Save gallery order to server
 * @param {string[]} order - Array of image keys in display order
 * @returns {Promise<{success: boolean}>}
 */
export const saveGalleryOrder = async (order) => {
    if (!isR2Configured()) {
        throw new Error('Upload API not configured.');
    }

    try {
        const response = await fetch(`${UPLOAD_API_URL}/gallery-order`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Upload-Key': UPLOAD_API_KEY,
            },
            body: JSON.stringify({ order }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save gallery order');
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
 * Get R2 configuration status
 * @returns {object}
 */
export const getConfig = () => ({
    isConfigured: isR2Configured(),
    apiUrl: UPLOAD_API_URL,
    hasApiKey: !!UPLOAD_API_KEY,
});
