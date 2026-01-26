import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ROSE_GLASS_DATING_SYSTEM_PROMPT } from '@/lib/rose-glass-dating';

const anthropic = new Anthropic({
  apiKey: process.env.RoseDatingANthropic_API_KEY,
});

const CHAT_SYSTEM_PROMPT = `${ROSE_GLASS_DATING_SYSTEM_PROMPT}

You are now in conversation mode. The user may:
- Ask follow-up questions about a profile analysis
- Upload new screenshots for analysis
- Ask for help crafting messages
- Discuss their dating situation generally

Remember the Two Hands Principle:
- Hand 1: What you perceive about others (translation)
- Hand 2: What's true for the user (their expression)

Before suggesting any message to send, ALWAYS ask what the user wants to express.
Understanding without self-expression is surveillance.
Self-expression without understanding is noise.
Connection requires both.`;

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

    // Add images if provided
    for (const img of images) {
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
    if (message) {
      content.push({ type: 'text', text: message });
    }

    // Build messages array
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
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
    return Response.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
