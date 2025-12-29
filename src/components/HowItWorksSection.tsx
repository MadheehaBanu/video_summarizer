
import React from 'react';
import { Upload, Mic, FileText, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: Upload,
      title: "1. Upload Your Video",
      description: "Upload a local video file or paste a YouTube link to get started"
    },
    {
      icon: Mic,
      title: "2. Audio Extraction",
      description: "Our AI extracts and processes the audio from your video content"
    },
    {
      icon: FileText,
      title: "3. AI Summarization",
      description: "Advanced AI analyzes the content and generates a comprehensive summary"
    },
    {
      icon: Download,
      title: "4. Copy & Download",
      description: "Get your summary instantly - copy to clipboard or download as a text file"
    }
  ];

  return (
    <section id="how-it-works" className="mt-24 py-16 bg-gray-50 rounded-2xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          How It Works
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Transform your videos into text summaries in just a few simple steps
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {steps.map((step, index) => (
          <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <step.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {step.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      
    </section>
  );
};
