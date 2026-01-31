import { OutfitVariation, UserItem } from "./types";
import {
  buildExactMatchesFromUserItems,
  buildStrictSearchQuery,
  extractRequiredKeywords,
  extractTextAttributes,
} from "./attributes";
import {
  COLOR_WORDS,
  STOP_WORDS,
  STYLE_CONTEXT,
} from "./constants";

/**
 * Check if image metadata (alt text/description) contains required keywords
 * This helps filter images to ensure they match user requirements
 */
function imageMatchesRequirements(
  altText: string | undefined,
  requiredKeywords: string[]
): boolean {
  if (requiredKeywords.length === 0) {
    return true; // No requirements, accept the image
  }

  // If we require a specific color, we must have metadata to validate against.
  const hasColorRequirement = requiredKeywords.some((kw) =>
    (COLOR_WORDS as readonly string[]).includes(kw)
  );
  if (!altText) {
    return !hasColorRequirement;
  }

  const lowerAlt = altText.toLowerCase();
  // Check if all required keywords are present in the alt text
  return requiredKeywords.every((keyword) =>
    lowerAlt.includes(keyword.toLowerCase())
  );
}

// extractRequiredKeywords now lives in src/lib/attributes.ts

/**
 * Search Unsplash API across multiple pages to find a qualifying image
 * @param query - Search query
 * @param maxPages - Maximum number of pages to search
 * @param perPage - Results per page (Unsplash max 30)
 * @param requiredKeywords - Keywords that must appear in image metadata (optional)
 * @param bestEffortAfterPages - After this many pages with no match, return first image (best effort)
 * @returns First matching image or null
 */
async function searchUnsplashAcrossPages(
  query: string,
  maxPages: number = 30,
  perPage: number = 30,
  requiredKeywords: string[] = [],
  bestEffortAfterPages?: number
): Promise<OutfitImage | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn("UNSPLASH_ACCESS_KEY not set. Cannot search for images.");
    }
    return null;
  }

  for (let page = 1; page <= maxPages; page++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            query
          )}&per_page=${perPage}&page=${page}&orientation=portrait`,
          {
            headers: {
              Authorization: `Client-ID ${apiKey}`,
              "Accept-Version": "v1",
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            console.error(
              "Unsplash API key is invalid or expired. Please check your UNSPLASH_ACCESS_KEY environment variable."
            );
            return null;
          }
          if (response.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw new Error(`Unsplash API error: ${response.status}`);
        }

        const data = (await response.json()) as {
          results: Array<{
            id: string;
            urls: { regular: string; small: string };
            user: { name: string; links?: { html?: string } };
            description: string | null;
            alt_description: string | null;
          }>;
          total: number;
          total_pages: number;
        };

        if (!data.results || data.results.length === 0) break;

        const useBestEffort =
          bestEffortAfterPages != null &&
          page > bestEffortAfterPages &&
          requiredKeywords.length > 0;

        for (const photo of data.results) {
          const altText = photo.description || photo.alt_description || undefined;
          const matches =
            requiredKeywords.length === 0 ||
            imageMatchesRequirements(altText, requiredKeywords);

          if (matches || useBestEffort) {
            const result: OutfitImage = {
              id: photo.id,
              url: photo.urls.regular,
              thumbnail: photo.urls.small,
              photographer: photo.user?.name,
              photographerUrl: photo.user?.links?.html,
              description: altText ?? undefined,
            };

            if (process.env.NODE_ENV === "development") {
              console.log("[ImageSearch] Found matching image from Unsplash:", {
                id: result.id,
                url: result.url.substring(0, 50),
                page,
                bestEffort: useBestEffort,
              });
            }

            return result;
          }
        }

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[ImageSearch] Scanned ${data.results.length} images on page ${page}, none matched requirements. Continuing...`
          );
        }
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        const err = fetchError as Error & { name?: string };
        if (err.name === "AbortError") {
          if (process.env.NODE_ENV === "development") {
            console.warn(`Unsplash API request timed out on page ${page}`);
          }
          continue;
        }
        throw fetchError;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Error searching Unsplash page ${page}:`, error);
      }
      continue;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[ImageSearch] No qualifying images found after scanning ${maxPages} pages`
    );
  }
  return null;
}

/**
 * Search for a single image from Unsplash (first result from page)
 */
async function searchSingleUnsplashImage(
  query: string,
  page: number = 1
): Promise<OutfitImage | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "UNSPLASH_ACCESS_KEY not set. Images cannot be loaded. Get a free key at https://unsplash.com/developers"
      );
    }
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=30&page=${page}&orientation=squarish`,
      {
        headers: {
          Authorization: `Client-ID ${apiKey}`,
          "Accept-Version": "v1",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        console.error(
          "Unsplash API key is invalid or expired. Please check your UNSPLASH_ACCESS_KEY environment variable."
        );
        return null;
      }
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      results: Array<{
        id: string;
        urls: { regular: string; small: string };
        user: { name: string; links?: { html?: string } };
        description: string | null;
        alt_description: string | null;
      }>;
    };

    if (!data.results || data.results.length === 0) return null;

    const photo = data.results[0];
    const altText = photo.description || photo.alt_description || undefined;
    return {
      id: photo.id,
      url: photo.urls.regular,
      thumbnail: photo.urls.small,
      photographer: photo.user?.name,
      photographerUrl: photo.user?.links?.html,
      description: altText ?? undefined,
    };
  } catch (fetchError: unknown) {
    clearTimeout(timeoutId);
    const err = fetchError as Error & { name?: string };
    if (err.name === "AbortError") {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Unsplash API request timed out on page ${page}`);
      }
      return null;
    }
    throw fetchError;
  }
}

/**
 * Image search result (Unsplash)
 */
export interface OutfitImage {
  id: string;
  url: string;
  thumbnail: string;
  photographer?: string;
  photographerUrl?: string;
  description?: string;
}

/**
 * Extract colors and item types from description for strict matching
 */
// extractTextAttributes now lives in src/lib/attributes.ts

function stripColorWords(text: string): string {
  // Remove color words to avoid conflicts when user-specified colors must dominate
  const pattern = new RegExp(`\\b(${COLOR_WORDS.join("|")})\\b`, "gi");
  return text.replace(pattern, "").replace(/\s+/g, " ").trim();
}

/**
 * Build search query from outfit variation with strict attribute matching
 * Prioritizes exact color + item type combinations to ensure images match user-specified attributes
 */
function buildSearchQuery(
  variation: OutfitVariation,
  userItems?: UserItem[]
): string {
  const preferUserAttributes = !!userItems && userItems.length > 0;

  // Extract attributes from user items when present (absolute priority)
  const attributeSourceDescriptions = preferUserAttributes
    ? userItems.map((i) => i.description)
    : variation.items.map((i) => i.description);

  const allAttributes = attributeSourceDescriptions.map((desc) =>
    extractTextAttributes(desc)
  );

  // Prioritize exact color and item type matches
  const exactMatches: string[] = [];
  const colorMatches: string[] = [];
  const itemTypeMatches: string[] = [];
  const generalTerms: string[] = [];

  // Build exact match queries first (colors + item types)
  // This ensures images match exact attributes like "yellow pants" or "gray jacket"
  for (let i = 0; i < attributeSourceDescriptions.length; i++) {
    const desc = attributeSourceDescriptions[i];
    const attrs = allAttributes[i];

    // Priority 1: Exact color + item type combinations (e.g., "yellow pants", "gray jacket")
    if (attrs.colors.length > 0 && attrs.itemTypes.length > 0) {
      for (const color of attrs.colors) {
        for (const itemType of attrs.itemTypes) {
          exactMatches.push(`${color} ${itemType}`);
        }
      }
    }

    // Priority 2: Colors only (if no item type found)
    if (attrs.colors.length > 0 && attrs.itemTypes.length === 0) {
      colorMatches.push(...attrs.colors);
    }

    // Priority 3: Item types only (if no color found)
    if (attrs.itemTypes.length > 0 && attrs.colors.length === 0) {
      itemTypeMatches.push(...attrs.itemTypes);
    }

    // Add full description as general term (lowest priority)
    generalTerms.push(desc);
  }

  // Build query prioritizing exact matches
  const queryParts: string[] = [];

  // Priority 1: Add exact color + item type matches first (most important for strict matching)
  if (exactMatches.length > 0) {
    // Deduplicate and limit to avoid query length issues
    const uniqueExactMatches = [...new Set(exactMatches)].slice(0, 5);
    queryParts.push(...uniqueExactMatches);
  }

  // Priority 2: Add color matches
  if (colorMatches.length > 0 && exactMatches.length === 0) {
    const uniqueColors = [...new Set(colorMatches)].slice(0, 3);
    queryParts.push(...uniqueColors);
  }

  // Priority 3: Add item type matches
  if (itemTypeMatches.length > 0 && exactMatches.length === 0) {
    const uniqueItemTypes = [...new Set(itemTypeMatches)].slice(0, 3);
    queryParts.push(...uniqueItemTypes);
  }

  // Add style context
  queryParts.push(`${variation.name} style`);

  // Add general terms (less specific, lower priority)
  if (generalTerms.length > 0) {
    // When user items exist, strip color words from these terms to avoid conflicting colors
    const cleaned = preferUserAttributes
      ? generalTerms.map(stripColorWords)
      : generalTerms;
    queryParts.push(...cleaned.filter(Boolean).slice(0, 2));
  }

  // Add outfit/fashion context
  queryParts.push("outfit fashion");

  return queryParts.join(" ").trim();
}

/**
 * Build two search queries (man/woman) from AI suggestion text
 * Uses variation name and color palette to create style-appropriate queries
 */
export function buildSuggestionQueries(
  suggestion: string,
  variationName?: "Minimal" | "Street" | "Elevated",
  colorPalette?: string[],
  userItems?: UserItem[]
): {
  manQuery: string;
  womanQuery: string;
} {
  // Extract key fashion terms from the suggestion
  // Remove common stop words and keep fashion-relevant terms
  const words = suggestion
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 8) // Limit to 8 key terms to leave room for style/color terms
    .join(" ");

  // Build style-specific context based on variation name using shared constants
  const styleContext =
    variationName && variationName in STYLE_CONTEXT
      ? STYLE_CONTEXT[variationName]
      : STYLE_CONTEXT.default;

  // PRIORITY 1: Extract exact color + item type combinations from user items (STRICT MATCHING)
  const exactMatches =
    userItems && userItems.length > 0
      ? buildExactMatchesFromUserItems(userItems)
      : [];

  // PRIORITY 2: Extract color names from color palette (skip hex codes)
  // Prioritize exact color matches to ensure images match user-specified colors
  let colorTerms = "";
  if (colorPalette && colorPalette.length > 0) {
    const colorNames = colorPalette
      .filter((color) => !color.startsWith("#")) // Skip hex codes
      .map((color) => color.toLowerCase().replace(/\s+/g, ""))
      .slice(0, 5) // Increased to 5 to prioritize exact color matches
      .join(" ");
    if (colorNames) {
      colorTerms = colorNames;
    }
  }

  // Build base query - prioritize exact matches first
  const baseParts: string[] = [];

  // Add exact matches FIRST (most important for strict matching)
  if (exactMatches.length > 0) {
    baseParts.push(...exactMatches.slice(0, 3)); // Limit to avoid query length issues
  }

  // Add suggestion words
  baseParts.push(words);

  // Add style context
  baseParts.push(styleContext);

  // Add color terms
  if (colorTerms) {
    baseParts.push(colorTerms);
  }

  const baseQuery = baseParts.filter(Boolean).join(" ") || "fashion outfit";

  // Build queries with gender-specific suffixes - make them more distinct
  const manQuery =
    `${baseQuery} male man menswear mens fashion outfit photography`.trim();
  const womanQuery =
    `${baseQuery} female woman womenswear womens fashion outfit photography`.trim();

  // Log queries in development for debugging (suffix shows gender difference)
  if (process.env.NODE_ENV === "development") {
    console.log("[ImageSearch] Suggestion queries:", {
      exactMatches: exactMatches.slice(0, 3),
      manQuerySuffix: manQuery.slice(-70),
      womanQuerySuffix: womanQuery.slice(-70),
      hasUserItems: !!userItems && userItems.length > 0,
    });
  }

  return { manQuery, womanQuery };
}

/**
 * Search for outfit images using Unsplash API with strict attribute matching
 * Returns at most one image that matches the search query
 */
export async function searchOutfitImages(
  variation: OutfitVariation,
  _count: number = 3,
  userItems?: UserItem[]
): Promise<OutfitImage[]> {
  void _count;

  let query: string;

  if (userItems && userItems.length > 0) {
    const strictQuery = buildStrictSearchQuery(userItems, variation.name);
    query = strictQuery;
  } else {
    query = buildSearchQuery(variation);
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[ImageSearch] Outfit search query:", {
      query: query.substring(0, 150),
      hasUserItems: !!userItems && userItems.length > 0,
    });
  }

  const requiredKeywords = extractRequiredKeywords(userItems);
  const image = await searchUnsplashAcrossPages(query, 50, 30, requiredKeywords);

  if (image) return [image];
  return [];
}

/**
 * Search for two outfit images (man and woman) based on AI suggestion text
 * Uses Unsplash API with strict attribute matching from user items
 */
export async function searchSuggestionImages(
  suggestion: string,
  variationName?: "Minimal" | "Street" | "Elevated",
  colorPalette?: string[],
  userItems?: UserItem[]
): Promise<{ manImage: OutfitImage | null; womanImage: OutfitImage | null }> {
  const { manQuery, womanQuery } = buildSuggestionQueries(
    suggestion,
    variationName,
    colorPalette,
    userItems
  );

  if (process.env.NODE_ENV === "development") {
    // Log suffix so gender difference (male/man vs female/woman) is visible
    console.log("Building queries from suggestion:", {
      suggestion: suggestion.substring(0, 50),
      variationName,
      manQuerySuffix: manQuery.slice(-70),
      womanQuerySuffix: womanQuery.slice(-70),
      hasUserItems: !!userItems && userItems.length > 0,
    });
  }

  // Extract required keywords from user items for metadata matching
  const requiredKeywords = extractRequiredKeywords(userItems);

  // Cap pages so we finish within route timeout (~60s). Best-effort after 4 pages so we return an image.
  const maxPagesSuggestion = 10;
  const bestEffortAfterPages = 4;

  if (requiredKeywords.length > 0) {
    const [manImage, womanImage] = await Promise.all([
      searchUnsplashAcrossPages(
        manQuery,
        maxPagesSuggestion,
        30,
        requiredKeywords,
        bestEffortAfterPages
      ),
      searchUnsplashAcrossPages(
        womanQuery,
        maxPagesSuggestion,
        30,
        requiredKeywords,
        bestEffortAfterPages
      ),
    ]);

    const finalManImage = manImage;
    let finalWomanImage = womanImage;

    if (manImage && womanImage && manImage.id === womanImage.id) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Duplicate images detected, retrying woman image with different starting page"
        );
      }
      try {
        const retryWomanImage = await searchUnsplashAcrossPages(
          womanQuery,
          maxPagesSuggestion,
          30,
          requiredKeywords,
          bestEffortAfterPages
        );
        if (retryWomanImage && retryWomanImage.id !== manImage.id) {
          finalWomanImage = retryWomanImage;
        } else {
          finalWomanImage = null;
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to retry woman image:", error);
        }
        finalWomanImage = null;
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Image search completed:", {
        hasManImage: !!finalManImage,
        hasWomanImage: !!finalWomanImage,
        wasDuplicate: manImage && womanImage && manImage.id === womanImage.id,
      });
    }

    return { manImage: finalManImage, womanImage: finalWomanImage };
  }

  const manStartPage = 1;
  const womanStartPage = 10;

  const [manImage, womanImage] = (await Promise.allSettled([
    searchSingleUnsplashImage(manQuery, manStartPage),
    searchSingleUnsplashImage(womanQuery, womanStartPage),
  ]).then((results) => {
    return results.map((result, index) => {
      if (result.status === "rejected") {
        const error = result.reason;
        if (process.env.NODE_ENV === "development") {
          console.error(
            `Failed to fetch ${index === 0 ? "man" : "woman"} image:`,
            error
          );
        }
        return null;
      }
      return result.value;
    });
  })) as [OutfitImage | null, OutfitImage | null];

  const finalManImage = manImage;
  let finalWomanImage = womanImage;

  if (manImage && womanImage && manImage.id === womanImage.id) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Duplicate images detected, retrying woman image with different starting page"
      );
    }
    try {
      const retryWomanImage = await searchSingleUnsplashImage(womanQuery, 20);
      if (retryWomanImage && retryWomanImage.id !== manImage.id) {
        finalWomanImage = retryWomanImage;
      } else {
        finalWomanImage = null;
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to retry woman image:", error);
      }
      finalWomanImage = null;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("Image search completed:", {
      hasManImage: !!finalManImage,
      hasWomanImage: !!finalWomanImage,
      wasDuplicate: manImage && womanImage && manImage.id === womanImage.id,
    });
  }

  return { manImage: finalManImage, womanImage: finalWomanImage };
}
