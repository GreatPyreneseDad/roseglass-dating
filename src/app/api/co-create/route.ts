import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CO_CREATION_SYSTEM_PROMPT } from '@/lib/rose-glass-dating';

const anthropic = new Anthropic({
  apiKey: process.env.RoseDatingANthropic_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysis, reflection, recipientName } = body;

    if (!analysis || !reflection) {
      return Response.json({ error: 'Analysis and reflection required' }, { status: 400 });
    }

    const prompt = `## Rose Glass Analysis of ${recipientName || 'them'}:
${analysis}

## User's Reflection:

**What they noticed:** ${reflection.observation}

**What resonated:** ${reflection.resonance}

**What they want to express:** ${reflection.expression}

**Their intent:** ${reflection.intent}

---

Based on this, help craft an authentic opening message that:
1. Is calibrated to the recipient's communication style (from the analysis)
2. Expresses what's genuinely true for the user (from their reflection)
3. Creates space for real connection

Provide:
1. **Suggested Message** — The actual message they could send
2. **Calibration Notes** — Brief explanation of how it's tuned to the recipient
3. **Alternative Approach** — One other direction they could take`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: CO_CREATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content.find(block => block.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    return Response.json({
      success: true,
      coCreated: responseText,
      metrics: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });

  } catch (error) {
    console.error('Co-creation error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Co-creation failed' },
      { status: 500 }
    );
  }
}
