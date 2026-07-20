const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  videoTitle: string;
  summary: string;
  transcript: string;
  keyPoints?: Array<{
    text: string;
    timestamp: number;
    importance?: 'high' | 'medium' | 'low';
  }>;
}

export async function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append('video', file);

  const res = await fetch(`${API_URL}/upload-video`, { method: 'POST', body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.message || 'Upload failed');
  return json.data;
}

export async function processYouTubeVideo(youtubeUrl: string) {
  const res = await fetch(`${API_URL}/process-youtube`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ youtubeUrl }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || json.message || 'YouTube processing failed');
  return json.data;
}

export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[],
  context: ChatContext
) {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationHistory, context }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Chat request failed');
  return res.json() as Promise<{ message: string; timestamp: string; videoTimestamps?: number[] }>;
}

export async function getSuggestedQuestions(context: ChatContext): Promise<string[]> {
  const res = await fetch(`${API_URL}/suggested-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to get suggestions');
  return res.json();
}
