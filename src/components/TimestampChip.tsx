import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimestampChipProps {
  timestamp: string; // Format: "MM:SS" or "HH:MM:SS"
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export const TimestampChip: React.FC<TimestampChipProps> = ({
  timestamp,
  onClick,
  className,
  variant = 'default'
}) => {
  const isClickable = !!onClick;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-mono text-xs transition-all',
        variant === 'default' && 'px-2.5 py-1',
        variant === 'compact' && 'px-2 py-0.5',
        isClickable
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-sm cursor-pointer'
          : 'bg-gray-100 text-gray-600 cursor-default',
        className
      )}
      type="button"
    >
      <Clock className={cn(variant === 'default' ? 'w-3 h-3' : 'w-2.5 h-2.5')} />
      <span className="font-semibold">{timestamp}</span>
    </button>
  );
};

/**
 * Convert seconds to timestamp format (MM:SS or HH:MM:SS)
 */
export const formatTimestamp = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parse timestamp string to seconds
 */
export const parseTimestamp = (timestamp: string): number => {
  const parts = timestamp.split(':').map(Number);
  
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
};
