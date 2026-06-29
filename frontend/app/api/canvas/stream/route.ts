import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_INSTRUCTION = `You are a friendly, creative coding buddy who loves building beautiful web experiences! Think of yourself as a chill senior dev who's genuinely excited to help.

**YOUR PERSONALITY:**
- Be warm, casual, and fun - like chatting with a talented friend
- Use natural language, not robotic lists
- Match the user's energy - if they're casual, be casual back
- Sprinkle in some enthusiasm! You love what you do 😊
- Keep responses conversational, not lecture-y

**🚨 CRITICAL: CONFIRM BEFORE BUILDING 🚨**

**STEP 1 - REPHRASE & CONFIRM (ALWAYS DO THIS FIRST FOR NEW REQUESTS):**
When user gives a new build request, you MUST:
1. Rephrase what you understood in your own words
2. Ask if your understanding is correct
3. Optionally ask 1-2 clarifying questions about style/vibe

Example:
- User: "create a dashboard with stats"
- You: "Got it! So you want a **dashboard** with some **stats cards** - I'm thinking charts, numbers, maybe some activity feeds? 📊

  A few quick questions:
  - Dark theme or light theme?
  - Any specific style - minimal, glassmorphism, or bold colors?

  Let me know and I'll build it! Or just say 'go ahead' and I'll surprise you with something cool! ✨"

**STEP 2 - WAIT FOR CONFIRMATION:**
Only generate code when user confirms with:
- "yes", "yeah", "yep", "go ahead", "build it", "do it", "sounds good", "perfect", "exactly", "correct", "that's right", "start", "let's go", "make it", "create it"

**STEP 3 - BUILD:**
After confirmation, say something brief like "Awesome, building it now! ✨" and then output the code.

**MESSAGE TYPES:**

1. **NEW BUILD REQUESTS (Rephrase & Confirm first):**
   - "create a landing page", "build a dashboard", "make a portfolio"
   - → Rephrase understanding, ask style preference, wait for confirmation

2. **CONFIRMATIONS (Now generate code):**
   - "yes", "go ahead", "build it", "sounds good", "do it", "that's right"
   - → Now generate the full code

3. **MODIFICATIONS TO EXISTING (Can build directly):**
   - "change the background", "add a button", "make it darker"
   - → These are tweaks to existing code, confirm briefly then update

4. **ACKNOWLEDGMENTS (NO code):**
   - "thanks", "ok", "cool", "nice", "love it", "looks good"
   - → Just respond warmly: "Glad you like it! Let me know if you want changes!"

5. **GREETINGS (Chat naturally):**
   - "hello", "hi", "hey"
   - → "Hey! 👋 What would you like to build today?"

**CONVERSATION FLOW EXAMPLES:**

Example 1 - New Request:
- User: "create an analytics dashboard"
- You: "Nice! An **analytics dashboard** - I love building those! 📈

  Quick question: What vibe are you going for?
  - **Dark & sleek** (like Vercel/Linear)
  - **Light & clean** (like Stripe)
  - **Colorful & bold** (gradients, vibrant colors)

  Also, any specific data you want to show? Stats cards, charts, tables?"

- User: "dark theme, with charts and user stats"
- You: "Perfect! Dark theme with charts and user stats - let's go! ✨" [Then output code]

Example 2 - Modification:
- User: "change the header color to blue"
- You: "On it! Updating the header to blue... 🎨" [Then output updated code]

Example 3 - Acknowledgment:
- User: "looks great thanks"
- You: "Awesome, glad you like it! 🙌 Let me know if you want any tweaks!"

**WHEN READY TO CODE (include these CDNs):**
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">

**DESIGN MAGIC:**
- Create STUNNING, modern designs worthy of Awwwards
- Use creative layouts: asymmetric grids, overlapping elements, bold typography
- Smooth GSAP animations: fade-ins, slide-ups, parallax vibes
- Micro-interactions that feel alive: hover effects, button animations
- Modern aesthetics: gradients, glassmorphism, or neo-brutalism
- Typography that pops: mixed weights, large hero text, creative effects

**🚨 CRITICAL CODE OUTPUT RULES 🚨:**
1) ONE valid HTML document with <html>, <head>, <body>
2) When generating code, start IMMEDIATELY with <!DOCTYPE html> - NO text before it!
3) NO conversational text before the code - the preview shows your raw output
4) NO markdown backticks - just pure HTML
5) Always return the FULL updated file when making changes
6) Mobile-responsive with Tailwind breakpoints
7) JavaScript at the bottom of body
8) Semantic HTML and ARIA labels

**WRONG (don't do this):**
"Here's your dashboard! <!DOCTYPE html>..."

**CORRECT (do this):**
<!DOCTYPE html>
<html>...`;

const IMAGE_TO_CODE_INSTRUCTION = `You are a friendly design-to-code wizard! You love recreating beautiful designs pixel-perfectly.

**YOUR VIBE:** Excited, helpful, and detail-oriented. You appreciate good design and love bringing it to life in code!

**REQUIRED CDN LIBRARIES:**
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

**RULES:**
1) Recreate the design pixel-perfect with Tailwind CSS
2) Match colors, spacing, typography exactly
3) Add GSAP animations for polish (fade-ins, hover effects)
4) Make it responsive
5) Output ONE valid HTML document - NO markdown, NO backticks
6) Include hover states and micro-interactions
7) Pay attention to shadows, gradients, and subtle details
8) Complete partial designs maintaining the style`;

const PROVIDER_PRIORITY: ReadonlyArray<'Anthropic' | 'Cerebras' | 'XAI' | 'Gemini' | 'Mistral' | 'OpenAI'> = [
  'Anthropic',
  'Cerebras',
  'XAI',
  'Gemini',
  'Mistral',
  'OpenAI',
];

function getProviderQueue(requested?: string) {
  const base = Array.from(PROVIDER_PRIORITY);
  if (!requested || requested.toLowerCase() === 'auto') {
    return base;
  }

  const normalized = requested.toLowerCase();
  const matched = base.find((name) => name.toLowerCase() === normalized);
  if (!matched) {
    return base;
  }

  return [matched, ...base.filter((name) => name !== matched)];
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const { prompt, provider, modelId, isThinking, currentCode, history, imageAttachments } =
      await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if this is an image-to-code request
    const hasImages = imageAttachments && imageAttachments.length > 0;

    // If images are provided, use OpenAI Vision (GPT-4o) for image-to-code
    if (hasImages) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await streamImageToCode(
              controller,
              encoder,
              prompt,
              imageAttachments,
              currentCode
            );
            controller.close();
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Image-to-code failed';
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
            );
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const providersToTry = getProviderQueue(provider);

    const stream = new ReadableStream({
      async start(controller) {
        const errors: string[] = [];

        for (const candidate of providersToTry) {
          try {
            if (candidate === 'Cerebras') {
              await streamWithCerebras(
                controller,
                encoder,
                prompt,
                modelId,
                currentCode,
                history
              );
            } else if (candidate === 'XAI') {
              await streamWithXAI(
                controller,
                encoder,
                prompt,
                modelId,
                currentCode,
                history
              );
            } else if (candidate === 'Gemini') {
              await streamWithGemini(
                controller,
                encoder,
                prompt,
                modelId,
                isThinking,
                currentCode,
                history
              );
            } else if (candidate === 'Mistral') {
              await streamWithMistral(
                controller,
                encoder,
                prompt,
                modelId,
                currentCode,
                history
              );
            } else if (candidate === 'OpenAI') {
              await streamWithOpenAI(
                controller,
                encoder,
                prompt,
                modelId,
                currentCode,
                history
              );
            } else {
              // Anthropic fallback
              await streamWithAnthropic(
                controller,
                encoder,
                prompt,
                modelId,
                currentCode,
                history
              );
            }

            controller.close();
            return;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            errors.push(`${candidate}: ${message}`);
          }
        }

        const fallbackMessage =
          errors.length > 0
            ? errors.join(' | ')
            : 'No AI providers are configured';

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: fallbackMessage })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream error:', error);
    return new Response(
      JSON.stringify({ error: 'Stream initialization failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// =============================================================================
// CEREBRAS - Fast code generation (primary for Canvas)
// =============================================================================
async function streamWithCerebras(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  prompt: string,
  modelId: string,
  currentCode?: string,
  history?: { role: string; text: string }[]
) {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error('Cerebras API key is not configured');
  }

  try {
    const cerebras = new OpenAI({
      apiKey,
      baseURL: 'https://api.cerebras.ai/v1',
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
    ];

    if (currentCode) {
      messages.push({ role: 'user', content: `Current code:\n${currentCode}` });
    }

    if (history && history.length > 0) {
      history.forEach((msg) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text,
        });
      });
    }

    messages.push({ role: 'user', content: prompt });

    const actualModel = (modelId && modelId !== 'auto') ? modelId : 'llama-3.3-70b';

    const stream = await cerebras.chat.completions.create({
      model: actualModel,
      messages,
      temperature: 0.7,
      max_tokens: 8192,
      stream: true,
    });

    for await (const chunk of stream) {
      const piece = chunk.choices[0]?.delta?.content;
      const text = Array.isArray(piece) ? piece.join('') : piece;
      if (text) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
        );
      }
    }

    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cerebras stream failed';
    throw new Error(message);
  }
}

async function streamWithMistral(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  prompt: string,
  modelId: string,
  currentCode?: string,
  history?: { role: string; text: string }[]
) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('Mistral API key is not configured');
  }

  try {
    const mistral = new OpenAI({
      apiKey,
      baseURL: 'https://api.mistral.ai/v1',
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
    ];

    if (currentCode) {
      messages.push({ role: 'user', content: `Current code:\n${currentCode}` });
    }

    if (history && history.length > 0) {
      history.forEach((msg) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text,
        });
      });
    }

    messages.push({ role: 'user', content: prompt });

    let actualModel = 'codestral-latest';
    if (modelId && modelId !== 'auto') actualModel = modelId;

    const stream = await mistral.chat.completions.create({
      model: actualModel,
      messages,
      temperature: 0.7,
      max_tokens: 16384,
      stream: true,
    });

    for await (const chunk of stream) {
      const piece = chunk.choices[0]?.delta?.content;
      const text = Array.isArray(piece) ? piece.join('') : piece;
      if (text) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
        );
      }
    }

    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Mistral stream failed';
    throw new Error(message);
  }
}

async function streamWithXAI(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  prompt: string,
  modelId: string,
  currentCode?: string,
  history?: { role: string; text: string }[]
) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('xAI API key is not configured');
  }

  try {
    const xai = new OpenAI({
      apiKey,
      baseURL: 'https://api.x.ai/v1',
    });

    // Detect if this is a confirmation message after a build request
    const confirmWords = /^(yes|yeah|yep|go ahead|build it|do it|sure|ok|okay|sounds good|perfect|exactly|correct|that'?s right|start|let'?s go|make it|create it|go for it|lets go|build|create|go)[.!]?\s*$/i;
    const isConfirmation = history && history.length > 0 && confirmWords.test(prompt.trim());

    let messages: OpenAI.Chat.ChatCompletionMessageParam[];

    if (isConfirmation) {
      // CONFIRMATION MODE: Grok gets stuck in conversational mode with the 3-step flow.
      // Instead of following the conversation, extract the original request and send
      // a direct code-generation prompt with a simplified system instruction.
      
      // Extract the original build request from history
      const userMessages = history!.filter(m => m.role === 'user');
      const assistantMessages = history!.filter(m => m.role === 'assistant');
      const originalRequest = userMessages.length > 0 ? userMessages[0].text : '';
      
      // Gather any clarifications from the conversation
      const clarifications: string[] = [];
      for (let i = 1; i < userMessages.length; i++) {
        if (!confirmWords.test(userMessages[i].text.trim())) {
          clarifications.push(userMessages[i].text);
        }
      }
      // Also extract details the assistant mentioned it would build
      const lastAssistantMsg = assistantMessages.length > 0 
        ? assistantMessages[assistantMessages.length - 1].text 
        : '';

      const CODE_ONLY_SYSTEM = `You are an expert web developer. Generate a COMPLETE, BEAUTIFUL, PRODUCTION-READY HTML page.

REQUIRED CDN LIBRARIES (include ALL of these):
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">

OUTPUT RULES:
- Output ONLY the HTML code, nothing else
- Start with <!DOCTYPE html> as the VERY FIRST characters
- NO text before or after the code
- NO markdown backticks
- ONE complete HTML document with <html>, <head>, <body>
- Beautiful modern design with Tailwind CSS
- GSAP animations for polish
- Fully responsive
- Include hover effects and micro-interactions
- JavaScript at the bottom of <body>`;

      const buildPrompt = `Generate a complete HTML page for the following request:

REQUEST: ${originalRequest}
${clarifications.length > 0 ? `\nADDITIONAL DETAILS: ${clarifications.join('. ')}` : ''}
${lastAssistantMsg ? `\nPLANNED FEATURES (from previous discussion): ${lastAssistantMsg}` : ''}
${currentCode ? `\nEXISTING CODE TO UPDATE:\n${currentCode}` : ''}

Start your response with <!DOCTYPE html> immediately. Do not write any text before the code.`;

      messages = [
        { role: 'system', content: CODE_ONLY_SYSTEM },
        { role: 'user', content: buildPrompt },
      ];
    } else {
      // NORMAL MODE: Use the regular system instruction with 3-step flow
      messages = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
      ];

      if (currentCode) {
        messages.push({ role: 'user', content: `Current code:\n${currentCode}` });
      }

      if (history && history.length > 0) {
        history.forEach((msg) => {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.text,
          });
        });
      }

      messages.push({ role: 'user', content: prompt });
    }

    const actualModel = (modelId && modelId !== 'auto') ? modelId : 'grok-3';

    const stream = await xai.chat.completions.create({
      model: actualModel,
      messages,
      temperature: 0.7,
      max_tokens: 16384,
      stream: true,
    });

    for await (const chunk of stream) {
      const piece = chunk.choices[0]?.delta?.content;
      const text = Array.isArray(piece) ? piece.join('') : piece;
      if (text) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
        );
      }
    }

    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'xAI stream failed';
    throw new Error(message);
  }
}

async function streamWithOpenAI(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  prompt: string,
  modelId: string,
  currentCode?: string,
  history?: { role: string; text: string }[]
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    const openai = new OpenAI({ apiKey });
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
    ];

    if (currentCode) {
      messages.push({ role: 'user', content: `Current code:\n${currentCode}` });
    }

    if (history && history.length > 0) {
      history.forEach((msg) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text,
        });
      });
    }

    messages.push({ role: 'user', content: prompt });

    let actualModel = 'gpt-4o';
    if (modelId && modelId !== 'auto') actualModel = modelId;

    const stream = await openai.chat.completions.create({
      model: actualModel,
      messages,
      temperature: 0.7,
      max_tokens: 8192,
      stream: true,
    });

    for await (const chunk of stream) {
      const piece = chunk.choices[0]?.delta?.content;
      const text = Array.isArray(piece) ? piece.join('') : piece;
      if (text) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
        );
      }
    }

    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'OpenAI stream failed';
    throw new Error(message);
  }
}

async function streamWithGemini(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  prompt: string,
  modelId: string,
  isThinking: boolean,
  currentCode?: string,
  history?: { role: string; text: string }[]
) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const contents: { role: string; parts: { text: string }[] }[] = [];

    if (currentCode) {
      contents.push({
        role: 'user',
        parts: [{ text: `Current code:\n${currentCode}` }],
      });
    }

    if (history && history.length > 0) {
      history.forEach((msg) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      });
    }

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    let actualModel = 'gemini-2.0-flash';
    if (modelId && modelId !== 'auto') actualModel = modelId;

    const model = genAI.getGenerativeModel({
      model: actualModel,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: isThinking ? 1 : 0.7,
        maxOutputTokens: 8192,
      },
    });

    const result = await model.generateContentStream({ contents });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
        );
      }
    }

    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Gemini stream failed';
    throw new Error(message);
  }
}

async function streamWithAnthropic(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  prompt: string,
  modelId: string,
  currentCode?: string,
  history?: { role: string; text: string }[]
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key is not configured');
  }

  const anthropic = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = [];

  if (currentCode) {
    messages.push({ role: 'user', content: `Current code:\n${currentCode}` });
    messages.push({
      role: 'assistant',
      content: "I understand. I'll work with this code.",
    });
  }

  if (history && history.length > 0) {
    history.forEach((msg) => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    });
  }

  messages.push({ role: 'user', content: prompt });

  let actualModel = 'claude-sonnet-4-20250514';
  if (modelId && modelId !== 'auto') actualModel = modelId;

  const stream = await anthropic.messages.stream({
    model: actualModel,
    max_tokens: 8192,
    system: SYSTEM_INSTRUCTION,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`
        )
      );
    }
  }

  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
  );
}

// Image-to-Code using GPT-4 Vision
async function streamImageToCode(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  prompt: string,
  imageAttachments: { url: string; type: string; name: string }[],
  currentCode?: string
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    throw new Error('OpenAI API key is required for image-to-code');
  }

  try {
    const openai = new OpenAI({ apiKey });

    // Build the content array with images
    const content: OpenAI.Chat.ChatCompletionContentPart[] = [];

    // Add the text prompt
    let textPrompt = prompt || 'Recreate this design as HTML/CSS code.';
    if (currentCode) {
      textPrompt = `Current code to modify:\n\`\`\`html\n${currentCode}\n\`\`\`\n\n${textPrompt}`;
    }
    content.push({ type: 'text', text: textPrompt });

    // Add images
    for (const img of imageAttachments) {
      if (img.url) {
        content.push({
          type: 'image_url',
          image_url: {
            url: img.url,
            detail: 'high', // Use high detail for better code generation
          },
        });
      }
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: IMAGE_TO_CODE_INSTRUCTION },
      { role: 'user', content },
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.5, // Lower temp for more accurate code
      max_tokens: 8192,
      stream: true,
    });

    for await (const chunk of stream) {
      const piece = chunk.choices[0]?.delta?.content;
      const text = Array.isArray(piece) ? piece.join('') : piece;
      if (text) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
        );
      }
    }

    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Image-to-code failed';
    throw new Error(message);
  }
}