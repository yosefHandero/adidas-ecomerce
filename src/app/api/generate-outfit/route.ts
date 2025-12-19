import { NextRequest, NextResponse } from 'next/server';
import { generateOutfit } from '@/lib/ai';
import { GenerateOutfitRequestSchema, type ApiErrorResponse, type GenerateOutfitResponse } from '@/lib/validation';
import { rateLimit, getClientIP } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting: 10 requests per minute per IP
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(clientIP, 10, 60 * 1000);
    if (!rateLimitResult.allowed) {
      const errorResponse: ApiErrorResponse = {
        error: `Rate limit exceeded. Please try again in ${rateLimitResult.retryAfter} second${rateLimitResult.retryAfter !== 1 ? 's' : ''}.`,
        code: 'RATE_LIMITED',
      };
      return NextResponse.json(errorResponse, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
          'Retry-After': String(rateLimitResult.retryAfter || 60),
        },
      });
    }

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
      const firstError = validationResult.error.issues[0];
      if (firstError) {
        errorResponse.error = `${firstError.path.join('.')}: ${firstError.message}`;
      }
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { userItems, preferences } = validationResult.data;

    // Generate outfit using AI service
    // Log environment variable status in development for debugging
    if (process.env.NODE_ENV === 'development') {
      const hasHF = !!(process.env.HUGGING_FACE_API_KEY?.trim() || process.env.HUGGINGFACE_API_KEY?.trim());
      const hfKey = process.env.HUGGING_FACE_API_KEY || process.env.HUGGINGFACE_API_KEY;
      console.log('[API] Environment check:', {
        hasHuggingFace: hasHF,
        hfKeyLength: hfKey?.length || 0,
      });
    }
    
    const result = await generateOutfit(userItems, preferences);

    const response: GenerateOutfitResponse = {
      variations: result.variations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate outfit API error:', error);

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to generate outfit',
    };

    if (error instanceof Error) {
      // Check for API key/configuration errors
      if (error.message.includes('API key') || error.message.includes('not configured') || 
          error.message.includes('HUGGING_FACE_API_KEY') || error.message.includes('HUGGINGFACE_API_KEY')) {
        errorResponse.error = 'AI service is not properly configured. Please check your HUGGING_FACE_API_KEY.';
        errorResponse.code = 'CONFIG_ERROR';
        return NextResponse.json(errorResponse, { status: 500 });
      }

      // Check for JSON parsing errors
      if (error.message.includes('Invalid AI response format') || error.message.includes('JSON')) {
        errorResponse.error = 'AI service returned invalid response. Please try again.';
        errorResponse.code = 'INVALID_RESPONSE';
        return NextResponse.json(errorResponse, { status: 500 });
      }

      // Check for quota/rate limit errors
      if (error.message.includes('quota') || error.message.includes('Quota exceeded') || 
          error.message.includes('rate limit') || error.message.includes('429')) {
        errorResponse.error = 'AI service quota exceeded. Please check your API billing or try again later.';
        errorResponse.code = 'QUOTA_EXCEEDED';
        return NextResponse.json(errorResponse, { status: 429 });
      }

      // Check for network/timeout errors
      if (error.message.includes('fetch') || error.message.includes('timeout') || 
          error.message.includes('aborted')) {
        errorResponse.error = 'Network error. Please check your connection and try again.';
        errorResponse.code = 'NETWORK_ERROR';
        return NextResponse.json(errorResponse, { status: 503 });
      }

      // Check for "no providers available" errors
      if (error.message.includes('HUGGING_FACE_API_KEY not configured') || error.message.includes('HUGGINGFACE_API_KEY not configured')) {
        errorResponse.error = 'Hugging Face API key is not configured. Please set HUGGING_FACE_API_KEY in your environment variables.';
        errorResponse.code = 'NO_PROVIDERS';
        return NextResponse.json(errorResponse, { status: 500 });
      }

      // For development, include more details in the error message
      if (process.env.NODE_ENV === 'development') {
        errorResponse.error = `Failed to generate outfit: ${error.message}`;
      }
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
