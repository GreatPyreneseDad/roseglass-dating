import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ROSE_GLASS_DATING_SYSTEM_PROMPT } from '@/lib/rose-glass-dating';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const profileImages = formData.getAll('profile_images') as File[];
    const conversationImages = formData.getAll('conversation_images') as File[];
    const userContext = formData.get('user_context') as string | null;

    if (profileImages.length === 0) {
      return Response.json({ error: 'At least one profile image required' }, { status: 400 });
    }

    // Convert images to base64
    const imageContents = await Promise.all(
      profileImages.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const mediaType = file.type || 'image/png';
        return {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: mediaType,
            data: base64,
          },
        };
      })
    );

    // Add conversation images if provided
    let conversationContents: any[] = [];
    if (conversationImages.length > 0) {
      conversationContents = [
        { type: 'text', text: '\n---\n**CONVERSATION SCREENSHOTS:**\n' },
        ...(await Promise.all(
          conversationImages.map(async (file) => {
            const bytes = await file.arrayBuffer();
            const base64 = Buffer.from(bytes).toString('base64');
            return {
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: file.type || 'image/png',
                data: base64,
              },
            };
          })
        )),
      ];
    }

    // Build analysis request
    let analysisRequest = `Analyze this dating profile through the Rose Glass framework.

${userContext ? `**User Context:** ${userContext}\n\n` : ''}

Provide:
1. **Dimension Analysis Table** — Ψ, ρ, q, f with readings (0.0-1.0) and translations
2. **Key Translation** — What are they actually filtering for? (2-3 sentences)
3. **The Tell** — The ONE element that reveals the most about them
${conversationImages.length > 0 ? '4. **Conversation Analysis** — Investment level, trajectory, red/green flags\n5. **Pattern Summary** — Overall read with uncertainty acknowledged' : '4. **Pattern Summary** — Overall read with uncertainty acknowledged'}

Remember: Translation, not judgment. Multiple valid interpretations exist.`;

    const content = [
      ...imageContents,
      ...conversationContents,
      { type: 'text' as const, text: analysisRequest },
    ];

    const startTime = Date.now();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: ROSE_GLASS_DATING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    });

    const responseTime = Date.now() - startTime;
    const textContent = response.content.find(block => block.type === 'text');
    const analysisText = textContent?.type === 'text' ? textContent.text : '';

    return Response.json({
      success: true,
      analysis: analysisText,
      metrics: {
        responseTime,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
