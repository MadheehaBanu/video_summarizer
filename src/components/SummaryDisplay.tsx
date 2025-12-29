
import React, { useState } from 'react';
import { Download, FileText, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { VideoSummary } from '@/pages/Index';

interface SummaryDisplayProps {
  summary: VideoSummary;
}

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary }) => {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      console.log('Attempting to copy summary to clipboard');
      const textToCopy = `Title: ${summary.title}\nDuration: ${summary.duration || 'N/A'}\nProcessing Time: ${summary.processingTime || 'N/A'}\n\nSummary:\n${summary.summary}`;
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback method for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      
      setIsCopied(true);
      console.log('Successfully copied to clipboard');
      toast({
        title: "✅ Copied to clipboard",
        description: "Summary has been copied to your clipboard successfully",
      });
      setTimeout(() => setIsCopied(false), 3000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: "❌ Copy failed", 
        description: "Unable to copy to clipboard. Please try selecting and copying the text manually.",
        variant: "destructive"
      });
    }
  };

  const downloadAsText = () => {
    try {
      console.log('Attempting to download summary as text file');
      const content = `Video Summary\n\nTitle: ${summary.title}\nDuration: ${summary.duration || 'N/A'}\nProcessing Time: ${summary.processingTime || 'N/A'}\n\nSummary:\n${summary.summary}`;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Download initiated successfully');
      toast({
        title: "📁 Download started",
        description: "Your summary file is being downloaded",
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "❌ Download failed",
        description: "Unable to download file. Please copy the text and save it manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl animate-in fade-in-50 slide-in-from-bottom-5">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-800">{summary.title}</CardTitle>
              <div className="flex gap-4 text-sm text-gray-500 mt-1">
                {summary.duration && <span>Duration: {summary.duration}</span>}
                {summary.processingTime && <span>Processed in: {summary.processingTime}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className={`transition-all duration-200 ${
                isCopied 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {isCopied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={downloadAsText}
              className="hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Summary</h3>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line select-text">
              {summary.summary}
            </p>
          </div>
        </div>
        
        {summary.videoUrl && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>Source:</strong> <a href={summary.videoUrl} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                {summary.videoUrl}
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
