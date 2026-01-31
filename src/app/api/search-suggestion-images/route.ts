import { NextRequest } from "next/server";
import { handlerWrapper } from "@/server/api/handler-wrapper";
import { SearchSuggestionImagesRequestSchema } from "@/lib/validation";
import { z } from "zod";
import { searchSuggestionImages, type OutfitImage } from "@/lib/imageSearch";
import { logger } from "@/server/logger/logger";
import { suggestionImageCache } from "@/server/cache/memory-cache";

type SearchSuggestionImagesRequest = z.infer<typeof SearchSuggestionImagesRequestSchema>;

export async function POST(request: NextRequest) {
  return handlerWrapper<SearchSuggestionImagesRequest, { manImage: OutfitImage | null; womanImage: OutfitImage | null }>(
    request,
    {
      schema: SearchSuggestionImagesRequestSchema,
      rateLimitMax: 30,
      rateLimitWindowMs: 60 * 1000, // 1 minute
      timeoutMs: 60000, // 60 seconds - allow time to search many pages
    },
    async (data) => {
      const { suggestion, variationName, colorPalette, userItems } = data;

      // Cache per variation so Street and Elevated get different images
      const suggestionKey = suggestion.trim().toLowerCase();
      const variationKey = variationName ?? "default";
      const cacheKey = `${suggestionKey}_${variationKey}`;
      const cached = suggestionImageCache.get(cacheKey);
      if (cached) {
        logger.debug("Cache hit for suggestion images", {
          suggestion: suggestion.substring(0, 50),
          variationName: variationKey,
        });
        return {
          manImage: cached.manImage as OutfitImage | null,
          womanImage: cached.womanImage as OutfitImage | null,
        };
      }

      // Fetch images
      let images: {
        manImage: OutfitImage | null;
        womanImage: OutfitImage | null;
      };
      try {
        logger.debug("Searching for suggestion images", {
          suggestion: suggestion.substring(0, 50),
          variationName: variationName ?? "default",
          hasUserItems: !!userItems && userItems.length > 0,
        });
        images = await searchSuggestionImages(suggestion, variationName, colorPalette, userItems);
        logger.debug("Image search results", {
          hasManImage: !!images.manImage,
          hasWomanImage: !!images.womanImage,
        });

        // Check if images are null and log a warning about potential API key issues
        if (!images.manImage && !images.womanImage) {
          logger.warn(
            "No images returned from search. This may indicate an API key issue. Check server logs for authentication errors."
          );
        }
      } catch (error) {
        logger.error("Suggestion image search failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        // Return empty images for graceful degradation
        images = { manImage: null, womanImage: null };
      }

      // Cache the results
      suggestionImageCache.set(cacheKey, images);

      return images;
    }
  );
}
