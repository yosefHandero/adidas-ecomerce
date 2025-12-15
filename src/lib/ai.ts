import { UserItem, OutfitPreferences, OutfitResponse } from './types';

// Centralized constants
export const AI_MODELS = {
  OPENAI: 'gpt-4o-mini',
  ANTHROPIC: 'claude-3-5-sonnet-20241022',
  GROQ: 'llama-3.1-70b-versatile',
  GOOGLE: 'gemini-pro',
} as const;

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GROQ: 'groq',
  GOOGLE: 'google',
} as const;

export const DEFAULT_AI_PROVIDER = AI_PROVIDERS.GOOGLE;

export const AI_TEMPERATURE = 0.7;
export const AI_MAX_TOKENS = 4096;

// Environment variables are accessed at runtime in API routes
const getAIConfig = () => ({
  provider: (process.env.AI_PROVIDER || DEFAULT_AI_PROVIDER) as keyof typeof AI_PROVIDERS,
  openaiKey: process.env.OPENAI_API_KEY,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  groqKey: process.env.GROQ_API_KEY,
  googleKey: process.env.GOOGLE_API_KEY,
});

interface AIResponse {
  variations: Array<{
    name: 'Minimal' | 'Street' | 'Elevated';
    items: Array<{
      item_type: string;
      description: string;
      color: string;
      material?: string;
      style_tags: string[];
      why_it_matches: string;
      shopping_search_terms: string;
      body_zone: 'head' | 'torso' | 'legs' | 'feet' | 'accessories';
    }>;
    color_palette: string[];
    styling_notes: {
      do: string[];
      dont: string[];
    };
  }>;
}

function buildPrompt(userItems: UserItem[], preferences: OutfitPreferences): string {
  const itemsText = userItems
    .map((item, i) => `${i + 1}. ${item.description}${item.imageUrl ? ' (image provided)' : ''}`)
    .join('\n');

  return `You are an expert fashion stylist. A user wants outfit recommendations based on items they own or want to style.

USER'S ITEMS (these are LOCKED - must be included in all outfits):
${itemsText}

PREFERENCES:
- Occasion: ${preferences.occasion}
- Vibe: ${preferences.vibe}/100 (0 = Minimal, 100 = Bold)
- Fit: ${preferences.fit}
- Weather: ${preferences.weather}
- Budget: ${preferences.budget}

TASK:
Generate 3 complete outfit variations that:
1. Include ALL user items as anchor pieces
2. Complete the outfit with complementary pieces
3. Match the occasion, vibe, fit, weather, and budget
4. Provide detailed styling guidance

Return a JSON object with this exact structure:
{
  "variations": [
    {
      "name": "Minimal",
      "items": [
        {
          "item_type": "shirt",
          "description": "Crisp white button-down shirt",
          "color": "white",
          "material": "cotton",
          "style_tags": ["classic", "tailored", "versatile"],
          "why_it_matches": "Complements the user's items by...",
          "shopping_search_terms": "white button down shirt men",
          "body_zone": "torso"
        }
      ],
      "color_palette": ["#FFFFFF", "#000000", "#808080"],
      "styling_notes": {
        "do": ["Tuck in the shirt", "Add a belt"],
        "dont": ["Wear with athletic shoes", "Over-accessorize"]
      }
    },
    {
      "name": "Street",
      "items": [...]
    },
    {
      "name": "Elevated",
      "items": [...]
    }
  ]
}

IMPORTANT:
- Each variation must include ALL user items
- Add 3-7 additional items to complete each outfit
- Use body_zone: "head", "torso", "legs", "feet", or "accessories"
- Be specific with colors (hex codes for palette)
- Provide actionable styling advice
- Make shopping_search_terms practical and searchable
- Ensure all 3 variations are distinct in style`;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<AIResponse> {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_MODELS.OPENAI,
      messages: [
        {
          role: 'system',
          content: 'You are a fashion styling assistant. Always return valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: AI_TEMPERATURE,
    }),
  });

  if (!response.ok) {
    let errorMessage = `OpenAI API error (${response.status})`;
    let errorCode: string | undefined;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.error?.code || errorMessage;
      errorCode = errorData.error?.code;
    } catch {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    
    // Check for quota/billing errors
    if (errorCode === 'insufficient_quota' || errorMessage.includes('quota') || errorMessage.includes('billing')) {
      const quotaError = new Error(`OpenAI API quota exceeded: ${errorMessage}`) as Error & { isQuotaError: boolean };
      quotaError.isQuotaError = true;
      throw quotaError;
    }
    
    throw new Error(`OpenAI API error: ${errorMessage}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI - empty content');
  }

  try {
    return JSON.parse(content);
  } catch {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Invalid JSON response from OpenAI');
  }
}

async function callAnthropic(prompt: string, apiKey: string): Promise<AIResponse> {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODELS.ANTHROPIC,
      max_tokens: AI_MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text;
  if (!content) {
    throw new Error('No response from Anthropic');
  }

  // Extract JSON from markdown code blocks if present
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
  const jsonText = jsonMatch ? jsonMatch[1] : content;

  return JSON.parse(jsonText);
}

async function callGroq(prompt: string, apiKey: string): Promise<AIResponse> {
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_MODELS.GROQ,
      messages: [
        {
          role: 'system',
          content: 'You are a fashion styling assistant. Always return valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: AI_TEMPERATURE,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Groq');
  }

  return JSON.parse(content);
}

async function callGoogle(prompt: string, apiKey: string): Promise<AIResponse> {
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are a fashion styling assistant. Always return valid JSON.\n\n${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: AI_TEMPERATURE,
      },
    }),
  });

  if (!response.ok) {
    let errorMessage = `Google API error (${response.status})`;
    let errorCode: string | undefined;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.error?.code || errorMessage;
      errorCode = errorData.error?.code;
    } catch {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    
    // Check for quota/billing errors
    if (errorCode === 'RESOURCE_EXHAUSTED' || errorMessage.includes('quota') || errorMessage.includes('billing')) {
      const quotaError = new Error(`Google API quota exceeded: ${errorMessage}`) as Error & { isQuotaError: boolean };
      quotaError.isQuotaError = true;
      throw quotaError;
    }
    
    throw new Error(`Google API error: ${errorMessage}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('No response from Google - empty content');
  }

  // Extract JSON from markdown code blocks if present (Google sometimes wraps JSON in code blocks)
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
  const jsonText = jsonMatch ? jsonMatch[1] : content;

  try {
    return JSON.parse(jsonText);
  } catch {
    console.error('Failed to parse Google response:', jsonText);
    throw new Error('Invalid JSON response from Google');
  }
}

export async function generateOutfit(
  userItems: UserItem[],
  preferences: OutfitPreferences
): Promise<OutfitResponse> {
  if (userItems.length === 0) {
    throw new Error('At least one item is required');
  }

  const prompt = buildPrompt(userItems, preferences);
  const config = getAIConfig();

  try {
    let result: AIResponse;
    let lastError: Error | null = null;
    
    // Build list of available providers with their call functions
    // Always include all available providers for automatic fallback on quota errors
    const providers: Array<{ name: string; key: string | undefined; call: (p: string, k: string) => Promise<AIResponse> }> = [];
    
    const providerName = String(config.provider);
    
    // Add primary provider first (if specified)
    if (providerName === 'google' && config.googleKey) {
      providers.push({ name: 'google', key: config.googleKey, call: callGoogle });
    } else if (providerName === 'openai' && config.openaiKey) {
      providers.push({ name: 'openai', key: config.openaiKey, call: callOpenAI });
    } else if (providerName === 'anthropic' && config.anthropicKey) {
      providers.push({ name: 'anthropic', key: config.anthropicKey, call: callAnthropic });
    } else if (providerName === 'groq' && config.groqKey) {
      providers.push({ name: 'groq', key: config.groqKey, call: callGroq });
    }
    
    // Add all other available providers as fallbacks (in priority order)
    if (config.googleKey && !providers.find(p => p.name === 'google')) {
      providers.push({ name: 'google', key: config.googleKey, call: callGoogle });
    }
    if (config.openaiKey && !providers.find(p => p.name === 'openai')) {
      providers.push({ name: 'openai', key: config.openaiKey, call: callOpenAI });
    }
    if (config.anthropicKey && !providers.find(p => p.name === 'anthropic')) {
      providers.push({ name: 'anthropic', key: config.anthropicKey, call: callAnthropic });
    }
    if (config.groqKey && !providers.find(p => p.name === 'groq')) {
      providers.push({ name: 'groq', key: config.groqKey, call: callGroq });
    }
    
    if (providers.length === 0) {
      throw new Error('No AI API key configured. Set GOOGLE_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY');
    }
    
    // Try each provider, with automatic fallback on quota errors
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      
      try {
        result = await provider.call(prompt, provider.key!);
        break; // Success, exit loop
      } catch (error: unknown) {
        const err = error as Error & { isQuotaError?: boolean };
        lastError = err;
        // If it's a quota error and we have more providers to try, continue to next
        if (err.isQuotaError && i < providers.length - 1) {
          console.warn(`${provider.name} quota exceeded, trying next provider...`);
          continue;
        }
        // For other errors or if this is the last provider, throw
        throw error;
      }
    }
    
    if (!result!) {
      throw lastError || new Error('Failed to generate outfit with any available provider');
    }

    // Validate and transform response
    if (!result.variations || result.variations.length !== 3) {
      throw new Error('Invalid response format: expected 3 variations');
    }

    return result as OutfitResponse;
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

