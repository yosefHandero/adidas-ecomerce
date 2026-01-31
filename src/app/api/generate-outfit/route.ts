import { NextRequest } from 'next/server';
import { handlerWrapper } from '@/server/api/handler-wrapper';
import { GenerateOutfitRequestSchema } from '@/lib/validation';
import { z } from 'zod';
import { generateOutfit } from '@/lib/ai';
import { logger } from '@/server/logger/logger';
import type { OutfitVariation } from '@/lib/types';

type GenerateOutfitRequest = z.infer<typeof GenerateOutfitRequestSchema>;

export async function POST(request: NextRequest) {
  return handlerWrapper<GenerateOutfitRequest, { variations: OutfitVariation[] }>(
    request,
    {
      schema: GenerateOutfitRequestSchema,
      rateLimitMax: 10,
      rateLimitWindowMs: 60 * 1000, // 1 minute
      timeoutMs: 60000, // 60 seconds for AI calls
    },
    async (data) => {
      // Log environment variable status in development
      if (process.env.NODE_ENV === 'development') {
        const hasHF = !!(process.env.HUGGING_FACE_API_KEY?.trim() || process.env.HUGGINGFACE_API_KEY?.trim());
        const hfKey = process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY;
        logger.debug('Environment check', {
          hasHuggingFace: hasHF,
          hfKeyLength: hfKey?.length || 0,
        });
      }

      const result = await generateOutfit(data.userItems, data.preferences);

      return {
        variations: result.variations,
      };
    }
  );
}
