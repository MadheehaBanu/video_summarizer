import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const SummaryTabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Section Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Key Points Section Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="border-l-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
