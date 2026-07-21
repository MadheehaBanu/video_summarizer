import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { createError } from '../middleware/errorHandler.js';
import fs from 'fs/promises';
import path from 'path';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Generate thumbnail from video at specific timestamp
 */
export const generateThumbnail = (
  videoPath: string,
  outputPath: string,
  timestamp: string = '00:00:01'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '640x360'
      })
      .on('end', () => {
        console.log('Thumbnail generated:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error generating thumbnail:', err);
        reject(createError(`Failed to generate thumbnail: ${err.message}`, 500));
      });
  });
};

/**
 * Generate thumbnail and return as buffer
 */
export const generateThumbnailBuffer = async (
  videoPath: string
): Promise<Buffer> => {
  const tempPath = videoPath.replace(path.extname(videoPath), '-thumb.jpg');
  
  try {
    await generateThumbnail(videoPath, tempPath);
    const buffer = await fs.readFile(tempPath);
    
    // Clean up temp file
    try {
      await fs.unlink(tempPath);
    } catch (err) {
      console.error('Error cleaning up thumbnail:', err);
    }
    
    return buffer;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate multiple thumbnails at different timestamps
 */
export const generateMultipleThumbnails = (
  videoPath: string,
  outputDir: string,
  count: number = 4
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const thumbnails: string[] = [];

    ffmpeg(videoPath)
      .screenshots({
        count,
        folder: outputDir,
        filename: 'thumb-%i.jpg',
        size: '320x180'
      })
      .on('filenames', (filenames) => {
        thumbnails.push(...filenames.map(f => path.join(outputDir, f)));
      })
      .on('end', () => {
        console.log('Generated', thumbnails.length, 'thumbnails');
        resolve(thumbnails);
      })
      .on('error', (err) => {
        console.error('Error generating thumbnails:', err);
        reject(createError(`Failed to generate thumbnails: ${err.message}`, 500));
      });
  });
};
