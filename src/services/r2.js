import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// R2 Configuration from environment variables
const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || '';
const R2_PATH_PREFIX = import.meta.env.VITE_R2_PATH_PREFIX || '';

// Check if R2 is configured
export const isR2Configured = () => {
    return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
};

// Create S3 client for R2
const createR2Client = () => {
    if (!isR2Configured()) {
        throw new Error('R2 credentials not configured. Please set up your .env file.');
    }

    return new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });
};

/**
 * Upload a file to R2
 * @param {File} file - The file to upload
 * @param {string} customPath - Optional custom path/filename
 * @param {function} onProgress - Optional progress callback (0-100)
 * @param {string[]} categories - Categories for the image (default: ['Library'])
 * @returns {Promise<{key: string, url: string}>}
 */
export const uploadFile = async (file, customPath = null, onProgress = null, categories = ['Library']) => {
    const client = createR2Client();

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = customPath || `${R2_PATH_PREFIX}${timestamp}_${sanitizedName}`;

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type,
        // Cache for 1 year (Cloudflare Image Resizing will cache transformed images)
        CacheControl: 'public, max-age=31536000',
        // Store categories and upload timestamp in custom metadata
        Metadata: {
            categories: categories.join(','),
            uploadedAt: new Date().toISOString(),
        },
    });

    // Note: AWS SDK v3 doesn't support upload progress in browser
    // We simulate progress for better UX
    if (onProgress) {
        onProgress(50); // Simulate mid-progress
    }

    await client.send(command);

    if (onProgress) {
        onProgress(100);
    }

    // Construct public URL
    const url = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : key;

    return { key, url };
};

/**
 * List files in R2 bucket with optional prefix
 * @param {string} prefix - Optional prefix to filter files
 * @returns {Promise<Array<{key: string, size: number, lastModified: Date}>>}
 */
export const listFiles = async (prefix = R2_PATH_PREFIX) => {
    const client = createR2Client();

    const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
    });

    const response = await client.send(command);

    return (response.Contents || []).map((item) => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${item.Key}` : item.Key,
    }));
};

/**
 * Get the public URL for a file
 * @param {string} key - The file key in R2
 * @returns {string}
 */
export const getPublicUrl = (key) => {
    return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : key;
};

/**
 * Get R2 configuration status
 * @returns {object}
 */
export const getConfig = () => ({
    isConfigured: isR2Configured(),
    publicUrl: R2_PUBLIC_URL,
    pathPrefix: R2_PATH_PREFIX,
    bucketName: R2_BUCKET_NAME,
});
