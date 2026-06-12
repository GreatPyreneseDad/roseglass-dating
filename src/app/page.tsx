'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: { url: string; file: File }[];
}

export default function HomePage() {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hey. What are you looking at? Paste a message from someone, drop a dating profile screenshot, or just tell me what's going on. I'll help you see what's actually there — and figure out what you want to say back.",
    },
  ]);
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

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setImages((prev) => [...prev, ...newImages].slice(0, 10));
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Resize images before upload to prevent timeout on multiple screenshots
  const resizeAndBase64 = (file: File, maxDim = 1200): Promise<{ data: string; mediaType: string }> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ data: dataUrl.split(',')[1], mediaType: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && images.length === 0) return;

    if (!showChat) setShowChat(true);

    const userMessage: Message = {
      role: 'user',
      content: text,
      images: images.map((f) => ({ url: URL.createObjectURL(f), file: f })),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setImages([]);
    setIsLoading(true);

    try {
      const imagePayloads = await Promise.all(
        (userMessage.images || []).map((img) => resizeAndBase64(img.file))
      );

      const conversationHistory = messages
        .filter((m) => typeof m.content === 'string' && m.content.trim())
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory,
          images: imagePayloads,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Request failed');
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Something went wrong on my end. Try again — or paste the text directly if screenshots aren't working.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insertExample = (type: 'bio' | 'msg') => {
    setShowChat(true);
    if (type === 'bio') {
      setInput(
        "Love a good hike but honestly I'm just as happy on the couch with my dog. Moved here two years ago and still discovering new coffee spots. Looking for someone who doesn't take themselves too seriously but takes the things they care about very seriously."
      );
    } else {
      setInput(
        "Hey! I saw you're into hiking too — where's your favorite spot around here? I just discovered this trail last weekend and it completely changed my weekend plans lol"
      );
    }
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2c2420]">
      {/* Hero */}
      {!showChat && (
        <div className="min-h-screen flex flex-col justify-center px-6 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-[10%] w-[500px] h-[500px] bg-[rgba(196,115,110,0.06)] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-[10%] w-[400px] h-[400px] bg-[rgba(122,145,129,0.06)] rounded-full blur-[120px]" />
          </div>

          <div className="max-w-[680px] mx-auto w-full relative z-10">
            <div className="inline-flex items-center gap-2 bg-white border border-[rgba(44,36,32,0.08)] rounded-full px-4 py-1.5 text-[13px] text-[#6b5e54] mb-8 shadow-sm">
              <span className="w-2 h-2 bg-[#7a9181] rounded-full animate-pulse" />
              Translation, not judgment
            </div>

            <h1 className="font-serif text-[clamp(2.2rem,5vw,3.4rem)] font-normal leading-[1.15] tracking-[-0.02em] mb-6">
              See what they&apos;re <em className="text-[#c4736e]">really</em> saying.
              <br />
              Show up as <em className="text-[#c4736e]">yourself.</em>
            </h1>

            <p className="text-[17px] text-[#6b5e54] max-w-[520px] leading-[1.7] mb-10">
              Rose Glass translates dating communication — what someone means beneath
              what they wrote, and what patterns reveal about compatibility. Then it
              helps you respond honestly, not strategically.
            </p>

            <div className="flex gap-3 flex-wrap mb-16">
              <button
                onClick={() => setShowChat(true)}
                className="bg-[#2c2420] text-[#faf8f5] px-7 py-3.5 rounded-full text-[15px] font-medium hover:bg-[#a85a55] transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                Try it — paste a message
              </button>
              <button
                onClick={() => {
                  document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border border-[rgba(44,36,32,0.08)] text-[#6b5e54] px-7 py-3.5 rounded-full text-[15px] font-medium hover:border-[#d4928e] hover:text-[#c4736e] hover:bg-[rgba(196,115,110,0.06)] transition-all"
              >
                How it works
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-[rgba(44,36,32,0.06)] rounded-2xl p-7 hover:border-[rgba(196,115,110,0.2)] hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-[rgba(196,115,110,0.1)] rounded-xl flex items-center justify-center text-lg mb-4">
                  👁
                </div>
                <div className="text-[11px] uppercase tracking-[0.08em] text-[#9b8e82] mb-3">
                  Hand one — see them
                </div>
                <p className="text-[14px] text-[#6b5e54] leading-[1.6]">
                  What are they actually saying? Rose Glass reads consistency, energy, and belonging signals beneath the words.
                </p>
              </div>
              <div className="bg-white border border-[rgba(44,36,32,0.06)] rounded-2xl p-7 hover:border-[rgba(122,145,129,0.3)] hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-[rgba(122,145,129,0.1)] rounded-xl flex items-center justify-center text-lg mb-4">
                  ✍️
                </div>
                <div className="text-[11px] uppercase tracking-[0.08em] text-[#9b8e82] mb-3">
                  Hand two — show you
                </div>
                <p className="text-[14px] text-[#6b5e54] leading-[1.6]">
                  Before suggesting anything, Rose Glass asks what resonates with you. Your response comes from your truth.
                </p>
              </div>
            </div>

            <p className="text-center text-[#c4736e] font-serif italic text-[15px] mt-8">
              The space between the hands is yours
            </p>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[#9b8e82] text-[12px] tracking-[0.05em] animate-bounce">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      {showChat && (
        <div className="h-screen flex flex-col">
          <header className="border-b border-[rgba(44,36,32,0.06)] bg-white/80 backdrop-blur-md px-6 py-3 flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowChat(false)}
              className="text-[#9b8e82] hover:text-[#2c2420] transition-colors mr-2 text-sm"
            >
              ← Back
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-[#d4928e] to-[#7a9181] rounded-full flex items-center justify-center text-sm">
              🌹
            </div>
            <div>
              <h1 className="text-[14px] font-medium">Rose Glass</h1>
              <span className="text-[11px] text-[#9b8e82]">Translation, not judgment</span>
            </div>
          </header>

          <div
            className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileSelect(e.dataTransfer.files);
            }}
          >
            <div className="max-w-[640px] mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-[14.5px] leading-[1.65] ${
                      msg.role === 'user'
                        ? 'bg-[#2c2420] text-[#faf8f5] rounded-br-sm'
                        : 'bg-[#f5f0ea] text-[#2c2420] rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="text-[10px] text-[#c4736e] font-medium tracking-[0.03em] mb-1.5">
                        Rose Glass
                      </div>
                    )}
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.images.map((img, j) => (
                          <img
                            key={j}
                            src={img.url}
                            alt="uploaded"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="text-[#6b5e54]">{children}</em>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-1.5 px-4 py-3">
                    <span className="w-2 h-2 bg-[#9b8e82] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#9b8e82] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#9b8e82] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {isDragging && (
            <div className="absolute inset-0 bg-[rgba(196,115,110,0.08)] border-2 border-dashed border-[#c4736e] flex items-center justify-center z-50 pointer-events-none rounded-2xl m-4">
              <p className="text-[#c4736e] font-medium text-lg">Drop screenshots here</p>
            </div>
          )}

          <div className="border-t border-[rgba(44,36,32,0.06)] bg-white px-4 py-3 shrink-0">
            <div className="max-w-[640px] mx-auto">
              {images.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt="preview"
                        className="w-14 h-14 object-cover rounded-lg border border-[rgba(44,36,32,0.06)]"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#2c2420] text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste their message, bio, or describe the situation..."
                    rows={1}
                    className="w-full border border-[rgba(44,36,32,0.08)] rounded-xl px-4 py-3 text-[14px] bg-[#faf8f5] resize-none outline-none focus:border-[rgba(196,115,110,0.3)] transition-colors placeholder:text-[#9b8e82]"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[12px] text-[#9b8e82] border border-[rgba(44,36,32,0.06)] rounded-lg px-3 py-1 hover:border-[rgba(196,115,110,0.2)] hover:text-[#c4736e] hover:bg-[rgba(196,115,110,0.04)] transition-all flex items-center gap-1"
                    >
                      📷 Screenshot
                    </button>
                    <button
                      onClick={() => insertExample('bio')}
                      className="text-[12px] text-[#9b8e82] border border-[rgba(44,36,32,0.06)] rounded-lg px-3 py-1 hover:border-[rgba(196,115,110,0.2)] hover:text-[#c4736e] hover:bg-[rgba(196,115,110,0.04)] transition-all flex items-center gap-1"
                    >
                      📋 Sample bio
                    </button>
                    <button
                      onClick={() => insertExample('msg')}
                      className="text-[12px] text-[#9b8e82] border border-[rgba(44,36,32,0.06)] rounded-lg px-3 py-1 hover:border-[rgba(196,115,110,0.2)] hover:text-[#c4736e] hover:bg-[rgba(196,115,110,0.04)] transition-all flex items-center gap-1"
                    >
                      💬 Sample message
                    </button>
                  </div>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={isLoading || (!input.trim() && images.length === 0)}
                  className="w-11 h-11 rounded-full bg-[#2c2420] flex items-center justify-center shrink-0 hover:bg-[#a85a55] transition-all disabled:opacity-40 disabled:hover:bg-[#2c2420]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#faf8f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            <p className="text-center text-[11px] text-[#9b8e82] mt-3">
              Nothing stored. Not training data.{' '}
              <a href="https://roseglass.dev" target="_blank" className="text-[#c4736e] hover:underline">
                Rose Glass
              </a>{' '}
              by ROSE Corp. · Jackson Hole, WY
            </p>
          </div>
        </div>
      )}

      {/* How It Works */}
      {!showChat && (
        <>
          <section id="how" className="px-6 py-20">
            <div className="max-w-[600px] mx-auto">
              <h2 className="font-serif text-[clamp(1.6rem,3vw,2rem)] font-normal mb-2">How it works</h2>
              <p className="text-[#6b5e54] text-[15px] mb-10">No jargon. No command lines. Just conversation.</p>

              <div className="space-y-3">
                {[
                  ['1', 'Share what you\'re looking at', 'Paste a message, a bio, a conversation. Or just describe the situation. Screenshots work too.'],
                  ['2', 'Rose Glass translates', 'You\'ll see what the patterns actually say — where the consistency is, what\'s activated, what\'s filtered. In plain language.'],
                  ['3', 'It asks what\'s true for you', 'What did you notice? What resonates? What matters to you here? Rose Glass won\'t generate a response until it hears from you.'],
                  ['4', 'You respond together', 'Your words, your meaning, calibrated to land the way you intend. Not a script — a translation.'],
                ].map(([num, title, desc]) => (
                  <div
                    key={num}
                    className="bg-white border border-[rgba(44,36,32,0.06)] rounded-xl p-6 flex gap-4 items-start hover:border-[rgba(196,115,110,0.15)] hover:shadow-sm transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#f5f0ea] flex items-center justify-center text-[13px] font-semibold text-[#6b5e54] shrink-0 mt-0.5">
                      {num}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-medium mb-1">{title}</h3>
                      <p className="text-[14px] text-[#6b5e54] leading-[1.6]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Difference */}
          <section className="px-6 py-16">
            <div className="max-w-[600px] mx-auto">
              <div className="bg-[#2c2420] text-[#faf8f5] rounded-2xl p-10 relative overflow-hidden">
                <div className="absolute -top-[40%] -right-[20%] w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(196,115,110,0.15),transparent_70%)]" />
                <h2 className="font-serif text-[clamp(1.4rem,3vw,1.8rem)] font-normal mb-6 leading-[1.3] relative z-10">
                  Every other tool writes your messages for you.
                  <br />
                  We help you write them <em>as</em> you.
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                  <div>
                    <h4 className="text-[12px] text-[rgba(250,248,245,0.45)] uppercase tracking-[0.06em] mb-2">AI &ldquo;rizz&rdquo; tools</h4>
                    <p className="text-[14px] text-[rgba(250,248,245,0.8)] leading-[1.6]">Generate pickup lines. Optimize for reply rates. The person you match with meets a strategy.</p>
                  </div>
                  <div>
                    <h4 className="text-[12px] text-[rgba(250,248,245,0.45)] uppercase tracking-[0.06em] mb-2">Rose Glass</h4>
                    <p className="text-[14px] text-[rgba(250,248,245,0.8)] leading-[1.6]">Translates both sides. Asks what&apos;s true for you. The person you match with meets you — clearly expressed.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* For Platforms (B2B) */}
          <section className="px-6 py-16">
            <div className="max-w-[600px] mx-auto">
              <div className="bg-white border border-[rgba(44,36,32,0.06)] rounded-2xl p-10 text-center">
                <h2 className="font-serif text-[clamp(1.4rem,3vw,1.8rem)] font-normal mb-4">Built to live inside dating apps</h2>
                <p className="text-[15px] text-[#6b5e54] max-w-[440px] mx-auto leading-[1.7] mb-8">
                  Rose Glass is translation infrastructure, not a competing app. It&apos;s designed to be licensed by the platforms where people already are.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    ['6', 'Dimensions'],
                    ['\u221E', 'Cultural lenses'],
                    ['0', 'Data stored'],
                  ].map(([num, label]) => (
                    <div key={label} className="bg-[#faf8f5] rounded-xl p-4">
                      <div className="font-serif text-[26px] text-[#c4736e]">{num}</div>
                      <div className="text-[11px] text-[#9b8e82] uppercase tracking-[0.05em]">{label}</div>
                    </div>
                  ))}
                </div>
                <a
                  href="mailto:office@roseglass.dev?subject=Rose%20Glass%20Licensing"
                  className="inline-block bg-[#2c2420] text-[#faf8f5] px-7 py-3.5 rounded-full text-[15px] font-medium hover:bg-[#a85a55] transition-all"
                >
                  Talk to us about integration
                </a>
              </div>
            </div>
          </section>

          {/* Chrome Extension Tease */}
          <section className="px-6 py-12 pb-20">
            <div className="max-w-[600px] mx-auto">
              <div className="bg-[linear-gradient(135deg,#f5f0ea,#fff)] border border-[rgba(44,36,32,0.06)] rounded-2xl p-8 flex gap-6 items-center flex-col sm:flex-row">
                <div className="w-16 h-16 bg-white border border-[rgba(44,36,32,0.06)] rounded-2xl flex items-center justify-center text-[28px] shrink-0 shadow-sm">
                  🌹
                </div>
                <div className="sm:text-left text-center">
                  <h3 className="font-serif text-[18px] font-normal mb-1.5">Rose Glass for Chrome</h3>
                  <p className="text-[14px] text-[#6b5e54] leading-[1.6] mb-3">
                    Use Rose Glass inside Tinder, Hinge, and Bumble on desktop. Translations right where you&apos;re having conversations.
                  </p>
                  <a
                    href="https://chromewebstore.google.com/detail/rose-glass-dating-translation/adiccnijglhnfohfnekcliokmlcbkldg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#c4736e] hover:bg-[#b3645f] text-white text-[12px] font-medium px-3.5 py-1.5 rounded-full transition-colors"
                  >
                    Add to Chrome
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-[rgba(44,36,32,0.06)] px-6 py-8 text-center">
            <div className="font-serif text-[17px] mb-1.5">Rose Glass</div>
            <p className="text-[13px] text-[#9b8e82]">
              Coherence is constructed, not discovered.
              <br />
              <a href="mailto:office@roseglass.dev" className="text-[#c4736e] hover:underline">
                office@roseglass.dev
              </a>{' '}
              ·{' '}
              <a href="https://roseglass.dev" className="text-[#c4736e] hover:underline">
                roseglass.dev
              </a>
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
