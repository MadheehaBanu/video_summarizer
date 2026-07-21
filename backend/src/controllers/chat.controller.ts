import { Request, Response, NextFunction } from 'express';
import { generateChatResponse, generateSuggestedQuestions, ChatMessage, ChatContext } from '../services/chat.service.js';
import { createError } from '../middleware/errorHandler.js';

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      message,
      conversationHistory,
      videoContext
    }: {
      message: string;
      conversationHistory: ChatMessage[];
      videoContext: ChatContext;
    } = req.body;

    // Validation
    if (!message || typeof message !== 'string') {
      throw createError('Message is required', 400);
    }

    if (!videoContext || !videoContext.videoTitle || !videoContext.transcript) {
      throw createError('Video context is required', 400);
    }

    console.log('Processing chat request for video:', videoContext.videoTitle);

    const response = await generateChatResponse(
      message,
      conversationHistory || [],
      videoContext
    );

    res.json({
      success: true,
      data: {
        message: response.message,
        videoTimestamps: response.videoTimestamps,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSuggestedQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoContext }: { videoContext: ChatContext } = req.body;

    if (!videoContext || !videoContext.videoTitle || !videoContext.summary) {
      throw createError('Video context is required', 400);
    }

    console.log('Generating suggested questions for:', videoContext.videoTitle);

    const questions = await generateSuggestedQuestions(videoContext);

    res.json({
      success: true,
      data: {
        questions
      }
    });
  } catch (error) {
    next(error);
  }
};
