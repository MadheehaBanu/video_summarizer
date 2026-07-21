import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-summarizer';
const USE_DATABASE = process.env.USE_DATABASE === 'true';

export const connectDatabase = async (): Promise<void> => {
  if (!USE_DATABASE) {
    console.log('💾 Database disabled - using in-memory storage');
    return;
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    console.log('⚠️  Falling back to in-memory storage');
    // Don't exit - allow app to run without database
  }
};

export const isDatabaseConnected = (): boolean => {
  return USE_DATABASE && mongoose.connection.readyState === 1;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};
