import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProcessingStep = 'uploading' | 'transcribing' | 'analyzing' | 'summarizing' | 'extracting' | 'complete';

interface ProcessingStepperProps {
  currentStep: ProcessingStep;
}

interface Step {
  id: ProcessingStep;
  label: string;
  description: string;
}

const steps: Step[] = [
  {
    id: 'uploading',
    label: 'Uploading',
    description: 'Preparing your video'
  },
  {
    id: 'transcribing',
    label: 'Transcribing',
    description: 'Converting speech to text'
  },
  {
    id: 'analyzing',
    label: 'Analyzing',
    description: 'Processing content'
  },
  {
    id: 'summarizing',
    label: 'Summarizing',
    description: 'Generating insights'
  },
  {
    id: 'extracting',
    label: 'Extracting',
    description: 'Finding key points'
  },
  {
    id: 'complete',
    label: 'Complete',
    description: 'Ready to view'
  }
];

export const ProcessingStepper: React.FC<ProcessingStepperProps> = ({ currentStep }) => {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const currentIndex = getCurrentStepIndex();

  const isStepComplete = (stepIndex: number) => {
    return stepIndex < currentIndex;
  };

  const isStepCurrent = (stepIndex: number) => {
    return stepIndex === currentIndex;
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-in-out"
            style={{
              width: `${(currentIndex / (steps.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const complete = isStepComplete(index);
            const current = isStepCurrent(index);
            const upcoming = index > currentIndex;

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10',
                    complete && 'bg-gradient-to-r from-blue-500 to-purple-500 border-transparent',
                    current && 'bg-white border-blue-500 shadow-lg scale-110',
                    upcoming && 'bg-white border-gray-300'
                  )}
                >
                  {complete ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : current ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <div
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      (complete || current) && 'text-gray-900',
                      upcoming && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </div>
                  <div
                    className={cn(
                      'text-xs mt-0.5 transition-colors',
                      current && 'text-blue-600 font-medium',
                      complete && 'text-gray-600',
                      upcoming && 'text-gray-400'
                    )}
                  >
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Info */}
      {currentStep !== 'complete' && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-sm text-blue-700 font-medium">
              {steps[currentIndex].label}... This may take a few moments
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
