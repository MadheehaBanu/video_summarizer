import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoPlayer, VideoPlayerRef } from '@/components/VideoPlayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { SummaryTab } from '@/components/workspace/SummaryTab';
import { ChatTab } from '@/components/workspace/ChatTab';
import { TranscriptTab } from '@/components/workspace/TranscriptTab';
import { useVideos } from '@/contexts/VideoContext';
import type { VideoData } from '@/contexts/VideoContext';

const VideoWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getVideo } = useVideos();
  const playerRef = useRef<VideoPlayerRef>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState('summary');
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    // Try to get video from context
    const video = getVideo(id);
    
    if (video) {
      setVideoData(video);
      setIsLoading(false);
    } else {
      // Video not found in context
      setIsLoading(false);
    }
  }, [id, getVideo]);

  const handleSeekToTimestamp = (seconds: number) => {
    playerRef.current?.seekTo(seconds);
    playerRef.current?.play();
  };

  const handleDownload = () => {
    if (!videoData) return;

    const content = `Title: ${videoData.title}\nDuration: ${videoData.duration}\n\nSummary:\n${videoData.summary}\n\nTranscript:\n${videoData.transcript}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${videoData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video workspace...</p>
        </div>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Video Not Found</h2>
          <p className="text-gray-600 mb-4">The requested video could not be loaded.</p>
          <Button onClick={() => navigate('/')}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/library')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Library
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{videoData.title}</h1>
                <p className="text-sm text-gray-600">Duration: {videoData.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Video Player - Sticky on larger screens */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <VideoPlayer
              ref={playerRef}
              type={videoData.type}
              src={videoData.src}
              onTimeUpdate={setCurrentTime}
            />
          </div>

          {/* Tabbed Content Panel */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-xl p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-0">
                <SummaryTab
                  summary={videoData.summary}
                  keyPoints={videoData.keyPoints || []}
                  onSeekToTimestamp={handleSeekToTimestamp}
                />
              </TabsContent>

              <TabsContent value="chat" className="mt-0">
                <ChatTab
                  videoId={videoData.id}
                  videoTitle={videoData.title}
                  videoSummary={videoData.summary}
                  videoTranscript={videoData.transcript}
                  keyPoints={videoData.keyPoints}
                  onSeekToTimestamp={handleSeekToTimestamp}
                />
              </TabsContent>

              <TabsContent value="transcript" className="mt-0">
                <TranscriptTab
                  transcript={videoData.transcript}
                  transcriptSegments={videoData.transcriptSegments}
                  currentTime={currentTime}
                  onSeekToTimestamp={handleSeekToTimestamp}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoWorkspace;
