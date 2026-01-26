'use client';

import { useState } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { TWO_HANDS_REFLECTION_PROMPTS, type UserReflection } from '@/lib/rose-glass-dating';
import ReactMarkdown from 'react-markdown';

export default function AnalyzePage() {
  const [profileImages, setProfileImages] = useState<File[]>([]);
  const [conversationImages, setConversationImages] = useState<File[]>([]);
  const [userContext, setUserContext] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [reflection, setReflection] = useState<UserReflection>({
    observation: '',
    resonance: '',
    expression: '',
    intent: ''
  });
  const [coCreated, setCoCreated] = useState('');
  const [isCoCreating, setIsCoCreating] = useState(false);

  const handleAnalyze = async () => {
    if (profileImages.length === 0) {
      alert('Please upload at least one profile screenshot');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis('');
    setShowReflection(false);
    setCoCreated('');

    try {
      const formData = new FormData();
      profileImages.forEach(img => formData.append('profile_images', img));
      conversationImages.forEach(img => formData.append('conversation_images', img));
      if (userContext) {
        formData.append('user_context', userContext);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setShowReflection(true);
    } catch (error) {
      console.error('Analysis error:', error);
      alert(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCoCreate = async () => {
    if (!reflection.observation || !reflection.resonance || !reflection.expression || !reflection.intent) {
      alert('Please complete all reflection fields');
      return;
    }

    setIsCoCreating(true);
    setCoCreated('');

    try {
      const response = await fetch('/api/co-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          reflection,
          recipientName: ''
        }),
      });

      if (!response.ok) {
        throw new Error(`Co-creation failed: ${response.statusText}`);
      }

      const data = await response.json();
      setCoCreated(data.coCreated);
    } catch (error) {
      console.error('Co-creation error:', error);
      alert(error instanceof Error ? error.message : 'Co-creation failed');
    } finally {
      setIsCoCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📸 Profile Analysis</h1>
          <p className="text-gray-600">Upload dating profile screenshots for Rose Glass translation.</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-rose-100">
          <UploadZone
            onImagesSelected={setProfileImages}
            maxImages={10}
            label="Profile Screenshots (Required)"
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-rose-100">
          <UploadZone
            onImagesSelected={setConversationImages}
            maxImages={10}
            label="Conversation Screenshots (Optional)"
          />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-rose-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Context (Optional)
          </label>
          <textarea
            value={userContext}
            onChange={(e) => setUserContext(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            rows={4}
            placeholder="Any context you'd like to provide about your situation, what you're looking for, etc."
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || profileImages.length === 0}
          className="w-full py-4 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition mb-8"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Profile'}
        </button>

        {/* Analysis Results */}
        {analysis && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-rose-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Rose Glass Analysis</h2>
            <div className="prose max-w-none">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Two Hands Reflection */}
        {showReflection && (
          <div className="bg-rose-50 rounded-xl shadow-lg p-6 mb-6 border border-rose-200">
            <h2 className="text-2xl font-semibold text-rose-900 mb-2">Two Hands Reflection</h2>
            <p className="text-sm text-rose-700 mb-6">
              Before co-creating a message, reflect on what you noticed and what you want to express.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {TWO_HANDS_REFLECTION_PROMPTS.observation}
                </label>
                <textarea
                  value={reflection.observation}
                  onChange={(e) => setReflection({ ...reflection, observation: e.target.value })}
                  className="w-full p-3 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., 'Their photos show a lot of outdoor activities, but their prompts are all about Netflix...'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {TWO_HANDS_REFLECTION_PROMPTS.resonance}
                </label>
                <textarea
                  value={reflection.resonance}
                  onChange={(e) => setReflection({ ...reflection, resonance: e.target.value })}
                  className="w-full p-3 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., 'I also struggle with the gap between my adventurous side and my homebody side...'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {TWO_HANDS_REFLECTION_PROMPTS.expression}
                </label>
                <textarea
                  value={reflection.expression}
                  onChange={(e) => setReflection({ ...reflection, expression: e.target.value })}
                  className="w-full p-3 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., 'I love hiking but also value quiet evenings. I'm looking for someone who gets that balance...'"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {TWO_HANDS_REFLECTION_PROMPTS.intent}
                </label>
                <textarea
                  value={reflection.intent}
                  onChange={(e) => setReflection({ ...reflection, intent: e.target.value })}
                  className="w-full p-3 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., 'I want to connect authentically and see if we have compatible energy...'"
                />
              </div>
            </div>

            <button
              onClick={handleCoCreate}
              disabled={isCoCreating}
              className="mt-6 w-full py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {isCoCreating ? 'Co-Creating...' : 'Co-Create Message'}
            </button>
          </div>
        )}

        {/* Co-Created Message */}
        {coCreated && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Co-Created Message</h2>
            <div className="prose max-w-none">
              <ReactMarkdown>{coCreated}</ReactMarkdown>
            </div>
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  const messageMatch = coCreated.match(/\*\*Suggested Message\*\*[:\s]*\n+([\s\S]*?)(?=\n\n|$)/);
                  const message = messageMatch ? messageMatch[1].trim() : coCreated;
                  navigator.clipboard.writeText(message);
                  alert('Message copied to clipboard!');
                }}
                className="flex-1 py-2 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition"
              >
                📋 Copy Message
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                🔄 Start New Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
