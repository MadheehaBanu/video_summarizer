
import React, { useState } from 'react';
import { VideoUpload } from '@/components/VideoUpload';
import { SummaryDisplay } from '@/components/SummaryDisplay';
import { Header } from '@/components/Header';
import { FeatureSection } from '@/components/FeatureSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';

export interface VideoSummary {
  id: string;
  title: string;
  summary: string;
  duration?: string;
  processingTime?: string;
  videoUrl?: string;
}

const Index = () => {
  const [currentSummary, setCurrentSummary] = useState<VideoSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVideoProcess = async (videoData: { file?: File; youtubeUrl?: string }) => {
    console.log('Starting video processing...', videoData);
    setIsProcessing(true);
    setCurrentSummary(null); // Clear any existing summary
    
    try {
      // Simulate processing with more realistic timing
      console.log('Processing video...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSummary: VideoSummary = {
        id: Date.now().toString(),
        title: videoData.youtubeUrl 
          ? `YouTube Video: ${videoData.youtubeUrl.split('v=')[1]?.substring(0, 8) || 'Unknown'}` 
          : videoData.file?.name || "Uploaded Video",
        summary: `This comprehensive video summary covers the main topics discussed in the content:\n\n• **Introduction and Context**: The video begins by establishing the primary subject matter and its relevance to current industry trends and viewer interests.\n\n• **Core Content Analysis**: The presenter provides detailed insights into the main topic, breaking down complex concepts into digestible segments for better understanding.\n\n• **Key Findings and Data**: Important statistics, research findings, and data points are presented to support the main arguments and provide evidence-based conclusions.\n\n• **Practical Applications**: The content includes real-world examples and practical tips that viewers can implement in their own projects or daily practices.\n\n• **Expert Perspectives**: Industry experts and thought leaders share their opinions and predictions about future developments in this field.\n\n• **Conclusion and Takeaways**: The video concludes with a summary of the most important points and actionable advice for viewers.\n\nThis summary provides a comprehensive overview of the video content, highlighting the most valuable insights and practical information shared throughout the presentation.`,
        duration: videoData.youtubeUrl ? "12:45" : "8:30",
        processingTime: "2.1s",
        videoUrl: videoData.youtubeUrl
      };
      
      console.log('Processing completed successfully:', mockSummary);
      setCurrentSummary(mockSummary);
    } catch (error) {
      console.error('Processing failed:', error);
      // You could add error handling here with a toast
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Video Summarizer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform any video into a concise, readable summary. Upload local files or paste YouTube links 
            to get instant AI-powered summaries that you can copy and download.
          </p>
        </div>
         <div className="mt-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Upload your first video and experience the power of AI-driven content summarization
        </p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
          Try It Now
        </button>
      </div>
        <div className="max-w-4xl mx-auto">
          <VideoUpload 
            onVideoProcess={handleVideoProcess}
            isProcessing={isProcessing}
          />
          
          {currentSummary && (
            <div className="mt-12">
              <SummaryDisplay summary={currentSummary} />
            </div>
          )}
        </div>

        <HowItWorksSection />
        <FeatureSection />
      </main>
    </div>
  );
};

export default Index;
