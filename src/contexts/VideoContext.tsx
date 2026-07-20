import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface VideoData {
  id: string;
  title: string;
  type: 'file' | 'youtube';
  src: string; // File URL or YouTube video ID
  videoUrl?: string; // Original YouTube URL
  duration: string;
  summary: string;
  transcript: string;
  transcriptSegments?: Array<{
    startTime: number;
    endTime: number;
    text: string;
    speaker?: string;
  }>;
  keyPoints?: Array<{
    text: string;
    timestamp: number;
    importance?: 'high' | 'medium' | 'low';
  }>;
  processingTime?: string;
  date: Date;
  thumbnail?: string;
}

interface VideoContextType {
  videos: VideoData[];
  addVideo: (video: VideoData) => void;
  getVideo: (id: string) => VideoData | undefined;
  deleteVideo: (id: string) => void;
  updateVideo: (id: string, updates: Partial<VideoData>) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

const STORAGE_KEY = 'video_summarizer_videos';

export const VideoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<VideoData[]>([]);

  // Load videos from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const videosWithDates = parsed.map((video: any) => ({
          ...video,
          date: new Date(video.date)
        }));
        setVideos(videosWithDates);
      } catch (error) {
        console.error('Error loading videos from localStorage:', error);
      }
    }
  }, []);

  // Save videos to localStorage whenever they change
  useEffect(() => {
    if (videos.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
    }
  }, [videos]);

  const addVideo = (video: VideoData) => {
    setVideos(prev => [video, ...prev]);
  };

  const getVideo = (id: string): VideoData | undefined => {
    return videos.find(video => video.id === id);
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => prev.filter(video => video.id !== id));
  };

  const updateVideo = (id: string, updates: Partial<VideoData>) => {
    setVideos(prev =>
      prev.map(video =>
        video.id === id ? { ...video, ...updates } : video
      )
    );
  };

  return (
    <VideoContext.Provider
      value={{
        videos,
        addVideo,
        getVideo,
        deleteVideo,
        updateVideo
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

export const useVideos = (): VideoContextType => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideos must be used within a VideoProvider');
  }
  return context;
};
