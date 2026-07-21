import express from 'express';
import { upload } from '../middleware/upload.js';
import { uploadVideo, processYouTube } from '../controllers/video.controller.js';

const router = express.Router();

// Upload and process local video
router.post('/upload-video', upload.single('video'), uploadVideo);

// Process YouTube video
router.post('/process-youtube', processYouTube);

export default router;
