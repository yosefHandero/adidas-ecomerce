import { UserItem, OutfitPreferences, OutfitResponse } from './types';
import { z } from 'zod';

// Response schema validation
const ItemSchema = z.object({
  item_type: z.string(),
  description: z.string(),
  color: z.string(),
  material: z.string().optional(),
  style_tags: z.array(z.string()),
  why_it_matches: z.string(),
  body_zone: z.enum(['head', 'torso', 'legs', 'feet', 'accessories']),
});

const VariationSchema = z.object({
  name: z.enum(['Minimal', 'Street', 'Elevated']),
  suggestion: z.string(),
  items: z.array(ItemSchema),
  color_palette: z.array(z.string()),
  styling_tips: z.array(z.string()),
});

const AIResponseSchema = z.object({
  variations: z.array(VariationSchema).min(3).max(3),
});

interface AIResponse {
  variations: Array<{
    name: 'Minimal' | 'Street' | 'Elevated';
    suggestion: string;
    items: Array<{
      item_type: string;
      description: string;
      color: string;
      material?: string;
      style_tags: string[];
      why_it_matches: string;
      body_zone: 'head' | 'torso' | 'legs' | 'feet' | 'accessories';
    }>;
    color_palette: string[];
    styling_tips: string[];
  }>;
}

const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds for Hugging Face
const HF_MODEL = 'meta-llama/Llama-3.2-3B-Instruct'; // Router-compatible model, good at following instructions and JSON

// Simple sleep function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function extractJsonText(content: string): string {
  // Try to extract JSON from markdown code blocks first
  const jsonMatch =
    content.match(/```json\n([\s\S]*?)\n```/) ||
    content.match(/```\n([\s\S]*?)\n```/) ||
    content.match(/```([\s\S]*?)```/);
  
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  
  // Try to find JSON object in the text - use a more robust regex
  // Match from first { to last } (greedy match)
  const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    let jsonText = jsonObjectMatch[0];
    
    // Try to fix incomplete JSON by closing arrays/objects if needed
    const openBraces = (jsonText.match(/\{/g) || []).length;
    const closeBraces = (jsonText.match(/\}/g) || []).length;
    const openBrackets = (jsonText.match(/\[/g) || []).length;
    const closeBrackets = (jsonText.match(/\]/g) || []).length;
    
    // Close missing brackets
    if (openBrackets > closeBrackets) {
      jsonText += ']'.repeat(openBrackets - closeBrackets);
    }
    
    // Close missing braces
    if (openBraces > closeBraces) {
      jsonText += '}'.repeat(openBraces - closeBraces);
    }
    
    return jsonText;
  }
  
  return content.trim();
}

function buildPrompt(userItems: UserItem[], preferences: OutfitPreferences): string {
  const itemsText = userItems.map((item, i) => `${i + 1}. ${item.description}`).join('\n');

  return `You are a fashion styling assistant. Generate EXACTLY 3 brief outfit suggestions: Minimal, Street, Elevated.

USER ITEMS (include in all variations):
${itemsText}

PREFERENCES: ${preferences.occasion}, vibe ${preferences.vibe}/100, ${preferences.fit} fit, ${preferences.weather}, ${preferences.budget}

Return ONLY valid JSON in this exact format (no markdown, no explanation, no extra text):
{
  "variations": [
    {
      "name": "Minimal",
      "suggestion": "Brief 2-3 sentence suggestion describing the outfit concept",
      "items": [
        {
          "item_type": "Sneakers",
          "description": "CELINE TRAINER CT-09 LOW LACE-UP SNEAKER IN CALFSKIN AND MESH",
          "color": "White",
          "material": "Calfskin and mesh",
          "style_tags": ["luxury", "sporty"],
          "why_it_matches": "These premium sneakers anchor the minimal aesthetic with clean lines.",
          "body_zone": "feet"
        },
        {
          "item_type": "Shirt",
          "description": "White button-down shirt",
          "color": "White",
          "style_tags": ["classic", "minimal"],
          "why_it_matches": "Creates a clean, timeless foundation.",
          "body_zone": "torso"
        }
      ],
      "color_palette": ["#FFFFFF", "#000000"],
      "styling_tips": ["Keep colors neutral", "Focus on fit and quality"]
    },
    {
      "name": "Street",
      "suggestion": "Brief 2-3 sentence suggestion",
      "items": [...],
      "color_palette": [...],
      "styling_tips": [...]
    },
    {
      "name": "Elevated",
      "suggestion": "Brief 2-3 sentence suggestion",
      "items": [...],
      "color_palette": [...],
      "styling_tips": [...]
    }
  ]
}

CRITICAL RULES:
- Return EXACTLY 3 variations with names: "Minimal", "Street", "Elevated" (exact spelling)
- Include ALL user items in EACH variation
- Add 3-7 complementary items per outfit
- body_zone MUST be exactly one of: "head", "torso", "legs", "feet", "accessories" (lowercase, exact match)
- why_it_matches MUST be a non-empty string (at least 10 characters)
- Each item MUST have: item_type, description, color, style_tags (array), why_it_matches, body_zone
- color_palette must be array of color strings (hex codes or color names)
- styling_tips must be array of strings (2-4 tips)
- Return ONLY the JSON object, no markdown, no commentary, no extra text`;
}

// Normalize and clean the parsed data before validation
function normalizeResponseData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  
  const dataObj = data as Record<string, unknown>;
  
  if (dataObj.variations && Array.isArray(dataObj.variations)) {
    dataObj.variations = dataObj.variations.map((variation: unknown) => {
      const variationObj = variation as Record<string, unknown>;
      if (variationObj.items && Array.isArray(variationObj.items)) {
        variationObj.items = variationObj.items.map((item: unknown) => {
          const itemObj = item as Record<string, unknown>;
          // Normalize body_zone to lowercase and validate
          if (itemObj.body_zone) {
            const zone = String(itemObj.body_zone).toLowerCase().trim();
            const validZones = ['head', 'torso', 'legs', 'feet', 'accessories'];
            if (validZones.includes(zone)) {
              itemObj.body_zone = zone;
            } else {
              // Try to infer from item_type or description
              const itemType = String(itemObj.item_type || '');
              const itemDesc = String(itemObj.description || '');
              const itemLower = (itemType + ' ' + itemDesc).toLowerCase();
              if (itemLower.includes('shoe') || itemLower.includes('sneaker') || itemLower.includes('boot')) {
                itemObj.body_zone = 'feet';
              } else if (itemLower.includes('shirt') || itemLower.includes('top') || itemLower.includes('jacket')) {
                itemObj.body_zone = 'torso';
              } else if (itemLower.includes('pant') || itemLower.includes('jean') || itemLower.includes('short')) {
                itemObj.body_zone = 'legs';
              } else if (itemLower.includes('hat') || itemLower.includes('cap')) {
                itemObj.body_zone = 'head';
              } else {
                itemObj.body_zone = 'accessories';
              }
            }
          }
          
          // Ensure why_it_matches is a non-empty string
          const whyMatches = itemObj.why_it_matches;
          if (!whyMatches || typeof whyMatches !== 'string' || whyMatches.trim().length === 0) {
            const variationName = String(variationObj.name || 'outfit');
            itemObj.why_it_matches = `Complements the ${variationName.toLowerCase()} style.`;
          }
          
          // Ensure style_tags is an array
          if (!Array.isArray(itemObj.style_tags)) {
            itemObj.style_tags = [];
          }
          
          return itemObj;
        });
      }
      
      // Ensure styling_tips is an array
      if (!Array.isArray(variationObj.styling_tips)) {
        variationObj.styling_tips = [];
      }
      
      // Ensure color_palette is an array
      if (!Array.isArray(variationObj.color_palette)) {
        variationObj.color_palette = [];
      }
      
      return variationObj;
    });
  }
  
  return dataObj;
}

async function parseAndValidateAIResponse(raw: string): Promise<AIResponse> {
  const jsonText = extractJsonText(raw);
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown JSON parse error';
    // Log more of the response for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[AI] JSON parse error. Response length:', raw.length);
      console.log('[AI] Extracted JSON length:', jsonText.length);
      console.log('[AI] Last 500 chars of extracted JSON:', jsonText.substring(Math.max(0, jsonText.length - 500)));
    }
    throw new Error(`Invalid AI response format: Failed to parse JSON - ${errorMessage}. Raw response: ${raw.substring(0, 500)}`);
  }
  
  // Normalize the data before validation
  const normalized = normalizeResponseData(parsed);
  
  const validated = AIResponseSchema.safeParse(normalized);
  if (!validated.success) {
    const validationErrors = validated.error.issues.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    ).join('; ');
    
    // Log validation errors in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AI] Validation errors:', validationErrors);
      console.log('[AI] Parsed data sample:', JSON.stringify(normalized, null, 2).substring(0, 1000));
    }
    
    throw new Error(`Invalid AI response format: Validation failed - ${validationErrors}`);
  }
  
  return validated.data as AIResponse;
}

async function callHuggingFace(prompt: string, apiKey: string): Promise<AIResponse> {
  if (!apiKey) throw new Error('HUGGING_FACE_API_KEY not configured');

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), DEFAULT_TIMEOUT_MS);
      });

      const fetchPromise = fetch(
        'https://router.huggingface.co/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: HF_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are a fashion styling assistant. Always return valid JSON only, no markdown, no explanation.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 4096,
            temperature: 0.7,
          }),
        }
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      // Handle rate limiting (429)
      if (response.status === 429) {
        const waitTime = 2000 * (retries + 1); // 2s, 4s, 6s
        console.log(`[AI] Hugging Face rate limited, waiting ${waitTime}ms before retry ${retries + 1}/${maxRetries}`);
        await sleep(waitTime);
        retries++;
        continue;
      }

      // Handle model loading (503)
      if (response.status === 503) {
        const waitTime = 5000 * (retries + 1); // 5s, 10s, 15s
        console.log(`[AI] Hugging Face model loading, waiting ${waitTime}ms before retry ${retries + 1}/${maxRetries}`);
        await sleep(waitTime);
        retries++;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Hugging Face API error (${response.status}): ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();

      // New router API returns OpenAI-compatible format
      if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
        const generatedText = data.choices[0].message.content;
        // Log the response for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('[AI] Hugging Face response length:', generatedText.length);
          console.log('[AI] Response preview (first 500 chars):', generatedText.substring(0, 500));
        }
        return await parseAndValidateAIResponse(generatedText);
      }

      // Fallback: check for old format (array with generated_text)
      if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
        const generatedText = data[0].generated_text;
        return await parseAndValidateAIResponse(generatedText);
      }

      // Sometimes it returns the text directly
      if (typeof data === 'string') {
        return await parseAndValidateAIResponse(data);
      }

      // Check for error in response
      if (data.error) {
        throw new Error(`Hugging Face error: ${data.error}`);
      }

      throw new Error(`Unexpected Hugging Face response format: ${JSON.stringify(data).substring(0, 200)}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Re-throw parse/validation errors as-is
        if (error.message.includes('Invalid AI response format')) {
          throw error;
        }

        // Check for timeout
        if (error.message.includes('timeout') || error.message === 'Request timeout') {
          if (retries < maxRetries - 1) {
            retries++;
            await sleep(2000 * retries);
            continue;
          }
          throw new Error('Request timeout after retries');
        }

        // Check for rate limit or model loading
        if (error.message.includes('429') || error.message.includes('503')) {
          if (retries < maxRetries - 1) {
            retries++;
            continue;
          }
        }

        throw new Error(`Hugging Face: ${error.message}`);
      }
      throw new Error('Hugging Face: Unknown error occurred');
    }
  }

  throw new Error('Hugging Face: Max retries exceeded');
}

export async function generateOutfit(
  userItems: UserItem[],
  preferences: OutfitPreferences
): Promise<OutfitResponse> {
  // Get API key (support both naming conventions)
  const hfKey = process.env.HUGGING_FACE_API_KEY?.trim() || process.env.HUGGINGFACE_API_KEY?.trim();
  
  if (!hfKey || hfKey.length === 0) {
    throw new Error('HUGGING_FACE_API_KEY not configured. Please set it in your environment variables.');
  }

  // Debug logging in development (never log key prefix for security)
  if (process.env.NODE_ENV === 'development') {
    console.log('[AI] Using Hugging Face model:', HF_MODEL);
    console.log('[AI] Key check:', {
      hasHFKey: !!hfKey,
      hfKeyLength: hfKey.length,
    });
  }
  
  const prompt = buildPrompt(userItems, preferences);

  try {
    const result = await callHuggingFace(prompt, hfKey);
    return {
      variations: result.variations,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[AI] Hugging Face failed:', errorMsg);
    throw error;
  }
}
