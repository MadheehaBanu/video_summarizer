import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createError } from '../middleware/errorHandler.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'video-summarizer-uploads';
const USE_CLOUD_STORAGE = process.env.USE_CLOUD_STORAGE === 'true';

export interface StorageResult {
  url: string;
  key: string;
  provider: 'local' | 's3';
}

/**
 * Upload video file to cloud storage or local storage
 */
export const uploadVideo = async (
  filePath: string,
  originalName: string,
  userId?: string
): Promise<StorageResult> => {
  try {
    if (!USE_CLOUD_STORAGE) {
      // Use local storage
      console.log('Using local storage (cloud storage disabled)');
      return {
        url: filePath,
        key: path.basename(filePath),
        provider: 'local'
      };
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.warn('AWS credentials not configured, falling back to local storage');
      return {
        url: filePath,
        key: path.basename(filePath),
        provider: 'local'
      };
    }

    console.log('Uploading video to S3:', originalName);

    // Generate unique key
    const fileExtension = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const userPrefix = userId ? `users/${userId}/` : 'public/';
    const key = `${userPrefix}videos/${timestamp}-${randomString}${fileExtension}`;

    // Read file
    const fileContent = fs.readFileSync(filePath);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: getContentType(fileExtension),
      Metadata: {
        originalName,
        uploadedAt: new Date().toISOString()
      }
    });

    await s3Client.send(command);

    // Generate signed URL (valid for 7 days)
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }),
      { expiresIn: 7 * 24 * 60 * 60 } // 7 days
    );

    console.log('Video uploaded successfully to S3');

    return {
      url: signedUrl,
      key,
      provider: 's3'
    };
  } catch (error) {
    console.error('Error uploading video:', error);
    
    // Fallback to local storage
    console.warn('Falling back to local storage due to upload error');
    return {
      url: filePath,
      key: path.basename(filePath),
      provider: 'local'
    };
  }
};

/**
 * Get signed URL for accessing a video
 */
export const getVideoUrl = async (key: string): Promise<string> => {
  try {
    if (!USE_CLOUD_STORAGE) {
      // Return local path
      return key;
    }

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }),
      { expiresIn: 60 * 60 } // 1 hour
    );

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw createError('Failed to generate video URL', 500);
  }
};

/**
 * Delete video from cloud storage
 */
export const deleteVideo = async (key: string): Promise<void> => {
  try {
    if (!USE_CLOUD_STORAGE) {
      // Delete local file
      try {
        fs.unlinkSync(key);
        console.log('Deleted local video file:', key);
      } catch (err) {
        console.error('Error deleting local file:', err);
      }
      return;
    }

    console.log('Deleting video from S3:', key);

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);

    console.log('Video deleted successfully from S3');
  } catch (error) {
    console.error('Error deleting video:', error);
    throw createError('Failed to delete video', 500);
  }
};

/**
 * Upload thumbnail to cloud storage
 */
export const uploadThumbnail = async (
  imageBuffer: Buffer,
  videoKey: string
): Promise<string> => {
  try {
    if (!USE_CLOUD_STORAGE) {
      // Save locally
      const thumbnailPath = videoKey.replace(path.extname(videoKey), '-thumb.jpg');
      fs.writeFileSync(thumbnailPath, imageBuffer);
      return thumbnailPath;
    }

    const key = videoKey.replace(path.extname(videoKey), '-thumb.jpg');

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      Metadata: {
        type: 'thumbnail',
        videoKey
      }
    });

    await s3Client.send(command);

    // Generate signed URL (valid for 30 days)
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }),
      { expiresIn: 30 * 24 * 60 * 60 }
    );

    return signedUrl;
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return '/placeholder.svg'; // Fallback to placeholder
  }
};

/**
 * Check if cloud storage is configured and available
 */
export const isCloudStorageAvailable = (): boolean => {
  return (
    USE_CLOUD_STORAGE &&
    !!process.env.AWS_ACCESS_KEY_ID &&
    !!process.env.AWS_SECRET_ACCESS_KEY &&
    !!process.env.AWS_S3_BUCKET
  );
};

/**
 * Get content type based on file extension
 */
const getContentType = (extension: string): string => {
  const types: { [key: string]: string } = {
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm'
  };

  return types[extension.toLowerCase()] || 'video/mp4';
};

/**
 * Get storage usage statistics
 */
export const getStorageStats = async (userId?: string): Promise<{
  totalFiles: number;
  totalSize: number;
  provider: string;
}> => {
  try {
    // This is a simplified version
    // In production, you'd query S3 or database for actual stats
    return {
      totalFiles: 0,
      totalSize: 0,
      provider: USE_CLOUD_STORAGE ? 's3' : 'local'
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      provider: 'unknown'
    };
  }
};
