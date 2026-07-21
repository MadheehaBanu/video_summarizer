import OpenAI from 'openai';
import fs from 'fs';
import { createError } from '../middleware/errorHandler.js';

let openai: OpenAI;
const getOpenAIClient = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 300000,
      maxRetries: 0,
    });
  }
  return openai;
};

/**
 * Transcribe audio file using OpenAI Whisper API
 */
export const transcribeAudio = async (audioPath: string): Promise<string> => {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!process.env.OPENAI_API_KEY) {
        throw createError('OpenAI API key is not configured', 500);
      }

      console.log(`Starting transcription with Whisper API (attempt ${attempt}/${maxRetries})...`);

      const stats = fs.statSync(audioPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      console.log(`Audio file size: ${fileSizeInMB.toFixed(2)}MB`);

      if (fileSizeInMB > 25) {
        throw createError('Audio file is too large for transcription (max 25MB)', 400);
      }

      const transcription = await getOpenAIClient().audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        language: 'en',
        response_format: 'text'
      });

      if (!transcription || typeof transcription !== 'string') {
        throw createError('Failed to get transcription from Whisper API', 500);
      }

      console.log('Transcription successful');
      return transcription;
    } catch (error) {
      const isConnectionError = error instanceof Error &&
        (error.message.includes('Connection error') ||
         error.message.includes('ECONNRESET') ||
         error.message.includes('ETIMEDOUT') ||
         error.message.includes('fetch failed'));

      if (isConnectionError && attempt < maxRetries) {
        const waitMs = attempt * 5000; // 5s, 10s between retries
        console.warn(`Connection error on attempt ${attempt}, retrying in ${waitMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }

      console.error('Error transcribing audio:', error);
      if (error instanceof Error) {
        throw createError(`Transcription failed: ${error.message}`, 500);
      }
      throw createError('Transcription failed', 500);
    }
  }

  throw createError('Transcription failed after all retries', 500);
};

/**
 * Check if OpenAI API is configured
 */
export const isOpenAIConfigured = (): boolean => {
  return !!process.env.OPENAI_API_KEY;
};
