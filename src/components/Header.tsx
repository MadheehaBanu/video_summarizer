
import React from 'react';
import { FileText, Sparkles } from 'lucide-react';

export const Header = () => {
  return (
    <header className="glass sticky top-0 z-50 border-b border-white/30 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 scale-hover">
            <div className="p-2 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-xl shadow-lg relative">
              <FileText className="h-6 w-6 text-white" />
              <Sparkles className="h-3 w-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-2xl font-bold gradient-text">VideoSummarizer</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-slate-700 hover:text-slate-900 transition-all duration-300 font-medium hover:scale-110 inline-block">
              Features
            </a>
            <a href="#how-it-works" className="text-slate-700 hover:text-slate-900 transition-all duration-300 font-medium hover:scale-110 inline-block">
              How it Works
            </a>
            <button className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold group">
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 shimmer"></div>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
