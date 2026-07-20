import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const VideoCardSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden">
      {/* Thumbnail Skeleton */}
      <Skeleton className="aspect-video w-full" />

      {/* Content Skeleton */}
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Footer */}
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
};
