
import React from 'react';
import { Upload, Mic, FileText, Download, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const HowItWorksSection = () => {
  const steps = [
    {
      icon: Upload,
      title: "Upload Your Video",
      description: "Upload a local video file or paste a YouTube link to get started",
      color: "from-indigo-400 to-cyan-400",
      emoji: "📤"
    },
    {
      icon: Mic,
      title: "Audio Extraction",
      description: "Our AI extracts and processes the audio from your video content",
      color: "from-purple-400 to-pink-400",
      emoji: "🎙️"
    },
    {
      icon: FileText,
      title: "AI Summarization",
      description: "Advanced AI analyzes the content and generates a comprehensive summary",
      color: "from-orange-400 to-rose-400",
      emoji: "🤖"
    },
    {
      icon: Download,
      title: "Copy & Download",
      description: "Get your summary instantly - copy to clipboard or download as a text file",
      color: "from-emerald-400 to-teal-400",
      emoji: "✅"
    }
  ];

  return (
    <section id="how-it-works" className="mt-24 py-16 glass-dark rounded-3xl relative overflow-hidden border border-white/30 shadow-xl">
      {/* Decorative Elements - Softer */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-16 fade-in-up">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full border border-white/30 shadow-sm">
              <span className="text-2xl animate-bounce">⚡</span>
              <span className="text-slate-700 text-sm font-semibold">SIMPLE PROCESS</span>
            </div>
          </div>
          <h2 className="text-5xl font-bold text-slate-800 mb-6 gradient-text-animated">
            How It Works
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Transform your videos into text summaries in just four simple steps 🎬
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto px-4">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="glass border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group h-full">
                <CardContent className="p-8 text-center relative">
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg animate-pulse">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className={`p-4 bg-gradient-to-br ${step.color} rounded-2xl w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  
                  {/* Emoji */}
                  <div className="text-4xl mb-4 float-animation" style={{ animationDelay: `${index * 0.2}s` }}>
                    {step.emoji}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:gradient-text-animated transition-all">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
              
              {/* Arrow Between Steps (not on last step) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                  <ArrowRight className="w-6 h-6 text-slate-400 animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
