import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, FileVideo, Youtube, Upload } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'library' | 'search' | 'error';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  variant = 'library'
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'library':
        return (
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-2">
              <Video className="w-12 h-12 text-blue-600" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
            <FileVideo className="w-12 h-12 text-gray-600" />
          </div>
        );
      case 'error':
        return (
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center">
            <Video className="w-12 h-12 text-red-600" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full border-0 shadow-xl">
        <CardContent className="p-12 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {description}
          </p>

          {/* Action Button */}
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {actionLabel}
            </Button>
          )}

          {/* Additional Info for Library Variant */}
          {variant === 'library' && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">You can upload:</p>
              <div className="flex justify-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FileVideo className="w-4 h-4 text-blue-600" />
                  <span>Local Videos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Youtube className="w-4 h-4 text-red-600" />
                  <span>YouTube Links</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
