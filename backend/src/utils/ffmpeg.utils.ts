import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createError } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Extract audio from video file
 */
export const extractAudioFromVideo = (videoPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const audioPath = videoPath.replace(path.extname(videoPath), '.mp3');

    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec('libmp3lame')
      .audioBitrate('64k')
      .audioChannels(1) // Mono channel for smaller file size
      .audioFrequency(16000) // 16kHz sample rate (optimal for speech)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Audio extraction progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('Audio extraction completed:', audioPath);
        resolve(audioPath);
      })
      .on('error', (err) => {
        console.error('Error extracting audio:', err);
        reject(createError(`Failed to extract audio: ${err.message}`, 500));
      })
      .run();
  });
};

/**
 * Get video duration in format MM:SS
 */
export const getVideoDuration = (videoPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error('Error getting video duration:', err);
        reject(createError(`Failed to get video duration: ${err.message}`, 500));
        return;
      }

      const durationInSeconds = metadata.format.duration || 0;
      const minutes = Math.floor(durationInSeconds / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      resolve(formattedDuration);
    });
  });
};

/**
 * Get audio duration in seconds
 */
export const getAudioDuration = (audioPath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        console.error('Error getting audio duration:', err);
        reject(createError(`Failed to get audio duration: ${err.message}`, 500));
        return;
      }

      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
};
