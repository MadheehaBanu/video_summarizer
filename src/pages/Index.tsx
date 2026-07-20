
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoUpload } from '@/components/VideoUpload';
import { ProcessingStepper, ProcessingStep } from '@/components/ProcessingStepper';
import { Header } from '@/components/Header';
import { FeatureSection } from '@/components/FeatureSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { Button } from '@/components/ui/button';
import { uploadVideo, processYouTubeVideo } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';
import { useVideos } from '@/contexts/VideoContext';
import { Library } from 'lucide-react';

export interface VideoSummary {
  id: string;
  title: string;
  summary: string;
  duration?: string;
  processingTime?: string;
  videoUrl?: string;
  transcript?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { addVideo } = useVideos();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('uploading');
  const { toast } = useToast();

  const handleVideoProcess = async (videoData: { file?: File; youtubeUrl?: string }) => {
    console.log('Starting video processing...', videoData);
    setIsProcessing(true);
    setProcessingStep('uploading');

    // Advance steps automatically while API processes in background
    const stepTimings: { step: ProcessingStep; delay: number }[] = [
      { step: 'transcribing', delay: 3000 },
      { step: 'analyzing', delay: 30000 },
      { step: 'summarizing', delay: 55000 },
      { step: 'extracting', delay: 75000 },
    ];
    const timers = stepTimings.map(({ step, delay }) =>
      setTimeout(() => setProcessingStep(step), delay)
    );

    try {
      let result;

      if (videoData.file) {
        result = await uploadVideo(videoData.file);
      } else if (videoData.youtubeUrl) {
        result = await processYouTubeVideo(videoData.youtubeUrl);
      } else {
        throw new Error('No video file or YouTube URL provided');
      }

      timers.forEach(clearTimeout);
      setProcessingStep('complete');
      
      console.log('Processing completed successfully:', result);
      
      // Save video to context
      addVideo({
        id: result.id,
        title: result.title,
        type: videoData.youtubeUrl ? 'youtube' : 'file',
        src: result.videoKey || result.videoUrl || videoData.youtubeUrl || '',
        videoUrl: result.videoUrl,
        duration: result.duration || '0:00',
        summary: result.summary,
        transcript: result.transcript || '',
        transcriptSegments: result.transcriptSegments,
        keyPoints: result.keyPoints,
        processingTime: result.processingTime,
        date: new Date(),
        thumbnail: result.thumbnailUrl || '/placeholder.svg'
      });
      
      toast({
        title: "✅ Success!",
        description: "Your video summary is ready.",
      });
      
      // Navigate to workspace
      setTimeout(() => {
        navigate(`/workspace/${result.id}`);
      }, 1000);
      
    } catch (error) {
      timers.forEach(clearTimeout);
      console.error('Processing failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      toast({
        title: "❌ Processing failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="particle-bg absolute inset-0 z-0"></div>
      
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          {/* Header Section with Animations */}
          <div className="text-center mb-12 fade-in-up">
            <div className="flex items-center justify-between max-w-3xl mx-auto mb-6">
              <h1 className="text-6xl font-extrabold gradient-text-animated float-animation">
                Video Summarizer
              </h1>
              <Button
                variant="outline"
                onClick={() => navigate('/library')}
                className="gap-2 bg-white/90 hover:bg-white scale-hover border-2 border-indigo-400 text-indigo-700 hover:text-indigo-900 hover:border-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              >
                <Library className="w-4 h-4" />
                My Library
              </Button>
            </div>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-sm">
              Transform any video into a concise, readable summary. Upload local files or paste YouTube links 
              to get instant AI-powered summaries that you can copy and download. ✨
            </p>
          </div>

          {/* Processing Stepper or Upload Section */}
          {isProcessing ? (
            <div className="max-w-4xl mx-auto bounce-in">
              <ProcessingStepper currentStep={processingStep} />
            </div>
          ) : (
            <>
              <div className="max-w-4xl mx-auto fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="glass rounded-3xl p-8 shadow-xl border border-white/40">
                  <VideoUpload 
                    onVideoProcess={handleVideoProcess}
                    isProcessing={isProcessing}
                  />
                </div>
              </div>

              <div className="mt-16 glass-dark rounded-3xl p-10 text-slate-800 text-center max-w-4xl mx-auto card-3d shadow-xl fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="relative">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-6xl">
                    🚀
                  </div>
                  <h3 className="text-3xl font-bold mb-4 mt-4 gradient-text-animated">
                    Ready to Get Started?
                  </h3>
                  <p className="text-slate-600 mb-6 max-w-2xl mx-auto text-lg">
                    Upload your first video and experience the power of AI-driven content summarization
                  </p>
                  <div className="flex gap-2 justify-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {!isProcessing && (
            <div className="fade-in-up" style={{ animationDelay: '0.6s' }}>
              <HowItWorksSection />
              <FeatureSection />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
