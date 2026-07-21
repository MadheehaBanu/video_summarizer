import express from 'express';
import { chat, getSuggestedQuestions } from '../controllers/chat.controller.js';

const router = express.Router();

// Send chat message and get AI response
router.post('/chat', chat);

// Get suggested questions for a video
router.post('/suggested-questions', getSuggestedQuestions);

export default router;
