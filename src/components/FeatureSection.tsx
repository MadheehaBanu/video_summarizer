
import React from 'react';
import { Upload, FileText, Download, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const FeatureSection = () => {
  const features = [
    {
      icon: Upload,
      title: "Multiple Input Methods",
      description: "Upload local video files or paste YouTube links for instant processing",
      gradient: "from-indigo-400 to-cyan-400"
    },
    {
      icon: FileText,
      title: "AI-Powered Summaries",
      description: "Advanced AI technology extracts key points and generates comprehensive summaries",
      gradient: "from-purple-400 to-pink-400"
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Copy to clipboard or download summaries as text files for easy sharing",
      gradient: "from-orange-400 to-amber-400"
    }
  ];

  return (
    <section id="features" className="mt-24 py-16">
      <div className="text-center mb-16 fade-in-up">
        <div className="inline-block mb-4">
          <div className="flex items-center gap-2 glass px-4 py-2 rounded-full border border-white/30 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-slate-700 text-sm font-semibold">POWERFUL FEATURES</span>
          </div>
        </div>
        <h2 className="text-5xl font-bold text-slate-800 mb-6 gradient-text-animated">
          Why Choose VideoSummarizer?
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto text-lg">
          Transform lengthy videos into concise, actionable summaries with our cutting-edge AI technology ✨
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <Card 
            key={index} 
            className="glass border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 card-3d group overflow-hidden relative"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-8 text-center relative z-10">
              <div className={`p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:gradient-text-animated transition-all">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed text-base">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
