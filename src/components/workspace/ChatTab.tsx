import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TimestampChip, formatTimestamp } from '@/components/TimestampChip';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendChatMessage, getSuggestedQuestions, ChatMessage, ChatContext } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  videoTimestamps?: number[];
}

interface ChatTabProps {
  videoId: string;
  videoTitle: string;
  videoSummary: string;
  videoTranscript: string;
  keyPoints?: Array<{
    text: string;
    timestamp: number;
    importance?: 'high' | 'medium' | 'low';
  }>;
  onSeekToTimestamp: (seconds: number) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  videoId,
  videoTitle,
  videoSummary,
  videoTranscript,
  keyPoints,
  onSeekToTimestamp
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm here to help you understand "${videoTitle}" better. Ask me anything about the video content, and I can point you to specific moments.`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "What are the main takeaways from this video?",
    "Can you explain the key concepts discussed?",
    "What examples were provided?",
    "Summarize the conclusion"
  ]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load suggested questions on mount
  useEffect(() => {
    const loadSuggestedQuestions = async () => {
      if (questionsLoaded) return;

      try {
        const context: ChatContext = {
          videoTitle,
          summary: videoSummary,
          transcript: videoTranscript,
          keyPoints
        };

        const questions = await getSuggestedQuestions(context);
        setSuggestedQuestions(questions);
        setQuestionsLoaded(true);
      } catch (error) {
        console.error('Failed to load suggested questions:', error);
        // Keep default questions on error
      }
    };

    loadSuggestedQuestions();
  }, [videoTitle, videoSummary, videoTranscript, keyPoints, questionsLoaded]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Prepare conversation history for API
      const conversationHistory: ChatMessage[] = messages
        .filter(m => m.role !== 'assistant' || m.id !== '1') // Exclude initial greeting
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Prepare video context
      const context: ChatContext = {
        videoTitle,
        summary: videoSummary,
        transcript: videoTranscript,
        keyPoints
      };

      // Get AI response from backend
      const response = await sendChatMessage(text, conversationHistory, context);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(response.timestamp),
        videoTimestamps: response.videoTimestamps
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : 'Failed to get response',
        variant: "destructive"
      });

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <Card
              className={cn(
                'max-w-[80%]',
                message.role === 'user'
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white'
              )}
            >
              <CardContent className="p-3">
                <p className={cn(
                  'text-sm leading-relaxed',
                  message.role === 'user' ? 'text-white' : 'text-gray-800'
                )}>
                  {message.content}
                </p>

                {message.videoTimestamps && message.videoTimestamps.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.videoTimestamps.map((timestamp, index) => (
                      <TimestampChip
                        key={index}
                        timestamp={formatTimestamp(timestamp)}
                        onClick={() => onSeekToTimestamp(timestamp)}
                        variant="compact"
                      />
                    ))}
                  </div>
                )}

                {message.timestamp && (
                  <p className={cn(
                    'text-xs mt-2',
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </CardContent>
            </Card>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <Card className="bg-white">
              <CardContent className="p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (show only at start) */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuestion(question)}
                className="text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(inputValue);
            }
          }}
          placeholder="Ask a question about the video..."
          className="flex-1"
          disabled={isTyping}
        />
        <Button
          onClick={() => handleSendMessage(inputValue)}
          disabled={!inputValue.trim() || isTyping}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </Button>
      </div>
    </div>
  );
};
