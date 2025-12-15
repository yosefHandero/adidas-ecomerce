import { NextRequest, NextResponse } from 'next/server';
import { generateOutfit } from '@/lib/ai';
import { GenerateOutfitRequestSchema, type ApiErrorResponse, type GenerateOutfitResponse } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ApiErrorResponse = { error: 'Invalid JSON in request body' };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate with zod schema
    const validationResult = GenerateOutfitRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invalid request data',
        code: 'VALIDATION_ERROR',
      };
      // Include first validation error message
      const firstError = validationResult.error.issues[0];
      if (firstError) {
        errorResponse.error = `${firstError.path.join('.')}: ${firstError.message}`;
      }
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { userItems, preferences } = validationResult.data;

    // Generate outfit using AI service
    const result = await generateOutfit(userItems, preferences);

    const response: GenerateOutfitResponse = {
      variations: result.variations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate outfit API error:', error);

    // Don't leak internal error details
    const errorResponse: ApiErrorResponse = {
      error: 'Failed to generate outfit',
    };

    // Only include specific error codes for known issues
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('not configured')) {
        errorResponse.error = 'AI service configuration error';
        errorResponse.code = 'CONFIG_ERROR';
        return NextResponse.json(errorResponse, { status: 500 });
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        errorResponse.error = 'AI service quota exceeded';
        errorResponse.code = 'QUOTA_EXCEEDED';
        return NextResponse.json(errorResponse, { status: 503 });
      }
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

