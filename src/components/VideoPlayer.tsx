import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimestamp } from './TimestampChip';

interface VideoPlayerProps {
  type: 'file' | 'youtube';
  src: string; // File URL or YouTube video ID
  onTimeUpdate?: (currentTime: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

export interface VideoPlayerRef {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ type, src, onTimeUpdate, onPlay, onPause, className }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const youtubePlayerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (type === 'file' && videoRef.current) {
          videoRef.current.currentTime = seconds;
        } else if (type === 'youtube' && youtubePlayerRef.current) {
          youtubePlayerRef.current.seekTo(seconds, true);
        }
      },
      play: () => {
        if (type === 'file' && videoRef.current) {
          videoRef.current.play();
        } else if (type === 'youtube' && youtubePlayerRef.current) {
          youtubePlayerRef.current.playVideo();
        }
      },
      pause: () => {
        if (type === 'file' && videoRef.current) {
          videoRef.current.pause();
        } else if (type === 'youtube' && youtubePlayerRef.current) {
          youtubePlayerRef.current.pauseVideo();
        }
      },
      getCurrentTime: () => {
        if (type === 'file' && videoRef.current) {
          return videoRef.current.currentTime;
        } else if (type === 'youtube' && youtubePlayerRef.current) {
          return youtubePlayerRef.current.getCurrentTime() || 0;
        }
        return 0;
      }
    }));

    // Initialize YouTube Player
    useEffect(() => {
      if (type !== 'youtube') return;

      // Load YouTube IFrame API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        youtubePlayerRef.current = new (window as any).YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: src,
          playerVars: {
            playsinline: 1,
            modestbranding: 1,
            rel: 0
          },
          events: {
            onReady: (event: any) => {
              setDuration(event.target.getDuration());
            },
            onStateChange: (event: any) => {
              const playerState = event.data;
              // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
              setIsPlaying(playerState === 1);
              
              if (playerState === 1) {
                onPlay?.();
              } else if (playerState === 2) {
                onPause?.();
              }
            }
          }
        });

        // Poll for time updates
        const interval = setInterval(() => {
          if (youtubePlayerRef.current && youtubePlayerRef.current.getCurrentTime) {
            const time = youtubePlayerRef.current.getCurrentTime();
            setCurrentTime(time);
            onTimeUpdate?.(time);
          }
        }, 100);

        return () => clearInterval(interval);
      };
    }, [type, src]);

    // Handle HTML5 video events
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        const time = videoRef.current.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current) {
        setDuration(videoRef.current.duration);
      }
    };

    const togglePlayPause = () => {
      if (type === 'file' && videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      } else if (type === 'youtube' && youtubePlayerRef.current) {
        if (isPlaying) {
          youtubePlayerRef.current.pauseVideo();
        } else {
          youtubePlayerRef.current.playVideo();
        }
      }
    };

    const toggleMute = () => {
      if (type === 'file' && videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      } else if (type === 'youtube' && youtubePlayerRef.current) {
        if (isMuted) {
          youtubePlayerRef.current.unMute();
        } else {
          youtubePlayerRef.current.mute();
        }
        setIsMuted(!isMuted);
      }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      
      if (type === 'file' && videoRef.current) {
        videoRef.current.volume = newVolume;
      } else if (type === 'youtube' && youtubePlayerRef.current) {
        youtubePlayerRef.current.setVolume(newVolume * 100);
      }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTime = parseFloat(e.target.value);
      
      if (type === 'file' && videoRef.current) {
        videoRef.current.currentTime = newTime;
      } else if (type === 'youtube' && youtubePlayerRef.current) {
        youtubePlayerRef.current.seekTo(newTime, true);
      }
      
      setCurrentTime(newTime);
    };

    const toggleFullscreen = () => {
      if (containerRef.current) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          containerRef.current.requestFullscreen();
        }
      }
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
      <div ref={containerRef} className={cn('bg-black rounded-lg overflow-hidden shadow-xl', className)}>
        {/* Video Container */}
        <div className="relative aspect-video bg-black">
          {type === 'file' ? (
            <video
              ref={videoRef}
              src={src}
              className="w-full h-full"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => {
                setIsPlaying(true);
                onPlay?.();
              }}
              onPause={() => {
                setIsPlaying(false);
                onPause?.();
              }}
            />
          ) : (
            <div id="youtube-player" className="w-full h-full" />
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-900 px-4 py-3 space-y-2">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-white text-xs font-mono min-w-[45px]">
              {formatTimestamp(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #374151 ${progress}%, #374151 100%)`
              }}
            />
            <span className="text-white text-xs font-mono min-w-[45px]">
              {formatTimestamp(duration)}
            </span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlayPause}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                    [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 
                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
                />
              </div>
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
