import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TimestampChip, formatTimestamp } from '@/components/TimestampChip';
import { cn } from '@/lib/utils';
import { FileText, User } from 'lucide-react';

interface TranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

interface TranscriptTabProps {
  transcript: string;
  transcriptSegments?: TranscriptSegment[];
  currentTime: number;
  onSeekToTimestamp: (seconds: number) => void;
}

export const TranscriptTab: React.FC<TranscriptTabProps> = ({
  transcript,
  transcriptSegments,
  currentTime,
  onSeekToTimestamp
}) => {
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Use provided segments or create fallback segments
  const segments = transcriptSegments && transcriptSegments.length > 0
    ? transcriptSegments
    : createFallbackSegments(transcript);

  // Find currently active segment
  const activeSegmentIndex = segments.findIndex(
    segment => currentTime >= segment.startTime && currentTime < segment.endTime
  );

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeSegmentIndex]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Full Transcript
        </h2>
        <p className="text-sm text-gray-600">
          {segments.length} segments
        </p>
      </div>

      {/* Transcript Segments */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {segments.map((segment, index) => {
          const isActive = index === activeSegmentIndex;

          return (
            <Card
              key={index}
              ref={isActive ? activeSegmentRef : null}
              className={cn(
                'transition-all duration-300 cursor-pointer hover:shadow-md',
                isActive && 'ring-2 ring-blue-500 shadow-lg bg-blue-50'
              )}
              onClick={() => onSeekToTimestamp(segment.startTime)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Timestamp */}
                  <div className="flex-shrink-0">
                    <TimestampChip
                      timestamp={formatTimestamp(segment.startTime)}
                      onClick={(e) => {
                        e?.stopPropagation();
                        onSeekToTimestamp(segment.startTime);
                      }}
                      variant="compact"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    {segment.speaker && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        <span className="font-semibold">{segment.speaker}</span>
                      </div>
                    )}
                    <p
                      className={cn(
                        'text-sm leading-relaxed',
                        isActive ? 'text-gray-900 font-medium' : 'text-gray-700'
                      )}
                    >
                      {segment.text}
                    </p>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-gray-700">
            <strong>Tip:</strong> The currently playing segment is highlighted. Click any timestamp or segment to jump to that point in the video.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Fallback: Create simple segments when backend doesn't provide them
 */
const createFallbackSegments = (transcript: string): TranscriptSegment[] => {
  const words = transcript.split(' ');
  const segments: TranscriptSegment[] = [];
  const wordsPerSegment = 50;
  const secondsPerSegment = 30;

  for (let i = 0; i < words.length; i += wordsPerSegment) {
    const segmentIndex = Math.floor(i / wordsPerSegment);
    const segmentText = words.slice(i, i + wordsPerSegment).join(' ');
    
    if (segmentText.trim().length > 0) {
      segments.push({
        startTime: segmentIndex * secondsPerSegment,
        endTime: (segmentIndex + 1) * secondsPerSegment,
        text: segmentText
      });
    }
  }

  return segments;
};
