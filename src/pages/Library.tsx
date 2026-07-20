import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Video, Clock, Calendar, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import { VideoCardSkeleton } from '@/components/skeletons/VideoCardSkeleton';
import { useVideos } from '@/contexts/VideoContext';
import type { VideoData } from '@/contexts/VideoContext';

const Library: React.FC = () => {
  const navigate = useNavigate();
  const { videos } = useVideos();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading and set initial videos
  useEffect(() => {
    setTimeout(() => {
      setFilteredVideos(videos);
      setIsLoading(false);
    }, 500);
  }, [videos]);

  // Filter videos based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVideos(videos);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = videos.filter(
      video =>
        video.title.toLowerCase().includes(query) ||
        video.summary.toLowerCase().includes(query) ||
        video.transcript.toLowerCase().includes(query)
    );

    setFilteredVideos(filtered);
  }, [searchQuery, videos]);

  const handleVideoClick = (videoId: string) => {
    navigate(`/workspace/${videoId}`);
  };

  const handleNewVideo = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Subtle Background Decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.05),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.05),transparent_50%)]"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6 fade-in-up">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Video Library 📚
                </h1>
                <p className="text-slate-600 mt-2 font-medium">
                  {videos.length} {videos.length === 1 ? 'video' : 'videos'} saved ✨
                </p>
              </div>
              <Button 
                onClick={handleNewVideo} 
                className="gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white hover:shadow-xl transition-all duration-300 scale-hover relative overflow-hidden group shadow-lg"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  New Video
                </span>
                <div className="absolute inset-0 shimmer"></div>
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl fade-in-up" style={{ animationDelay: '0.1s' }}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search videos and transcripts... 🔍"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-12 bg-white border-2 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {isLoading ? (
            // Loading Skeletons
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <VideoCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            // Empty State
            videos.length === 0 ? (
              <EmptyState
                title="No videos yet"
                description="Start by uploading a video or providing a YouTube link to create your first summary."
                actionLabel="Create First Video"
                onAction={handleNewVideo}
              />
            ) : (
              <EmptyState
                title="No results found"
                description={`No videos match "${searchQuery}". Try a different search term.`}
                actionLabel="Clear Search"
                onAction={() => setSearchQuery('')}
              />
            )
          ) : (
            // Video Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video, index) => (
                <Card
                  key={video.id}
                  className="cursor-pointer bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-indigo-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group fade-in-up"
                  onClick={() => handleVideoClick(video.id)}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/40 transition-all flex items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center group-hover:scale-125 transition-all duration-300 shadow-2xl">
                        <Video className="w-10 h-10 text-indigo-600" />
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm',
                        video.type === 'youtube'
                          ? 'bg-red-500 text-white'
                          : 'bg-indigo-500 text-white'
                      )}>
                        {video.type === 'youtube' ? '📺 YouTube' : '📤 Upload'}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-lg">
                      ⏱️ {video.duration}
                    </div>
                  </div>

                  {/* Content */}
                  <CardContent className="p-5 bg-white group-hover:bg-gradient-to-br group-hover:from-indigo-50/50 group-hover:to-purple-50/50 transition-all">
                    <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                      {video.title}
                    </h3>

                    <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                      {video.summary.substring(0, 120)}...
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{video.date.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{video.duration}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Results Info */}
          {!isLoading && filteredVideos.length > 0 && searchQuery && (
            <div className="mt-10 text-center fade-in-up">
              <p className="text-slate-700 text-lg font-medium bg-white inline-block px-6 py-3 rounded-full shadow-lg border-2 border-indigo-200">
                🎯 Showing <span className="font-bold text-indigo-600">{filteredVideos.length}</span> of <span className="font-bold text-indigo-600">{videos.length}</span> videos
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Library;
