import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ROSE_GLASS_DATING_SYSTEM_PROMPT } from '@/lib/rose-glass-dating';

// Vercel function config — allow up to 60s for multi-image analysis
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.RoseDatingANthropic_API_KEY,
});

const CHAT_SYSTEM_PROMPT = `${ROSE_GLASS_DATING_SYSTEM_PROMPT}

You are in conversation mode. Keep responses concise and actionable (2-3 paragraphs max).

The user may:
- Ask follow-up questions about a profile analysis
- Upload new screenshots for analysis
- Ask for help crafting messages
- Discuss their dating situation

Two Hands Principle:
Before suggesting any message, ALWAYS ask what the user wants to express first.
- Hand 1: What you perceive (translation)
- Hand 2: What's true for them (expression)

Both hands required for authentic connection.`;

// CORS headers for Chrome extension access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.RoseDatingANthropic_API_KEY) {
      console.error('API key not found in environment variables');
      return Response.json({ error: 'API configuration error: Missing API key' }, { status: 500, headers: corsHeaders });
    }

    const body = await request.json();
    const { message, conversationHistory = [], images = [] } = body;

    if (!message && images.length === 0) {
      return Response.json({ error: 'Message or images required' }, { status: 400, headers: corsHeaders });
    }

    // Build content array
    const content: any[] = [];

    // Add images if provided (with size validation)
    for (const img of images) {
      const imageSizeMB = (img.data.length * 0.75) / (1024 * 1024);
      if (imageSizeMB > 5) {
        return Response.json(
          { error: `Image too large (${imageSizeMB.toFixed(1)}MB). Maximum size is 5MB per image.` },
          { status: 400, headers: corsHeaders }
        );
      }

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: img.mediaType || 'image/png',
          data: img.data,
        },
      });
    }

    // Add text message
    const messageText = message || (images.length > 0 ? 'Please analyze these images.' : '');
    if (messageText) {
      content.push({ type: 'text', text: messageText });
    }

    // Filter conversation history
    const validHistory = conversationHistory.filter(
      (msg: { role: string; content: any }) => {
        if (!msg.content) return false;
        if (typeof msg.content === 'string') return msg.content.trim().length > 0;
        return false;
      }
    );

    // Build messages array
    const messages: Anthropic.MessageParam[] = [
      ...validHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content },
    ];

    console.log('API Request:', {
      imageCount: images.length,
      messageLength: messageText?.length,
      historyLength: validHistory.length,
      contentBlocks: content.length
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: CHAT_SYSTEM_PROMPT,
      messages,
    });

    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    return Response.json({
      response: responseText,
      metrics: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Chat error:', error);

    let errorMessage = 'Chat failed';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
    }

    return Response.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}
