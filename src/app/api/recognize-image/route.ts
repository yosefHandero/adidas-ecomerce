import { NextRequest } from "next/server";
import { recognizeClothingItem } from "@/lib/imageRecognition";
import { handlerWrapper } from "@/server/api/handler-wrapper";
import { z } from "zod";
import { logger } from "@/server/logger/logger";

const RecognizeImageRequestSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
});

type RecognizeImageRequest = z.infer<typeof RecognizeImageRequestSchema>;

export async function POST(request: NextRequest) {
  return handlerWrapper<RecognizeImageRequest, { result: { itemType: string; description: string; bodyZone: string; color?: string } }>(
    request,
    {
      schema: RecognizeImageRequestSchema,
      rateLimitMax: 20,
      rateLimitWindowMs: 60 * 1000, // 1 minute
      timeoutMs: 15000, // 15 seconds for image recognition
    },
    async (data) => {
      const { imageUrl } = data;

      // #region agent log
      try {
        const { appendFileSync } = await import('fs');
        const { join } = await import('path');
        const logPath = join(process.cwd(), '.cursor', 'debug.log');
        appendFileSync(logPath, JSON.stringify({ location: 'route.ts:23', message: 'API route called', data: { imageUrlLength: imageUrl.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) + '\n', { flag: 'a' });
      } catch (e) {
        console.error('[DEBUG LOG ERROR]', e);
      }
      // #endregion

      try {
        const result = await recognizeClothingItem(imageUrl);

        logger.debug("Image recognition result", {
          itemType: result.itemType,
          bodyZone: result.bodyZone,
        });

        return {
          result: {
            itemType: result.itemType,
            description: result.description,
            bodyZone: result.bodyZone,
            color: result.color,
          },
        };
      } catch (error) {
        logger.error("Image recognition failed", {
          error: error instanceof Error ? error.message : String(error),
        });

        // Return fallback result instead of throwing
        return {
          result: {
            itemType: "clothing item",
            description: "clothing item",
            bodyZone: "torso",
          },
        };
      }
    }
  );
}
