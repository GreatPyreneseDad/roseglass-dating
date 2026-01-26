import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ROSE_GLASS_DATING_SYSTEM_PROMPT } from '@/lib/rose-glass-dating';

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

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!process.env.RoseDatingANthropic_API_KEY) {
      console.error('API key not found in environment variables');
      return Response.json({ error: 'API configuration error: Missing API key' }, { status: 500 });
    }

    const body = await request.json();
    const { message, conversationHistory = [], images = [] } = body;

    if (!message && images.length === 0) {
      return Response.json({ error: 'Message or images required' }, { status: 400 });
    }

    // Build content array
    const content: any[] = [];

    // Add images if provided (with size validation)
    for (const img of images) {
      // Check image size (base64 is ~4/3 the size of original, so 5MB limit = ~3.75MB base64)
      const imageSizeMB = (img.data.length * 0.75) / (1024 * 1024);
      if (imageSizeMB > 5) {
        return Response.json(
          { error: `Image too large (${imageSizeMB.toFixed(1)}MB). Maximum size is 5MB per image.` },
          { status: 400 }
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

    // Add text message - ensure there's always text when images are present
    const messageText = message || (images.length > 0 ? 'Please analyze these images.' : '');
    if (messageText) {
      content.push({ type: 'text', text: messageText });
    }

    // Filter out any messages with empty content from conversation history
    // Ensure all content is strings (not arrays or objects)
    const validHistory = conversationHistory.filter(
      (msg: { role: string; content: any }) => {
        if (!msg.content) return false;
        if (typeof msg.content === 'string') return msg.content.trim().length > 0;
        // If content is an array or object, convert to string or skip
        return false;
      }
    );

    // Build messages array with proper typing
    const messages: Anthropic.MessageParam[] = [
      ...validHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content },
    ];

    // Log request details for debugging
    console.log('API Request:', {
      imageCount: images.length,
      messageLength: messageText?.length,
      historyLength: validHistory.length,
      contentBlocks: content.length
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000, // Increased for multiple image analysis
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
    });

  } catch (error) {
    console.error('Chat error:', error);

    // Provide detailed error information
    let errorMessage = 'Chat failed';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
    }

    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
