import ytDlp from 'yt-dlp-exec';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createError } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface YouTubeVideoInfo {
  title: string;
  duration: string;
  author: string;
  viewCount: number;
}

export const isValidYouTubeUrl = (url: string): boolean => {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/.test(url);
};

export const getYouTubeVideoInfo = async (url: string): Promise<YouTubeVideoInfo> => {
  try {
    if (!isValidYouTubeUrl(url)) throw createError('Invalid YouTube URL', 400);

    const info = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
    }) as any;

    const durationInSeconds = info.duration || 0;
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    return {
      title: info.title,
      duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      author: info.uploader || info.channel || 'Unknown',
      viewCount: info.view_count || 0,
    };
  } catch (error) {
    console.error('Error getting YouTube video info:', error);
    throw createError(error instanceof Error ? error.message : 'Failed to get YouTube video information', 500);
  }
};

export const downloadYouTubeVideo = async (url: string): Promise<string> => {
  try {
    if (!isValidYouTubeUrl(url)) throw createError('Invalid YouTube URL', 400);

    const uploadsDir = path.join(__dirname, '../../uploads');
    const videoId = url.match(/(?:v=|youtu\.be\/)?([\w-]{11})/)?.[1] || Date.now().toString();
    const filePrefix = `youtube-${videoId}-${Date.now()}`;
    // Use %(ext)s so yt-dlp fills in the actual extension
    const outputTemplate = path.join(uploadsDir, `${filePrefix}.%(ext)s`);

    console.log('Starting YouTube video download, prefix:', filePrefix);

    await ytDlp(url, {
      output: outputTemplate,
      format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      mergeOutputFormat: 'mp4',
      noWarnings: true,
      noCheckCertificates: true,
    });

    // Find the actual downloaded file (yt-dlp fills in the extension)
    const files = await fs.readdir(uploadsDir);
    const downloaded = files.find(f => f.startsWith(filePrefix));

    if (!downloaded) {
      throw createError('Downloaded file not found after yt-dlp completed', 500);
    }

    const videoPath = path.join(uploadsDir, downloaded);
    console.log('YouTube video download completed:', videoPath);
    return videoPath;
  } catch (error) {
    console.error('Error downloading YouTube video:', error);
    throw createError(error instanceof Error ? error.message : 'Failed to download YouTube video', 500);
  }
};

export const extractVideoId = (url: string): string | null => {
  return url.match(/(?:v=|youtu\.be\/)([\w-]{11})/)?.[1] || null;
};
