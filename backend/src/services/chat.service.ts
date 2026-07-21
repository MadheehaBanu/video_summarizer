import OpenAI from 'openai';
import { createError } from '../middleware/errorHandler.js';

let openai: OpenAI;
const getOpenAIClient = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatContext {
  videoTitle: string;
  summary: string;
  transcript: string;
  keyPoints?: Array<{
    text: string;
    timestamp: number;
  }>;
}

export interface ChatResponse {
  message: string;
  videoTimestamps?: number[];
}

/**
 * Generate AI response for chat about video content
 */
export const generateChatResponse = async (
  userMessage: string,
  conversationHistory: ChatMessage[],
  context: ChatContext
): Promise<ChatResponse> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw createError('OpenAI API key is not configured', 500);
    }

    console.log('Generating chat response for:', userMessage);

    // Build system message with video context
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are a helpful AI assistant that answers questions about a video. 

Video Title: ${context.videoTitle}

Video Summary:
${context.summary}

Full Transcript:
${context.transcript.substring(0, 8000)} ${context.transcript.length > 8000 ? '...[truncated]' : ''}

${context.keyPoints ? `\nKey Points:\n${context.keyPoints.map((kp, i) => `${i + 1}. [${formatTimestamp(kp.timestamp)}] ${kp.text}`).join('\n')}` : ''}

Instructions:
- Answer questions specifically about this video's content
- When referencing specific moments, mention the approximate timestamp in format [MM:SS]
- Be concise but informative
- If the answer isn't in the video content, say so
- Use the transcript and summary to provide accurate answers
- When appropriate, direct users to specific timestamps for more details`
    };

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    // Call OpenAI API
    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw createError('Failed to generate chat response', 500);
    }

    // Extract timestamps from response (format: [MM:SS] or [HH:MM:SS])
    const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
    const timestamps: number[] = [];
    let match;

    while ((match = timestampRegex.exec(responseContent)) !== null) {
      const timestampStr = match[1];
      const seconds = parseTimestampToSeconds(timestampStr);
      if (seconds !== null && !timestamps.includes(seconds)) {
        timestamps.push(seconds);
      }
    }

    console.log('Chat response generated successfully');
    console.log('Extracted timestamps:', timestamps);

    return {
      message: responseContent,
      videoTimestamps: timestamps.length > 0 ? timestamps : undefined
    };
  } catch (error) {
    console.error('Error generating chat response:', error);

    if (error instanceof Error) {
      throw createError(`Chat generation failed: ${error.message}`, 500);
    }

    throw createError('Chat generation failed', 500);
  }
};

/**
 * Generate suggested questions based on video content
 */
export const generateSuggestedQuestions = async (
  context: ChatContext
): Promise<string[]> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw createError('OpenAI API key is not configured', 500);
    }

    const prompt = `Based on this video content, generate 4 relevant questions a viewer might ask:

Title: ${context.videoTitle}
Summary: ${context.summary.substring(0, 500)}

Generate questions that:
- Are specific to this video's content
- Would help understand key concepts
- Are natural and conversational
- Are under 15 words each

Return only the questions, one per line, without numbering or bullets.`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 200
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      return [
        "What are the main takeaways from this video?",
        "Can you explain the key concepts discussed?",
        "What examples were provided?",
        "Summarize the conclusion"
      ];
    }

    const questions = responseContent
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0 && q.length < 100)
      .slice(0, 4);

    return questions.length > 0 ? questions : [
      "What are the main takeaways from this video?",
      "Can you explain the key concepts discussed?",
      "What examples were provided?",
      "Summarize the conclusion"
    ];
  } catch (error) {
    console.error('Error generating suggested questions:', error);
    // Return default questions on error
    return [
      "What are the main takeaways from this video?",
      "Can you explain the key concepts discussed?",
      "What examples were provided?",
      "Summarize the conclusion"
    ];
  }
};

/**
 * Parse timestamp string to seconds
 */
const parseTimestampToSeconds = (timestamp: string): number | null => {
  const parts = timestamp.split(':').map(Number);

  if (parts.some(isNaN)) {
    return null;
  }

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return null;
};

/**
 * Format seconds to timestamp string
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
