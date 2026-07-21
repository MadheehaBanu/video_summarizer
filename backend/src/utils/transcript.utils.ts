import OpenAI from 'openai';
import { createError } from '../middleware/errorHandler.js';

let openai: OpenAI;
const getOpenAIClient = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

export interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

/**
 * Segment transcript into time-based chunks using GPT
 * This creates natural segments based on content breaks
 */
export const segmentTranscript = async (
  transcript: string,
  videoDurationSeconds: number
): Promise<TranscriptSegment[]> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw createError('OpenAI API key is not configured', 500);
    }

    console.log('Segmenting transcript...');

    // If transcript is too long, truncate it
    const maxLength = 12000;
    const truncatedTranscript = transcript.length > maxLength 
      ? transcript.substring(0, maxLength) + '...[truncated]'
      : transcript;

    const prompt = `Analyze this video transcript and divide it into logical segments (4-8 segments). Each segment should represent a coherent topic or section.

Video Duration: ${formatDuration(videoDurationSeconds)}
Transcript:
${truncatedTranscript}

For each segment, provide:
1. Estimated start time (in seconds)
2. Estimated end time (in seconds)
3. The text content for that segment
4. Speaker label if you can identify different speakers (optional)

Return the segments as a JSON array with this structure:
[
  {
    "startTime": 0,
    "endTime": 45,
    "text": "segment text here",
    "speaker": "Speaker 1" // optional
  }
]

Make sure:
- Segments cover the entire video duration
- Timestamps are in seconds
- Each segment is 15-90 seconds long
- Text is the actual transcript content for that time period
- Segments don't overlap
- Return ONLY valid JSON, no additional text`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw createError('Failed to segment transcript', 500);
    }

    try {
      const parsed = JSON.parse(responseContent);
      const segments = parsed.segments || parsed;

      if (!Array.isArray(segments)) {
        throw new Error('Invalid response format');
      }

      // Validate and clean segments
      const validatedSegments: TranscriptSegment[] = segments
        .filter((seg: any) => 
          typeof seg.startTime === 'number' &&
          typeof seg.endTime === 'number' &&
          typeof seg.text === 'string' &&
          seg.text.trim().length > 0
        )
        .map((seg: any) => ({
          startTime: Math.max(0, Math.floor(seg.startTime)),
          endTime: Math.min(videoDurationSeconds, Math.floor(seg.endTime)),
          text: seg.text.trim(),
          speaker: seg.speaker || undefined
        }));

      if (validatedSegments.length === 0) {
        // Fallback to simple segmentation
        return createSimpleSegments(transcript, videoDurationSeconds);
      }

      console.log(`Created ${validatedSegments.length} transcript segments`);
      return validatedSegments;

    } catch (parseError) {
      console.error('Error parsing segmentation response:', parseError);
      // Fallback to simple segmentation
      return createSimpleSegments(transcript, videoDurationSeconds);
    }

  } catch (error) {
    console.error('Error segmenting transcript:', error);
    // Fallback to simple segmentation
    return createSimpleSegments(transcript, videoDurationSeconds);
  }
};

/**
 * Fallback: Create simple time-based segments
 */
const createSimpleSegments = (
  transcript: string,
  videoDurationSeconds: number
): TranscriptSegment[] => {
  const words = transcript.split(/\s+/);
  const wordsPerSegment = Math.ceil(words.length / 8); // Aim for ~8 segments
  const secondsPerSegment = videoDurationSeconds / 8;

  const segments: TranscriptSegment[] = [];

  for (let i = 0; i < 8; i++) {
    const startIndex = i * wordsPerSegment;
    const endIndex = Math.min((i + 1) * wordsPerSegment, words.length);
    
    if (startIndex >= words.length) break;

    const segmentText = words.slice(startIndex, endIndex).join(' ');
    
    segments.push({
      startTime: Math.floor(i * secondsPerSegment),
      endTime: Math.min(Math.floor((i + 1) * secondsPerSegment), videoDurationSeconds),
      text: segmentText
    });
  }

  return segments;
};

/**
 * Detect speaker changes in transcript using GPT
 */
export const detectSpeakers = async (
  segments: TranscriptSegment[]
): Promise<TranscriptSegment[]> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return segments;
    }

    // Only process if we don't already have speaker labels
    if (segments.some(seg => seg.speaker)) {
      return segments;
    }

    // Combine segments for analysis
    const transcriptText = segments
      .map((seg, i) => `[${i}] ${seg.text}`)
      .join('\n\n');

    const prompt = `Analyze this transcript and identify if there are multiple speakers. If there are, label each segment with the appropriate speaker.

Transcript segments:
${transcriptText.substring(0, 8000)}

For each segment number, identify the speaker. Return as JSON:
{
  "segments": [
    { "index": 0, "speaker": "Speaker 1" },
    { "index": 1, "speaker": "Speaker 2" }
  ]
}

If you can't identify multiple speakers, return an empty segments array.
Return ONLY valid JSON, no additional text.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return segments;
    }

    const parsed = JSON.parse(responseContent);
    const speakerLabels = parsed.segments || [];

    if (!Array.isArray(speakerLabels) || speakerLabels.length === 0) {
      return segments;
    }

    // Apply speaker labels
    const updatedSegments = segments.map((seg, index) => {
      const label = speakerLabels.find((l: any) => l.index === index);
      if (label && label.speaker) {
        return { ...seg, speaker: label.speaker };
      }
      return seg;
    });

    return updatedSegments;

  } catch (error) {
    console.error('Error detecting speakers:', error);
    return segments;
  }
};

/**
 * Format duration in seconds to readable string
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Convert duration string (MM:SS or HH:MM:SS) to seconds
 */
export const parseDurationToSeconds = (duration: string): number => {
  const parts = duration.split(':').map(Number);

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return 0;
};
