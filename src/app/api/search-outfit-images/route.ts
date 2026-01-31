import { NextRequest } from 'next/server';
import { handlerWrapper } from '@/server/api/handler-wrapper';
import { SearchOutfitImagesRequestSchema } from '@/lib/validation';
import { z } from 'zod';
import { searchOutfitImages, type OutfitImage } from '@/lib/imageSearch';
import { logger } from '@/server/logger/logger';

type SearchOutfitImagesRequest = z.infer<typeof SearchOutfitImagesRequestSchema>;

export async function POST(request: NextRequest) {
  return handlerWrapper<SearchOutfitImagesRequest, { images: OutfitImage[] }>(
    request,
    {
      schema: SearchOutfitImagesRequestSchema,
      rateLimitMax: 20,
      rateLimitWindowMs: 60 * 1000, // 1 minute
      timeoutMs: 10000, // 10 seconds for image search
    },
    async (data) => {
      const { variation, count = 3, userItems } = data;

      // Validate query length to prevent abuse
      const searchQuery = variation.items
        .map(item => item.description)
        .join(' ');

      if (searchQuery.length > 500) {
        throw new Error('Search query too long');
      }

      let images: OutfitImage[] = [];
      try {
        images = await searchOutfitImages(variation, count, userItems);
      } catch (error) {
        logger.error('Image search failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        // Return empty array instead of error for graceful degradation
        images = [];
      }

      return { images };
    }
  );
}
