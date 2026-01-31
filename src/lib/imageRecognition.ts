/**
 * Image recognition utilities for detecting clothing items in images
 */

import { ITEM_TYPE_WORDS, COLOR_WORDS } from "./constants";
import { getZoneFromDescription } from "./zoneUtils";
import { appendFileSync } from "fs";
import { join } from "path";

// #region agent log helper
function debugLog(location: string, message: string, data: Record<string, unknown>, hypothesisId: string) {
  try {
    const logPath = join(process.cwd(), '.cursor', 'debug.log');
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      location,
      message,
      data,
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId,
    };
    appendFileSync(logPath, JSON.stringify(logEntry) + '\n', { flag: 'a' });
  } catch (e) {
    // Log to console if file logging fails
    console.error('[DEBUG LOG ERROR]', e);
  }
}
// #endregion

export interface ImageRecognitionResult {
  itemType: string;
  description: string;
  bodyZone: "head" | "torso" | "legs" | "feet" | "accessories";
  color?: string;
  confidence?: number;
}

/**
 * Analyze an image using Hugging Face vision model to detect clothing item type
 */
export async function recognizeClothingItem(
  imageUrl: string
): Promise<ImageRecognitionResult> {
  // #region agent log
  debugLog('imageRecognition.ts:22', 'recognizeClothingItem called', { imageUrlLength: imageUrl.length, isDataUrl: imageUrl.startsWith('data:image/') }, 'A');
  // #endregion

  const hfApiKey =
    process.env.HUGGING_FACE_API_KEY?.trim() ||
    process.env.HUGGINGFACE_API_KEY?.trim();

  // #region agent log
  debugLog('imageRecognition.ts:54', 'API key check', { hasApiKey: !!hfApiKey, apiKeyLength: hfApiKey?.length || 0 }, 'A');
  // #endregion

  if (!hfApiKey) {
    // #region agent log
    debugLog('imageRecognition.ts:60', 'No API key, returning fallback', {}, 'A');
    // #endregion
    // Fallback: return generic description
    return {
      itemType: "clothing item",
      description: "clothing item",
      bodyZone: "torso",
    };
  }

  try {
    // Use Hugging Face's image-to-text model for clothing recognition
    // We'll use a vision-language model that can describe images
    const model = "Salesforce/blip-image-captioning-base";

    // #region agent log
    debugLog('imageRecognition.ts:68', 'Preparing image input', { model }, 'A');
    // #endregion

    // Prepare the image input - Hugging Face accepts base64 strings directly
    let imageInput: string;
    if (imageUrl.startsWith("data:image/")) {
      // Extract base64 part from data URL
      const base64Match = imageUrl.match(/base64,(.+)$/);
      if (!base64Match) {
        throw new Error("Invalid data URL format");
      }
      imageInput = base64Match[1];
    } else {
      // For regular URLs, pass the URL directly
      imageInput = imageUrl;
    }

    // #region agent log
    debugLog('imageRecognition.ts:85', 'Calling Hugging Face API', { imageInputLength: imageInput.length }, 'A');
    // #endregion

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: imageInput,
        }),
      }
    );

    // #region agent log
    debugLog('imageRecognition.ts:100', 'Hugging Face API response received', { status: response.status, ok: response.ok }, 'A');
    // #endregion

    if (!response.ok) {
      const errorText = await response.text();
      // #region agent log
      debugLog('imageRecognition.ts:105', 'Hugging Face API error', { status: response.status, errorText: errorText.substring(0, 200) }, 'A');
      // #endregion
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    // #region agent log
    debugLog('imageRecognition.ts:111', 'Hugging Face API result parsed', { resultType: typeof result, isArray: Array.isArray(result) }, 'A');
    // #endregion

    // Extract description from the result
    let description = "";
    if (Array.isArray(result) && result.length > 0) {
      description = result[0].generated_text || "";
    } else if (typeof result === "object" && result.generated_text) {
      description = result.generated_text;
    } else if (typeof result === "string") {
      description = result;
    }

    // #region agent log
    debugLog('imageRecognition.ts:87', 'AI model raw description', { description, descriptionLength: description.length, containsYellow: description.toLowerCase().includes('yellow') }, 'A');
    // #endregion

    // Parse the description to find item type and color
    const detectedItemType = detectItemTypeFromDescription(description);
    const detectedColor = detectColorFromDescription(description);
    const bodyZone = getZoneFromDescription(detectedItemType);

    // #region agent log
    debugLog('imageRecognition.ts:95', 'After detection', { detectedItemType, detectedColor, descriptionLength: description.length }, 'A');
    // #endregion

    // Build a detailed description: prefer the AI's image description when available
    let finalDescription: string;
    const cleanedAi = cleanDescription(description).trim();
    const hasUsableAiDescription = cleanedAi.length >= 3;

    // 1. Prefer the AI's description of the image when it's usable (avoids "clothing item")
    if (hasUsableAiDescription) {
      finalDescription = cleanedAi.length > 60 ? cleanedAi.substring(0, 60).trim() : cleanedAi;
    } else if (description.length < 100 && detectedColor && detectedItemType !== "clothing item") {
      // 2. Build from detected color + item type
      const hasColorAndType = description.toLowerCase().includes(detectedColor.toLowerCase()) &&
                              description.toLowerCase().includes(detectedItemType.toLowerCase());
      if (hasColorAndType) {
        finalDescription = cleanDescription(description, detectedColor, detectedItemType);
      } else {
        finalDescription = `${detectedColor} ${detectedItemType}`;
      }
    } else if (detectedColor && detectedItemType !== "clothing item") {
      finalDescription = `${detectedColor} ${detectedItemType}`;
    } else if (detectedItemType !== "clothing item") {
      finalDescription = detectedItemType;
    } else {
      finalDescription = "clothing item";
    }

    const finalResult = {
      itemType: detectedItemType,
      description: finalDescription,
      bodyZone,
      color: detectedColor,
    };

    // #region agent log
    debugLog('imageRecognition.ts:130', 'Final result returned', { finalDescription, finalColor: finalResult.color, detectedColor }, 'E');
    // #endregion

    return finalResult;
  } catch (error) {
    // #region agent log
    debugLog('imageRecognition.ts:145', 'Error in recognizeClothingItem', { error: error instanceof Error ? error.message : String(error), errorType: error instanceof Error ? error.constructor.name : typeof error }, 'A');
    // #endregion
    console.error("[ImageRecognition] Error recognizing image:", error);
    // Fallback: return generic description
    return {
      itemType: "clothing item",
      description: "clothing item",
      bodyZone: "torso",
    };
  }
}

/**
 * Detect item type from AI-generated description using keyword matching
 */
function detectItemTypeFromDescription(description: string): string {
  const desc = description.toLowerCase();

  // Priority 1: Check for exact item type matches (most specific first)
  // Check footwear first since it's commonly misclassified
  if (
    desc.includes("shoe") ||
    desc.includes("sneaker") ||
    desc.includes("boot") ||
    desc.includes("sandal") ||
    desc.includes("heel") ||
    desc.includes("footwear") ||
    desc.includes("trainer") ||
    desc.includes("sneakers")
  ) {
    return "shoes";
  }

  // Check for each item type in order of specificity
  for (const itemType of ITEM_TYPE_WORDS) {
    const regex = new RegExp(`\\b${itemType}\\b`, "i");
    if (regex.test(desc)) {
      return itemType;
    }
  }

  // Priority 2: Partial matches for common items (more specific patterns)
  if (desc.includes("pant") || desc.includes("jean") || desc.includes("trouser") || desc.includes("trouser")) {
    return "pants";
  }
  if (desc.includes("shirt") || desc.includes("top") || desc.includes("tee") || desc.includes("t-shirt")) {
    return "shirt";
  }
  if (desc.includes("jacket") || desc.includes("coat") || desc.includes("blazer")) {
    return "jacket";
  }
  if (desc.includes("hat") || desc.includes("cap") || desc.includes("beanie")) {
    return "hat";
  }
  if (desc.includes("dress") || desc.includes("gown")) {
    return "dress";
  }
  if (desc.includes("skirt")) {
    return "skirt";
  }

  return "clothing item";
}

/**
 * Detect color from AI-generated description using keyword matching
 * Only returns a color if we're confident it's actually describing the item's color
 */
function detectColorFromDescription(description: string): string | undefined {
  const desc = description.toLowerCase();

  // #region agent log
  debugLog('imageRecognition.ts:200', 'detectColorFromDescription entry', { descriptionLength: desc.length, containsYellow: desc.includes('yellow'), containsShoe: desc.includes('shoe') || desc.includes('sneaker') }, 'A');
  // #endregion

  // Be conservative - only detect colors if they appear in clear color contexts
  // Avoid false positives from words like "yellow" in "yellow fever" or "yellow pages"

  // Check for explicit color mentions with clothing context
  const colorContexts = [
    /\b(yellow|red|blue|green|black|white|gray|grey|brown|pink|purple|orange)\s+(shoe|sneaker|boot|sandal|heel|trainer|footwear|pant|jean|trouser|shirt|top|jacket|coat|blazer|hat|cap|dress|skirt)\b/i,
    /\b(shoe|sneaker|boot|sandal|heel|trainer|footwear|pant|jean|trouser|shirt|top|jacket|coat|blazer|hat|cap|dress|skirt)\s+(yellow|red|blue|green|black|white|gray|grey|brown|pink|purple|orange)\b/i,
    /\b(yellow|red|blue|green|black|white|gray|grey|brown|pink|purple|orange)\s+(colored|color|hued)\b/i,
  ];

  // First check for clear color + clothing item patterns
  for (const pattern of colorContexts) {
    const match = desc.match(pattern);
    if (match) {
      // #region agent log
      debugLog('imageRecognition.ts:217', 'Color context pattern matched', { match: match[0], patternIndex: colorContexts.indexOf(pattern) }, 'C');
      // #endregion
      // Extract the color word
      for (const color of COLOR_WORDS) {
        if (match[0].toLowerCase().includes(color.toLowerCase())) {
          // #region agent log
          debugLog('imageRecognition.ts:221', 'Color detected via pattern match', { color }, 'C');
          // #endregion
          return color;
        }
      }
    }
  }

  // Fallback: check for standalone color words, but be more strict
  // Only if the description is short (likely a direct description) or contains color-related words
  const hasColorIndicators = desc.includes("color") || desc.includes("colored") || desc.includes("hue") || desc.length < 50;

  // #region agent log
  debugLog('imageRecognition.ts:228', 'Checking standalone color words', { hasColorIndicators, descLength: desc.length, descLengthLessThan50: desc.length < 50 }, 'B');
  // #endregion

  if (hasColorIndicators) {
    for (const color of COLOR_WORDS) {
      const regex = new RegExp(`\\b${color}\\b`, "i");
      if (regex.test(desc)) {
        // #region agent log
        debugLog('imageRecognition.ts:233', 'Color word found in description', { color, colorIndex: desc.indexOf(color) }, 'A');
        // #endregion
        // Double-check it's not a false positive (e.g., "yellow fever", "red carpet")
        const colorIndex = desc.indexOf(color);
        const before = desc.substring(Math.max(0, colorIndex - 10), colorIndex);
        const after = desc.substring(colorIndex + color.length, Math.min(desc.length, colorIndex + color.length + 10));

        // If surrounded by clothing-related words, it's likely a color
        const clothingWords = ["shoe", "sneaker", "boot", "pant", "shirt", "jacket", "hat", "dress", "skirt", "item", "piece", "wear"];
        const hasClothingContext = clothingWords.some(word => before.includes(word) || after.includes(word));

        // #region agent log
        debugLog('imageRecognition.ts:241', 'Context check for color', { color, before, after, hasClothingContext, descLength: desc.length, descLengthLessThan30: desc.length < 30 }, 'D');
        // #endregion

        if (hasClothingContext || desc.length < 30) {
          // #region agent log
          debugLog('imageRecognition.ts:244', 'Color detected via standalone word', { color }, 'D');
          // #endregion
          return color;
        }
      }
    }
  }

  // Check for common color variations only if we have clothing context
  const clothingContext = desc.includes("shoe") || desc.includes("sneaker") || desc.includes("boot") ||
                          desc.includes("pant") || desc.includes("jean") || desc.includes("trouser") ||
                          desc.includes("shirt") || desc.includes("top") || desc.includes("jacket") ||
                          desc.includes("dress") || desc.includes("skirt") || desc.includes("hat") ||
                          desc.includes("cap") || desc.includes("coat") || desc.includes("blazer");

  if (clothingContext) {
    if (desc.includes("gold") || desc.includes("golden")) {
      return "yellow";
    }
    if (desc.includes("silver") || desc.includes("grey") || desc.includes("gray")) {
      return "gray";
    }
    if (desc.includes("navy")) {
      return "blue";
    }
    if (desc.includes("maroon") || desc.includes("burgundy")) {
      return "red";
    }
    if (desc.includes("beige") || desc.includes("tan")) {
      return "beige";
    }

    // If we have clothing context and the description is short, be more lenient with color detection
    // This helps catch cases like "yellow shoe" or "red dress" in short descriptions
    // #region agent log
    debugLog('imageRecognition.ts:276', 'Checking short description fallback', { descLength: desc.length, descLengthLessThan60: desc.length < 60, clothingContext }, 'B');
    // #endregion
    if (desc.length < 60) {
      for (const color of COLOR_WORDS) {
        const regex = new RegExp(`\\b${color}\\b`, "i");
        if (regex.test(desc)) {
          // #region agent log
          debugLog('imageRecognition.ts:280', 'Color found in short description path', { color, colorIndex: desc.indexOf(color.toLowerCase()) }, 'B');
          // #endregion
          // Check if color appears near clothing words (within 5 words)
          const colorIndex = desc.indexOf(color.toLowerCase());
          const contextStart = Math.max(0, colorIndex - 30);
          const contextEnd = Math.min(desc.length, colorIndex + color.length + 30);
          const context = desc.substring(contextStart, contextEnd);

          // If we have clothing context nearby, it's likely a color
          const nearbyClothingWords = ["shoe", "sneaker", "boot", "pant", "jean", "shirt", "top",
                                       "jacket", "dress", "skirt", "hat", "cap", "coat", "blazer",
                                       "item", "piece", "wear", "clothing", "garment"];
          const hasNearbyContext = nearbyClothingWords.some(word => context.includes(word));

          // #region agent log
          debugLog('imageRecognition.ts:290', 'Nearby context check', { color, context, hasNearbyContext }, 'D');
          // #endregion

          if (hasNearbyContext) {
            // #region agent log
            debugLog('imageRecognition.ts:294', 'Color detected via nearby context', { color }, 'D');
            // #endregion
            return color;
          }
        }
      }
    }
  }

  // #region agent log
  debugLog('imageRecognition.ts:300', 'No color detected, returning undefined', { descLength: desc.length }, 'A');
  // #endregion
  return undefined;
}

/**
 * Clean and format AI-generated description to be more concise and accurate
 */
function cleanDescription(
  description: string,
  detectedColor?: string,
  detectedItemType?: string
): string {
  let cleaned = description.trim();

  // Remove common filler words and phrases
  cleaned = cleaned
    .replace(/^(a|an|the)\s+/i, "") // Remove articles at start
    .replace(/\s+(a|an|the)\s+/gi, " ") // Remove articles in middle
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // If we have detected color and type, ensure they're in the description
  if (detectedColor && detectedItemType && detectedItemType !== "clothing item") {
    const lowerDesc = cleaned.toLowerCase();
    const hasColor = lowerDesc.includes(detectedColor.toLowerCase());
    const hasType = lowerDesc.includes(detectedItemType.toLowerCase());

    // If missing either, add them
    if (!hasColor || !hasType) {
      if (!hasColor && !hasType) {
        cleaned = `${detectedColor} ${detectedItemType}`;
      } else if (!hasColor) {
        // Insert color before item type
        const typeIndex = lowerDesc.indexOf(detectedItemType.toLowerCase());
        if (typeIndex > 0) {
          cleaned = `${detectedColor} ${cleaned}`;
        } else {
          cleaned = `${detectedColor} ${detectedItemType}`;
        }
      } else if (!hasType) {
        // Add item type
        cleaned = `${cleaned} ${detectedItemType}`;
      }
    }
  }

  // Limit length to avoid overly long descriptions
  if (cleaned.length > 50) {
    // Try to keep the most important parts (color + item type)
    if (detectedColor && detectedItemType && detectedItemType !== "clothing item") {
      cleaned = `${detectedColor} ${detectedItemType}`;
    } else {
      cleaned = cleaned.substring(0, 50).trim();
    }
  }

  return cleaned;
}
