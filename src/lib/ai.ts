import {
  BODY_ZONES,
  UserItem,
  OutfitPreferences,
  OutfitResponse,
  VARIATION_NAMES,
} from "./types";
import { z } from "zod";
import { COLOR_WORDS, ITEM_TYPE_WORDS } from "./constants";
import { inferBodyZoneFromItem } from "./zoneUtils";

// Response schema validation
const ItemSchema = z.object({
  item_type: z.string(),
  description: z.string(),
  color: z.string(),
  material: z.string().optional(),
  style_tags: z.array(z.string()),
  why_it_matches: z.string(),
  body_zone: z.enum(BODY_ZONES),
});

const VariationSchema = z.object({
  name: z.enum(VARIATION_NAMES),
  suggestion: z.string(),
  suggestion_man: z.string().optional(),
  suggestion_woman: z.string().optional(),
  items: z.array(ItemSchema),
  color_palette: z.array(z.string()),
  styling_tips: z.array(z.string()),
  styling_tips_man: z.array(z.string()).optional(),
  styling_tips_woman: z.array(z.string()).optional(),
});

const AIResponseSchema = z.object({
  variations: z.array(VariationSchema).min(3).max(3),
});

type AIResponse = z.infer<typeof AIResponseSchema>;

const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds for Hugging Face
const HF_MODEL = "meta-llama/Llama-3.2-3B-Instruct"; // Router-compatible model, good at following instructions and JSON

// Simple sleep function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
      jsonText += "]".repeat(openBrackets - closeBrackets);
    }

    // Close missing braces
    if (openBraces > closeBraces) {
      jsonText += "}".repeat(openBraces - closeBraces);
    }

    return jsonText;
  }

  return content.trim();
}

function buildPrompt(
  userItems: UserItem[],
  preferences: OutfitPreferences
): string {
  // Extract and highlight specific attributes from user items
  const itemsText = userItems
    .map((item, i) => {
      const desc = item.description;
      // Extract color mentions using shared constants
      const colorPattern = new RegExp(`\\b(${COLOR_WORDS.join("|")})\\b`, "gi");
      const colors = desc.match(colorPattern) || [];
      const uniqueColors = [...new Set(colors.map((c) => c.toLowerCase()))];

      return `${i + 1}. ${desc}${
        uniqueColors.length > 0 ? ` [COLORS: ${uniqueColors.join(", ")}]` : ""
      }`;
    })
    .join("\n");

  const budgetLabel =
    preferences.budget === "$"
      ? "Budget-Friendly"
      : preferences.budget === "$$"
        ? "Mid-Range"
        : "Premium";

  return `You are a fashion styling assistant. Generate EXACTLY 3 outfit suggestions: Minimal, Street, Elevated.

  USER ITEMS (MUST be included in ALL variations with EXACT attributes preserved):
  ${itemsText}

  PREFERENCES: occasion ${preferences.occasion}, vibe ${preferences.vibe}/100, FIT: ${preferences.fit}, WEATHER: ${preferences.weather}, BUDGET: ${budgetLabel} (${preferences.budget})

  SUGGESTION and TIPS RULES (fit, weather, budget):
  - Each "suggestion" MUST be 3–5 descriptive sentences (general). Also provide "suggestion_man" and "suggestion_woman": 2–4 sentences each, tailored to men's vs women's styling for this variation (e.g. fit terms, silhouettes, accessories).
  - Each "styling_tips" array MUST have 4–6 descriptive tips (general). Also provide "styling_tips_man" and "styling_tips_woman": 3–5 tips each, tailored to men vs women (fit, layering, accessories, footwear).

  Return ONLY valid JSON in this exact format (no markdown, no explanation, no extra text):
  {
    "variations": [
      {
        "name": "Minimal",
        "suggestion": "3-5 sentences: general outfit concept, fit, weather, budget.",
        "suggestion_man": "2-4 sentences: how this look works for men—fit, pieces, styling.",
        "suggestion_woman": "2-4 sentences: how this look works for women—fit, pieces, styling.",
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
          },
          {
            "item_type": "Pants",
            "description": "Black tailored trousers",
            "color": "Black",
            "style_tags": ["minimal", "clean"],
            "why_it_matches": "Balances the top with a sleek, neutral base.",
            "body_zone": "legs"
          }
        ],
        "color_palette": ["#FFFFFF", "#000000"],
        "styling_tips": ["FIT tip...", "WEATHER tip...", "BUDGET tip...", "extra tip..."],
        "styling_tips_man": ["FIT tip for men...", "WEATHER tip...", "BUDGET tip...", "accessory/footwear tip for men."],
        "styling_tips_woman": ["FIT tip for women...", "WEATHER tip...", "BUDGET tip...", "accessory/footwear tip for women."]
      },
      {
        "name": "Street",
        "suggestion": "3-5 sentences addressing fit, weather, and budget.",
        "suggestion_man": "2-4 sentences for men.",
        "suggestion_woman": "2-4 sentences for women.",
        "items": [...],
        "color_palette": [...],
        "styling_tips": ["FIT tip...", "WEATHER tip...", "BUDGET tip...", "extra tip..."],
        "styling_tips_man": ["...", "...", "..."],
        "styling_tips_woman": ["...", "...", "..."]
      },
      {
        "name": "Elevated",
        "suggestion": "3-5 sentences addressing fit, weather, and budget.",
        "suggestion_man": "2-4 sentences for men.",
        "suggestion_woman": "2-4 sentences for women.",
        "items": [...],
        "color_palette": [...],
        "styling_tips": ["FIT tip...", "WEATHER tip...", "BUDGET tip...", "extra tip..."],
        "styling_tips_man": ["...", "...", "..."],
        "styling_tips_woman": ["...", "...", "..."]
      }
    ]
  }

  CRITICAL RULES - STRICT ATTRIBUTE PRESERVATION:
  - Return EXACTLY 3 variations with names: "Minimal", "Street", "Elevated" (exact spelling)
  - Include ALL user items in EACH variation with EXACT attributes preserved:
    * If user item says "yellow pants", you MUST include "yellow pants" (not "yellow trousers", "beige pants", or "yellow shorts")
    * If user item says "gray jacket", you MUST include "gray jacket" (not "silver jacket", "grey blazer", or "black jacket")
    * If user item says "shoes" (no color), you MUST include "shoes" with NO color specified - do NOT add colors like "yellow shoes", "black shoes", etc.
    * Preserve EXACT colors mentioned: yellow stays yellow, gray stays gray, etc.
    * If NO color is mentioned in user item, do NOT add a color - keep it color-neutral
    * Preserve EXACT item types: pants stay pants, jacket stays jacket, etc.
    * Do NOT substitute, reinterpret, or alter stated attributes
    * Do NOT change colors (e.g., yellow → beige, gray → silver, black → charcoal)
    * Do NOT add colors that weren't in the user's item description
    * Do NOT change item types (e.g., pants → trousers, jacket → blazer, shirt → top)
  - Use AI recommendations ONLY to complete/enhance the rest of the outfit, NOT to alter existing items
  - When adding complementary items, use colors that match the user's items (if colors are specified) or use neutral colors (black, white, gray) if user items have no colors
  - Add 3-7 complementary items per outfit that work WITH the user's items
  - Each variation MUST include items in these REQUIRED body zones (at minimum):
    * torso (tops, shirts, jackets, coats)
    * legs (pants, jeans, skirts, dresses - a dress counts as legs)
    * feet (shoes, sneakers, boots)
    If the user item already covers a zone, that's fine, but the variation must still include all required zones overall.
  - body_zone MUST be exactly one of: "head", "torso", "legs", "feet", "accessories" (lowercase, exact match)
  - why_it_matches MUST be a non-empty string (at least 10 characters)
  - Each item MUST have: item_type, description, color, style_tags (array), why_it_matches, body_zone
  - color_palette must include colors from user items and be array of color strings (hex codes or color names)
  - styling_tips: array of 4–6 descriptive strings; at least one tip must address FIT, one WEATHER, one BUDGET (each 1–2 sentences, specific to the user's ${preferences.fit} / ${preferences.weather} / ${budgetLabel} choices)
  - Return ONLY the JSON object, no markdown, no commentary, no extra text`;
}

// Normalize and clean the parsed data before validation
function normalizeResponseData(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;

  const dataObj = data as Record<string, unknown>;

  if (dataObj.variations && Array.isArray(dataObj.variations)) {
    dataObj.variations = dataObj.variations.map((variation: unknown) => {
      const variationObj = variation as Record<string, unknown>;
      if (variationObj.items && Array.isArray(variationObj.items)) {
        variationObj.items = variationObj.items.map((item: unknown) => {
          const itemObj = item as Record<string, unknown>;
          // Normalize body_zone to lowercase and validate (infer if missing/invalid)
          const validZones = BODY_ZONES as readonly string[];
          const zoneRaw = itemObj.body_zone;
          const zone = zoneRaw ? String(zoneRaw).toLowerCase().trim() : "";
          if (zone && validZones.includes(zone)) {
            itemObj.body_zone = zone;
          } else {
            // Try to infer from item_type or description (canonical logic in zoneUtils)
            const itemType = String(itemObj.item_type || "");
            const itemDesc = String(itemObj.description || "");
            itemObj.body_zone = inferBodyZoneFromItem(itemType, itemDesc);
          }

          // Ensure why_it_matches is a non-empty string
          const whyMatches = itemObj.why_it_matches;
          if (
            !whyMatches ||
            typeof whyMatches !== "string" ||
            whyMatches.trim().length === 0
          ) {
            const variationName = String(variationObj.name || "outfit");
            itemObj.why_it_matches = `Complements the ${variationName.toLowerCase()} style.`;
          }

          // Ensure style_tags is an array
          if (!Array.isArray(itemObj.style_tags)) {
            itemObj.style_tags = [];
          }

          return itemObj;
        });

        // Validate required zones are present (warn-only; prompt enforces this)
        const zonesPresent = new Set(
          (variationObj.items as Array<Record<string, unknown>>)
            .map((it) => String(it.body_zone || "").toLowerCase())
            .filter(Boolean)
        );
        const requiredZones = ["torso", "legs", "feet"];
        const missing = requiredZones.filter((z) => !zonesPresent.has(z));
        if (missing.length > 0 && process.env.NODE_ENV === "development") {
          console.warn(
            `[AI] Variation "${String(
              variationObj.name || "unknown"
            )}" is missing required body zones: ${missing.join(", ")}`
          );
        }
      }

      // Ensure styling_tips is an array
      if (!Array.isArray(variationObj.styling_tips)) {
        variationObj.styling_tips = [];
      }

      // Optional man/woman tips: keep if valid array, otherwise remove
      if (variationObj.styling_tips_man != null && !Array.isArray(variationObj.styling_tips_man)) {
        delete variationObj.styling_tips_man;
      }
      if (variationObj.styling_tips_woman != null && !Array.isArray(variationObj.styling_tips_woman)) {
        delete variationObj.styling_tips_woman;
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown JSON parse error";
    // Log more of the response for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("[AI] JSON parse error. Response length:", raw.length);
      console.log("[AI] Extracted JSON length:", jsonText.length);
      console.log(
        "[AI] Last 500 chars of extracted JSON:",
        jsonText.substring(Math.max(0, jsonText.length - 500))
      );
    }
    throw new Error(
      `Invalid AI response format: Failed to parse JSON - ${errorMessage}. Raw response: ${raw.substring(
        0,
        500
      )}`
    );
  }

  // Normalize the data before validation
  const normalized = normalizeResponseData(parsed);

  const validated = AIResponseSchema.safeParse(normalized);
  if (!validated.success) {
    const validationErrors = validated.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    // Log validation errors in development
    if (process.env.NODE_ENV === "development") {
      console.log("[AI] Validation errors:", validationErrors);
      console.log(
        "[AI] Parsed data sample:",
        JSON.stringify(normalized, null, 2).substring(0, 1000)
      );
    }

    throw new Error(
      `Invalid AI response format: Validation failed - ${validationErrors}`
    );
  }

  return validated.data as AIResponse;
}

async function callHuggingFace(
  prompt: string,
  apiKey: string
): Promise<AIResponse> {
  if (!apiKey) throw new Error("HUGGING_FACE_API_KEY not configured");

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Request timeout")),
          DEFAULT_TIMEOUT_MS
        );
      });

      const fetchPromise = fetch(
        "https://router.huggingface.co/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: HF_MODEL,
            messages: [
              {
                role: "system",
                content:
                  "You are a fashion styling assistant. Always return valid JSON only, no markdown, no explanation.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            max_tokens: 4096,
            temperature: 0.7,
          }),
        }
      );

      const response = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      // Handle rate limiting (429)
      if (response.status === 429) {
        const waitTime = 2000 * (retries + 1); // 2s, 4s, 6s
        console.log(
          `[AI] Hugging Face rate limited, waiting ${waitTime}ms before retry ${
            retries + 1
          }/${maxRetries}`
        );
        await sleep(waitTime);
        retries++;
        continue;
      }

      // Handle model loading (503)
      if (response.status === 503) {
        const waitTime = 5000 * (retries + 1); // 5s, 10s, 15s
        console.log(
          `[AI] Hugging Face model loading, waiting ${waitTime}ms before retry ${
            retries + 1
          }/${maxRetries}`
        );
        await sleep(waitTime);
        retries++;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Hugging Face API error (${response.status}): ${errorText.substring(
            0,
            200
          )}`
        );
      }

      const data = await response.json();

      // New router API returns OpenAI-compatible format
      if (
        data.choices &&
        data.choices.length > 0 &&
        data.choices[0].message?.content
      ) {
        const generatedText = data.choices[0].message.content;
        // Log the response for debugging
        if (process.env.NODE_ENV === "development") {
          console.log(
            "[AI] Hugging Face response length:",
            generatedText.length
          );
          console.log(
            "[AI] Response preview (first 500 chars):",
            generatedText.substring(0, 500)
          );
        }
        return await parseAndValidateAIResponse(generatedText);
      }

      // Fallback: check for old format (array with generated_text)
      if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
        const generatedText = data[0].generated_text;
        return await parseAndValidateAIResponse(generatedText);
      }

      // Sometimes it returns the text directly
      if (typeof data === "string") {
        return await parseAndValidateAIResponse(data);
      }

      // Check for error in response
      if (data.error) {
        throw new Error(`Hugging Face error: ${data.error}`);
      }

      throw new Error(
        `Unexpected Hugging Face response format: ${JSON.stringify(
          data
        ).substring(0, 200)}`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Re-throw parse/validation errors as-is
        if (error.message.includes("Invalid AI response format")) {
          throw error;
        }

        // Check for timeout
        if (
          error.message.includes("timeout") ||
          error.message === "Request timeout"
        ) {
          if (retries < maxRetries - 1) {
            retries++;
            await sleep(2000 * retries);
            continue;
          }
          throw new Error("Request timeout after retries");
        }

        // Check for rate limit or model loading
        if (error.message.includes("429") || error.message.includes("503")) {
          if (retries < maxRetries - 1) {
            retries++;
            continue;
          }
        }

        throw new Error(`Hugging Face: ${error.message}`);
      }
      throw new Error("Hugging Face: Unknown error occurred");
    }
  }

  throw new Error("Hugging Face: Max retries exceeded");
}

async function callGroq(prompt: string, apiKey: string): Promise<AIResponse> {
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Request timeout")),
          DEFAULT_TIMEOUT_MS
        );
      });

      const fetchPromise = fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You are a fashion styling assistant. Always respond with valid JSON only, no markdown, no explanations.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: "json_object" },
          }),
        }
      );

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Groq API error (${response.status}): ${errorText.substring(0, 200)}`
        );
      }

      const data = await response.json();

      if (
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content
      ) {
        const raw = data.choices[0].message.content;
        return await parseAndValidateAIResponse(raw);
      }

      throw new Error(
        `Unexpected Groq response format: ${JSON.stringify(data).substring(
          0,
          200
        )}`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("Invalid AI response format")) {
          throw error;
        }

        if (
          error.message.includes("timeout") ||
          error.message === "Request timeout"
        ) {
          if (retries < maxRetries - 1) {
            retries++;
            await sleep(2000 * retries);
            continue;
          }
          throw new Error("Request timeout after retries");
        }

        if (error.message.includes("429") || error.message.includes("503")) {
          if (retries < maxRetries - 1) {
            retries++;
            continue;
          }
        }

        throw new Error(`Groq: ${error.message}`);
      }
      throw new Error("Groq: Unknown error occurred");
    }
  }

  throw new Error("Groq: Max retries exceeded");
}

/**
 * Validate that user items are included in variations with exact attributes preserved
 */
function validateUserItemsPreserved(
  userItems: UserItem[],
  variations: AIResponse["variations"]
): void {
  // Extract color and item type keywords from user items using shared constants
  const userItemAttributes = userItems.map((item) => {
    const desc = item.description.toLowerCase();
    const colorPattern = new RegExp(`\\b(${COLOR_WORDS.join("|")})\\b`, "gi");
    const itemTypePattern = new RegExp(
      `\\b(${ITEM_TYPE_WORDS.join("|")})\\b`,
      "gi"
    );

    const colors = (desc.match(colorPattern) || []).map((c) => c.toLowerCase());
    const itemTypes = (desc.match(itemTypePattern) || []).map((t) =>
      t.toLowerCase()
    );

    return {
      original: item.description,
      colors: [...new Set(colors)],
      itemTypes: [...new Set(itemTypes)],
      keywords: desc.split(/\s+/).filter((w) => w.length > 3),
    };
  });

  // Check each variation
  for (const variation of variations) {
    for (const userAttr of userItemAttributes) {
      let found = false;

      // Check if any item in the variation matches the user item
      for (const item of variation.items) {
        const itemDesc = item.description.toLowerCase();
        const itemColor = item.color.toLowerCase();

        // Check if description contains user item keywords
        const hasKeywords = userAttr.keywords.some((kw) =>
          itemDesc.includes(kw)
        );

        // Check if colors match (if user item specified a color)
        const colorMatches =
          userAttr.colors.length === 0 ||
          userAttr.colors.some(
            (uc) => itemColor.includes(uc) || itemDesc.includes(uc)
          );

        // Check if item types match (if user item specified an item type)
        const itemTypeMatches =
          userAttr.itemTypes.length === 0 ||
          userAttr.itemTypes.some((ut) => itemDesc.includes(ut));

        if (hasKeywords && colorMatches && itemTypeMatches) {
          found = true;
          break;
        }
      }

      // Log warning if user item not found (but don't fail - AI might have rephrased)
      if (!found && process.env.NODE_ENV === "development") {
        console.warn(
          `[AI] User item "${userAttr.original}" may not be properly included in variation "${variation.name}"`
        );
      }
    }
  }
}

export async function generateOutfit(
  userItems: UserItem[],
  preferences: OutfitPreferences
): Promise<OutfitResponse> {
  // Get API keys and provider preference
  const provider = process.env.AI_PROVIDER?.toLowerCase() || "auto";
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const hfKey =
    process.env.HUGGING_FACE_API_KEY?.trim() ||
    process.env.HUGGINGFACE_API_KEY?.trim();

  const prompt = buildPrompt(userItems, preferences);

  // Try providers in order: explicit provider > Groq > Hugging Face
  if (provider === "groq" || (provider === "auto" && groqKey)) {
    if (groqKey) {
      try {
        if (process.env.NODE_ENV === "development") {
          console.log("[AI] Using Groq API with Llama 3.1 70B");
        }
        const result = await callGroq(prompt, groqKey);
        validateUserItemsPreserved(userItems, result.variations);
        return { variations: result.variations };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("[AI] Groq failed:", errorMsg);
        // Fall through to try other providers if auto mode
        if (provider !== "auto") throw error;
      }
    }
  }

  // Fallback to Hugging Face
  if (hfKey) {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("[AI] Using Hugging Face model:", HF_MODEL);
      }
      const result = await callHuggingFace(prompt, hfKey);
      validateUserItemsPreserved(userItems, result.variations);
      return { variations: result.variations };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[AI] Hugging Face failed:", errorMsg);
      throw error;
    }
  }

  throw new Error(
    "No AI provider configured. Please set GROQ_API_KEY or HUGGING_FACE_API_KEY in your environment variables."
  );
}
