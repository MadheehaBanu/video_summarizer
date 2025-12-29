
import React from 'react';
import { Upload, FileText, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const FeatureSection = () => {
  const features = [
    {
      icon: Upload,
      title: "Multiple Input Methods",
      description: "Upload local video files or paste YouTube links for instant processing"
    },
    {
      icon: FileText,
      title: "AI-Powered Summaries",
      description: "Advanced AI technology extracts key points and generates comprehensive summaries"
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Copy to clipboard or download summaries as text files for easy sharing"
    }
  ];

  return (
    <section id="features" className="mt-24 py-16">
     
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Why Choose VideoSummarizer?
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Transform lengthy videos into concise, actionable summaries with our cutting-edge AI technology
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <Card key={index} className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <feature.icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

     
    </section>
  );
};
