import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TimestampChip, formatTimestamp } from '@/components/TimestampChip';
import { Lightbulb, TrendingUp, CheckCircle, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyPoint {
  text: string;
  timestamp: number;
  importance?: 'high' | 'medium' | 'low';
}

interface SummaryTabProps {
  summary: string;
  keyPoints: KeyPoint[];
  onSeekToTimestamp: (seconds: number) => void;
}

const getImportanceIcon = (importance?: string) => {
  switch (importance) {
    case 'high':
      return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
    case 'medium':
      return <Sparkles className="w-4 h-4 text-blue-500" />;
    case 'low':
      return <Lightbulb className="w-4 h-4 text-gray-500" />;
    default:
      return <Lightbulb className="w-4 h-4 text-blue-500" />;
  }
};

const getImportanceBadge = (importance?: string) => {
  switch (importance) {
    case 'high':
      return (
        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
          Key Insight
        </Badge>
      );
    case 'medium':
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
          Important
        </Badge>
      );
    case 'low':
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Supporting
        </Badge>
      );
    default:
      return null;
  }
};

interface KeyPoint {
  text: string;
  timestamp: number;
}

interface SummaryTabProps {
  summary: string;
  keyPoints: KeyPoint[];
  onSeekToTimestamp: (seconds: number) => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  summary,
  keyPoints,
  onSeekToTimestamp
}) => {
  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Overview
        </h2>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      </div>

      {/* Key Points Section */}
      {keyPoints.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Key Points
          </h2>
          <div className="space-y-3">
            {keyPoints.map((point, index) => (
              <Card key={index} className={cn(
                "hover:shadow-md transition-shadow border-l-4",
                point.importance === 'high' && "border-l-yellow-500 bg-yellow-50/50",
                point.importance === 'medium' && "border-l-blue-500 bg-blue-50/50",
                point.importance === 'low' && "border-l-gray-400",
                !point.importance && "border-l-blue-500"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      {getImportanceIcon(point.importance)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-gray-800 leading-relaxed flex-1">{point.text}</p>
                        {getImportanceBadge(point.importance)}
                      </div>
                      <TimestampChip
                        timestamp={formatTimestamp(point.timestamp)}
                        onClick={() => onSeekToTimestamp(point.timestamp)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Pro Tip</h3>
              <p className="text-sm text-gray-600">
                Click on any timestamp to jump directly to that moment in the video. Use the Chat tab to ask specific questions about the content.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
