import OpenAI from 'openai';
import { createError } from '../middleware/errorHandler.js';

let openai: OpenAI;
const getOpenAIClient = () => {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
};

/**
 * Generate a comprehensive summary from transcript using GPT
 */
export const generateSummary = async (transcript: string): Promise<string> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw createError('OpenAI API key is not configured', 500);
    }

    console.log('Starting summary generation with GPT...');

    // Truncate transcript if too long (GPT-4 has token limits)
    const maxLength = 12000; // Approximately 3000 tokens
    const truncatedTranscript = transcript.length > maxLength 
      ? transcript.substring(0, maxLength) + '...[truncated]'
      : transcript;

    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating comprehensive, well-structured video summaries. 
Your summaries should:
- Be detailed and informative
- Use bullet points for clarity
- Highlight key topics and insights
- Include important data, statistics, or findings mentioned
- Use markdown formatting with bold (**text**) for emphasis
- Be organized into logical sections
- Be approximately 200-400 words`
        },
        {
          role: 'user',
          content: `Please create a comprehensive summary of this video transcript:\n\n${truncatedTranscript}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      throw createError('Failed to generate summary from GPT', 500);
    }

    console.log('Summary generation successful');
    return summary.trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    
    if (error instanceof Error) {
      throw createError(`Summary generation failed: ${error.message}`, 500);
    }
    
    throw createError('Summary generation failed', 500);
  }
};

/**
 * Generate a summary with custom instructions
 */
export const generateCustomSummary = async (
  transcript: string,
  customInstructions: string
): Promise<string> => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw createError('OpenAI API key is not configured', 500);
    }

    const maxLength = 12000;
    const truncatedTranscript = transcript.length > maxLength 
      ? transcript.substring(0, maxLength) + '...[truncated]'
      : transcript;

    const completion = await getOpenAIClient().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: customInstructions
        },
        {
          role: 'user',
          content: `Please summarize this video transcript:\n\n${truncatedTranscript}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      throw createError('Failed to generate custom summary', 500);
    }

    return summary.trim();
  } catch (error) {
    console.error('Error generating custom summary:', error);
    throw createError('Custom summary generation failed', 500);
  }
};
