'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadZone } from '@/components/UploadZone';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: File[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && images.length === 0) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      images: images.length > 0 ? [...images] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setImages([]);
    setShowUpload(false);
    setIsLoading(true);

    try {
      // Convert images to base64
      const imageData = await Promise.all(
        (userMessage.images || []).map(async (file) => {
          const bytes = await file.arrayBuffer();
          const base64 = Buffer.from(bytes).toString('base64');
          return {
            data: base64,
            mediaType: file.type || 'image/png'
          };
        })
      );

      // Build conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
          images: imageData
        })
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response
        }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Chat failed'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-4xl flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💬 Chat Mode</h1>
          <p className="text-gray-600">
            Have a conversation about your dating situation. Drop in screenshots anytime.
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 bg-white rounded-xl shadow-lg border border-rose-100 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <p className="text-lg mb-2">👋 Start a conversation</p>
                <p className="text-sm">Ask about dating profiles, share screenshots, or discuss your situation.</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-rose-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.images && msg.images.length > 0 && (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {msg.images.map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={URL.createObjectURL(img)}
                          alt={`Uploaded ${imgIdx + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                  {msg.content && (
                    <div className="prose prose-sm max-w-none">
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            {showUpload && (
              <div className="mb-4">
                <UploadZone
                  onImagesSelected={setImages}
                  maxImages={5}
                  label="Attach Screenshots"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowUpload(!showUpload)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  showUpload
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📸 {images.length > 0 ? `${images.length}` : ''}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                disabled={isLoading}
              />

              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && images.length === 0)}
                className="px-6 py-2 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Send
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Remember: Rose Glass is for translation, not judgment. Two Hands Principle applies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
