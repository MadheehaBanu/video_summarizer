import { extractAudioFromVideo, getVideoDuration } from '../utils/ffmpeg.utils.js';
import { transcribeAudio } from '../utils/openai.utils.js';
import { generateSummary } from '../utils/summarization.utils.js';
import { downloadYouTubeVideo, getYouTubeVideoInfo } from '../utils/youtube.utils.js';
import { segmentTranscript, parseDurationToSeconds, TranscriptSegment } from '../utils/transcript.utils.js';
import { extractKeyPoints, KeyPoint } from '../services/keypoints.service.js';
import { generateThumbnailBuffer } from '../utils/thumbnail.utils.js';
import { uploadThumbnail } from '../services/storage.service.js';
import { createError } from '../middleware/errorHandler.js';
import fs from 'fs/promises';
import path from 'path';

export interface VideoProcessResult {
  summary: string;
  duration: string;
  transcript: string;
  transcriptSegments?: TranscriptSegment[];
  keyPoints?: KeyPoint[];
  thumbnailUrl?: string;
  title?: string;
}

export const processVideoFile = async (videoPath: string): Promise<VideoProcessResult> => {
  let audioPath: string | null = null;

  try {
    console.log('Starting video processing for:', videoPath);

    // Step 1: Extract audio from video
    console.log('Extracting audio from video...');
    audioPath = await extractAudioFromVideo(videoPath);

    // Step 2: Get video duration
    const duration = await getVideoDuration(videoPath);
    console.log('Video duration:', duration);

    // Step 3: Transcribe audio using OpenAI Whisper
    console.log('Transcribing audio...');
    const transcript = await transcribeAudio(audioPath);
    console.log('Transcription completed. Length:', transcript.length);

    // Steps 4-7: Run segmentation and summary in parallel
    console.log('Segmenting transcript and generating summary in parallel...');
    const durationInSeconds = parseDurationToSeconds(duration);
    const [segments, summary] = await Promise.all([
      segmentTranscript(transcript, durationInSeconds),
      generateSummary(transcript),
    ]);
    console.log('Segmentation and summary completed');

    // Step 8: Extract key points
    console.log('Extracting key points...');
    const keyPoints = await extractKeyPoints(transcript, segments, summary);
    console.log('Key points extraction completed');

    // Step 9: Generate thumbnail
    console.log('Generating thumbnail...');
    let thumbnailUrl: string | undefined;
    try {
      const thumbnailBuffer = await generateThumbnailBuffer(videoPath);
      thumbnailUrl = await uploadThumbnail(thumbnailBuffer, path.basename(videoPath));
      console.log('Thumbnail generated and uploaded');
    } catch (err) {
      console.error('Failed to generate thumbnail:', err);
      // Continue without thumbnail
    }

    return {
      summary,
      duration,
      transcript,
      transcriptSegments: segments,
      keyPoints,
      thumbnailUrl
    };
  } catch (error) {
    console.error('Error processing video:', error);
    throw createError(
      error instanceof Error ? error.message : 'Failed to process video',
      500
    );
  } finally {
    // Clean up temporary audio file
    if (audioPath) {
      try {
        await fs.unlink(audioPath);
        console.log('Cleaned up temporary audio file');
      } catch (err) {
        console.error('Error cleaning up audio file:', err);
      }
    }
  }
};

export const processYouTubeVideo = async (youtubeUrl: string): Promise<VideoProcessResult> => {
  let videoPath: string | null = null;
  let audioPath: string | null = null;

  try {
    console.log('Starting YouTube video processing for:', youtubeUrl);

    // Step 1: Get video info
    console.log('Fetching YouTube video info...');
    const videoInfo = await getYouTubeVideoInfo(youtubeUrl);
    console.log('Video title:', videoInfo.title);

    // Step 2: Download YouTube video
    console.log('Downloading YouTube video...');
    videoPath = await downloadYouTubeVideo(youtubeUrl);
    console.log('Video downloaded to:', videoPath);

    // Step 3: Extract audio from video
    console.log('Extracting audio from video...');
    audioPath = await extractAudioFromVideo(videoPath);

    // Step 4: Get video duration
    const duration = videoInfo.duration;
    console.log('Video duration:', duration);

    // Step 5: Transcribe audio using OpenAI Whisper
    console.log('Transcribing audio...');
    const transcript = await transcribeAudio(audioPath);
    console.log('Transcription completed. Length:', transcript.length);

    // Steps 6-9: Run segmentation and summary in parallel
    console.log('Segmenting transcript and generating summary in parallel...');
    const durationInSeconds = parseDurationToSeconds(duration);
    const [segments, summary] = await Promise.all([
      segmentTranscript(transcript, durationInSeconds),
      generateSummary(transcript),
    ]);
    console.log('Segmentation and summary completed');

    // Step 10: Extract key points
    console.log('Extracting key points...');
    const keyPoints = await extractKeyPoints(transcript, segments, summary);
    console.log('Key points extraction completed');

    // Step 11: Generate thumbnail
    console.log('Generating thumbnail...');
    let thumbnailUrl: string | undefined;
    try {
      const thumbnailBuffer = await generateThumbnailBuffer(videoPath);
      thumbnailUrl = await uploadThumbnail(thumbnailBuffer, path.basename(videoPath));
      console.log('Thumbnail generated and uploaded');
    } catch (err) {
      console.error('Failed to generate thumbnail:', err);
      // Continue without thumbnail
    }

    return {
      summary,
      duration,
      transcript,
      transcriptSegments: segments,
      keyPoints,
      thumbnailUrl,
      title: videoInfo.title
    };
  } catch (error) {
    console.error('Error processing YouTube video:', error);
    throw createError(
      error instanceof Error ? error.message : 'Failed to process YouTube video',
      500
    );
  } finally {
    // Clean up temporary files
    if (videoPath) {
      try {
        await fs.unlink(videoPath);
        console.log('Cleaned up temporary video file');
      } catch (err) {
        console.error('Error cleaning up video file:', err);
      }
    }
    if (audioPath) {
      try {
        await fs.unlink(audioPath);
        console.log('Cleaned up temporary audio file');
      } catch (err) {
        console.error('Error cleaning up audio file:', err);
      }
    }
  }
};
