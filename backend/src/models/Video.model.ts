import mongoose, { Document, Schema } from 'mongoose';

export interface ITranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

export interface IKeyPoint {
  text: string;
  timestamp: number;
  importance: 'high' | 'medium' | 'low';
}

export interface IVideo extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: 'file' | 'youtube';
  videoUrl: string;
  videoKey?: string;
  storageProvider?: 'local' | 's3';
  thumbnailUrl?: string;
  duration: string;
  summary: string;
  transcript: string;
  transcriptSegments?: ITranscriptSegment[];
  keyPoints?: IKeyPoint[];
  processingTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSegmentSchema = new Schema<ITranscriptSegment>({
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  text: { type: String, required: true },
  speaker: { type: String }
}, { _id: false });

const KeyPointSchema = new Schema<IKeyPoint>({
  text: { type: String, required: true },
  timestamp: { type: Number, required: true },
  importance: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  }
}, { _id: false });

const VideoSchema = new Schema<IVideo>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['file', 'youtube'],
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  videoKey: {
    type: String
  },
  storageProvider: {
    type: String,
    enum: ['local', 's3'],
    default: 'local'
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  transcript: {
    type: String,
    required: true
  },
  transcriptSegments: [TranscriptSegmentSchema],
  keyPoints: [KeyPointSchema],
  processingTime: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
VideoSchema.index({ userId: 1, createdAt: -1 });
VideoSchema.index({ title: 'text', summary: 'text', transcript: 'text' }); // Text search

export const Video = mongoose.model<IVideo>('Video', VideoSchema);
