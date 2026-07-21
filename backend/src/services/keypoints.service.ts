import OpenAI from 'openai';
import { createError } from '../middleware/errorHandler.js';
import { TranscriptSegment } from '../utils/transcript.utils.js';

let openai: OpenAI;
const getOpenAIClient = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

export interface KeyPoint {
  text: string;
  timestamp: number;
  importance: 'high' | 'medium' | 'low';
}

/**
 * Extract key points with timestamps from transcript using GPT
 */
export const extractKeyPoints = async (
  transcript: string,
  transcriptSegments: TranscriptSegment[],
  summary: string
): Promise<KeyPoint[]> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw createError('OpenAI API key is not configured', 500);
    }

    console.log('Extracting key points from transcript...');

    // Build segment reference for GPT
    const segmentReference = transcriptSegments
      .map((seg, i) => `[${formatTimestamp(seg.startTime)}-${formatTimestamp(seg.endTime)}] ${seg.text.substring(0, 200)}...`)
      .join('\n\n');

    const prompt = `Analyze this video content and extract 5-8 key points. Each key point should represent an important concept, insight, or takeaway from the video.

Video Summary:
${summary}

Transcript with timestamps:
${segmentReference.substring(0, 8000)}

For each key point:
1. Write a clear, concise description (1-2 sentences)
2. Identify the approximate timestamp when this point is discussed
3. Rate its importance (high/medium/low)

Return as JSON:
{
  "keyPoints": [
    {
      "text": "Clear description of the key point",
      "timestamp": 125,
      "importance": "high"
    }
  ]
}

Guidelines:
- Extract 5-8 key points (fewer for short videos, more for long ones)
- Focus on main ideas, not minor details
- Timestamps should match when the topic is actually discussed
- High importance: Critical concepts or main takeaways
- Medium importance: Supporting points or examples
- Low importance: Additional context or minor details
- Ensure points are distributed throughout the video
- Return ONLY valid JSON, no additional text`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw createError('Failed to extract key points', 500);
    }

    try {
      const parsed = JSON.parse(responseContent);
      const keyPoints = parsed.keyPoints || [];

      if (!Array.isArray(keyPoints)) {
        throw new Error('Invalid response format');
      }

      // Validate and clean key points
      const validatedKeyPoints: KeyPoint[] = keyPoints
        .filter((kp: any) => 
          typeof kp.text === 'string' &&
          typeof kp.timestamp === 'number' &&
          kp.text.trim().length > 0
        )
        .map((kp: any) => ({
          text: kp.text.trim(),
          timestamp: Math.max(0, Math.floor(kp.timestamp)),
          importance: validateImportance(kp.importance)
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp

      if (validatedKeyPoints.length === 0) {
        // Fallback: Create key points from transcript segments
        return createFallbackKeyPoints(transcriptSegments);
      }

      console.log(`Extracted ${validatedKeyPoints.length} key points`);
      return validatedKeyPoints;

    } catch (parseError) {
      console.error('Error parsing key points response:', parseError);
      // Fallback to simple extraction
      return createFallbackKeyPoints(transcriptSegments);
    }

  } catch (error) {
    console.error('Error extracting key points:', error);
    // Fallback to simple extraction
    return createFallbackKeyPoints(transcriptSegments);
  }
};

/**
 * Enhance key points with additional context
 */
export const enhanceKeyPoints = async (
  keyPoints: KeyPoint[],
  transcript: string
): Promise<KeyPoint[]> => {
  try {
    if (!process.env.OPENAI_API_KEY || keyPoints.length === 0) {
      return keyPoints;
    }

    console.log('Enhancing key points with context...');

    const keyPointsList = keyPoints
      .map((kp, i) => `${i + 1}. [${formatTimestamp(kp.timestamp)}] ${kp.text}`)
      .join('\n');

    const prompt = `Review these key points and enhance them if needed. Make them clearer, more specific, or more actionable while keeping them concise.

Key Points:
${keyPointsList}

Transcript context (first 4000 chars):
${transcript.substring(0, 4000)}

Return enhanced key points as JSON:
{
  "keyPoints": [
    {
      "text": "Enhanced description",
      "timestamp": 125,
      "importance": "high"
    }
  ]
}

Keep the same timestamps and importance levels. Only improve the text descriptions.
Return ONLY valid JSON, no additional text.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return keyPoints;
    }

    const parsed = JSON.parse(responseContent);
    const enhancedPoints = parsed.keyPoints || [];

    if (Array.isArray(enhancedPoints) && enhancedPoints.length > 0) {
      return enhancedPoints.map((kp: any) => ({
        text: kp.text?.trim() || kp.text,
        timestamp: kp.timestamp,
        importance: validateImportance(kp.importance)
      }));
    }

    return keyPoints;

  } catch (error) {
    console.error('Error enhancing key points:', error);
    return keyPoints;
  }
};

/**
 * Fallback: Create simple key points from transcript segments
 */
const createFallbackKeyPoints = (segments: TranscriptSegment[]): KeyPoint[] => {
  // Select evenly distributed segments as key points
  const numKeyPoints = Math.min(6, segments.length);
  const step = Math.floor(segments.length / numKeyPoints);

  const keyPoints: KeyPoint[] = [];

  for (let i = 0; i < numKeyPoints && i * step < segments.length; i++) {
    const segment = segments[i * step];
    keyPoints.push({
      text: segment.text.substring(0, 150) + (segment.text.length > 150 ? '...' : ''),
      timestamp: segment.startTime,
      importance: i === 0 || i === numKeyPoints - 1 ? 'high' : 'medium'
    });
  }

  return keyPoints;
};

/**
 * Validate importance level
 */
const validateImportance = (importance: any): 'high' | 'medium' | 'low' => {
  if (importance === 'high' || importance === 'medium' || importance === 'low') {
    return importance;
  }
  return 'medium'; // Default
};

/**
 * Format seconds to timestamp string (MM:SS or HH:MM:SS)
 */
const formatTimestamp = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
