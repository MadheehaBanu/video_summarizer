import { Request, Response, NextFunction } from 'express';
import { processVideoFile, processYouTubeVideo } from '../services/video.service.js';
import { uploadVideo as uploadToStorage } from '../services/storage.service.js';
import { createError } from '../middleware/errorHandler.js';
import fs from 'fs/promises';

export const uploadVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw createError('No video file uploaded', 400);
    }

    console.log('Processing uploaded video:', req.file.filename);
    const startTime = Date.now();

    // Process video (transcription, summarization, etc.)
    const result = await processVideoFile(req.file.path);
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

    // Upload to cloud storage (or keep local)
    console.log('Uploading video to storage...');
    const storageResult = await uploadToStorage(
      req.file.path,
      req.file.originalname,
      req.body.userId // Optional user ID for organizing files
    );

    // Clean up local uploaded file if it was uploaded to cloud
    if (storageResult.provider === 's3') {
      try {
        await fs.unlink(req.file.path);
        console.log('Cleaned up local file after cloud upload');
      } catch (err) {
        console.error('Error deleting local file:', err);
      }
    }

    res.json({
      success: true,
      data: {
        id: Date.now().toString(),
        title: req.file.originalname,
        summary: result.summary,
        duration: result.duration,
        processingTime: `${processingTime}s`,
        transcript: result.transcript,
        transcriptSegments: result.transcriptSegments,
        keyPoints: result.keyPoints,
        videoUrl: storageResult.url,
        videoKey: storageResult.key,
        storageProvider: storageResult.provider,
        thumbnailUrl: result.thumbnailUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

export const processYouTube = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { youtubeUrl } = req.body;

    if (!youtubeUrl) {
      throw createError('YouTube URL is required', 400);
    }

    console.log('Processing YouTube video:', youtubeUrl);
    const startTime = Date.now();

    const result = await processYouTubeVideo(youtubeUrl);
    
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

    res.json({
      success: true,
      data: {
        id: Date.now().toString(),
        title: result.title,
        summary: result.summary,
        duration: result.duration,
        processingTime: `${processingTime}s`,
        videoUrl: youtubeUrl,
        transcript: result.transcript,
        transcriptSegments: result.transcriptSegments,
        keyPoints: result.keyPoints,
        thumbnailUrl: result.thumbnailUrl
      }
    });
  } catch (error) {
    console.error('YouTube processing error details:', error);
    next(error);
  }
};
