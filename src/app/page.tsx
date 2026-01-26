'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: { url: string; file: File }[];
}

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).filter(file => file.type.startsWith('image/'));
    setImages(prev => [...prev, ...newImages].slice(0, 10));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() && images.length === 0) return;

    const imageUrls = images.map(file => ({ url: URL.createObjectURL(file), file }));

    const userMessage: Message = {
      role: 'user',
      content: input,
      images: imageUrls.length > 0 ? imageUrls : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentImages = [...images];
    setImages([]);
    setIsLoading(true);

    try {
      const imageData = await Promise.all(
        currentImages.map(async (file) => {
          const bytes = await file.arrayBuffer();
          const base64 = Buffer.from(bytes).toString('base64');
          return {
            data: base64,
            mediaType: file.type || 'image/png'
          };
        })
      );

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Log request details and check payload size
      const totalImageSize = imageData.reduce((sum, img) => sum + img.data.length, 0);
      const totalPayloadSizeMB = totalImageSize / (1024 * 1024);

      console.log('Sending request with:', {
        imageCount: imageData.length,
        historyLength: conversationHistory.length,
        messageLength: userMessage.content?.length || 0,
        totalPayloadSizeMB: totalPayloadSizeMB.toFixed(2)
      });

      // Vercel has a 4.5MB serverless function payload limit
      if (totalPayloadSizeMB > 4) {
        throw new Error(`Total image size (${totalPayloadSizeMB.toFixed(1)}MB) exceeds limit. Please upload fewer or smaller images (max 4MB total).`);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content || 'Please analyze these images.',
          conversationHistory,
          images: imageData
        })
      });

      if (!response.ok) {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || response.statusText || 'Request failed';
          console.error('API Error Response:', errorData);
        } catch (e) {
          errorMessage = response.statusText || `HTTP ${response.status}`;
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
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
      console.error('Full error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      console.error('Error message being displayed:', errorMessage);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `**Error:** ${errorMessage}\n\nPlease try:\n- Using fewer images (1-2 at a time)\n- Ensuring images are under 5MB each\n- Refreshing and trying again`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'var(--forest-mid)', background: 'var(--forest-dark)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--accent)' }}>
            🌹 Rose Glass Dating
          </h1>
          <p className="text-sm mt-1 opacity-80" style={{ color: 'var(--foreground)' }}>
            Translation, Not Judgment
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🌹</div>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--accent)' }}>
                Welcome to Rose Glass Dating
              </h2>
              <p className="opacity-70 max-w-md mx-auto" style={{ color: 'var(--foreground)' }}>
                Drop dating profile screenshots or start a conversation about your dating situation.
                I'll help you see clearly with the Rose Glass translation framework.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className="mb-6">
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'text-white'
                    : ''
                }`} style={{
                  background: msg.role === 'user' ? 'var(--water-mid)' : 'var(--forest-mid)'
                }}>
                  {msg.images && msg.images.length > 0 && (
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {msg.images.map((img, imgIdx) => (
                        <img
                          key={imgIdx}
                          src={img.url}
                          alt={`Upload ${imgIdx + 1}`}
                          className="w-full rounded-lg border"
                          style={{ borderColor: 'var(--forest-light)' }}
                        />
                      ))}
                    </div>
                  )}
                  {msg.content && (
                    <div className={msg.role === 'assistant' ? 'prose prose-invert max-w-none' : ''}>
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--forest-mid)' }}>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t" style={{ borderColor: 'var(--forest-mid)', background: 'var(--forest-dark)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Image Previews */}
          {images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Preview ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                    style={{ borderColor: 'var(--forest-light)' }}
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'var(--water-dark)' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div
            className={`rounded-2xl border-2 transition-all ${isDragging ? 'border-dashed' : ''}`}
            style={{
              borderColor: isDragging ? 'var(--accent)' : 'var(--forest-mid)',
              background: 'var(--forest-mid)'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-end gap-2 p-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                style={{ background: 'var(--forest-light)' }}
                title="Attach images"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isDragging ? "Drop images here..." : "Drop screenshots or type a message..."}
                className="flex-1 bg-transparent resize-none outline-none max-h-32 py-2"
                style={{ color: 'var(--foreground)' }}
                rows={1}
                disabled={isLoading}
              />

              <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && images.length === 0)}
                className="p-2 rounded-lg disabled:opacity-30 hover:opacity-80 transition-opacity"
                style={{ background: 'var(--accent)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </div>

          <p className="text-xs mt-2 text-center opacity-60" style={{ color: 'var(--foreground)' }}>
            Rose Glass translates patterns, it doesn't judge them. Two Hands Principle: Understanding + Expression = Connection
          </p>
        </div>
      </div>
    </div>
  );
}
