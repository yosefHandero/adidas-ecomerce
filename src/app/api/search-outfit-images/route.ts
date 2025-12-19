import { NextRequest, NextResponse } from 'next/server';
import { searchOutfitImages, searchPexelsImages, type OutfitImage } from '@/lib/imageSearch';
import { SearchOutfitImagesRequestSchema, type ApiErrorResponse, type SearchOutfitImagesResponse } from '@/lib/validation';
import { rateLimit, getClientIP } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 20 requests per minute per IP
    const clientIP = getClientIP(request);
    const rateLimitResult = rateLimit(clientIP, 20, 60 * 1000);
    if (!rateLimitResult.allowed) {
      const errorResponse: ApiErrorResponse = {
        error: `Too many requests. Please try again in ${rateLimitResult.retryAfter} second${rateLimitResult.retryAfter !== 1 ? 's' : ''}.`,
        code: 'RATE_LIMITED',
      };
      return NextResponse.json(errorResponse, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '20',
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
    const validationResult = SearchOutfitImagesRequestSchema.safeParse(body);
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

    const { variation, count } = validationResult.data;

    // Validate query length to prevent abuse
    const searchQuery = variation.items
      .map(item => item.description)
      .join(' ');
    
    if (searchQuery.length > 500) {
      const errorResponse: ApiErrorResponse = {
        error: 'Search query too long',
        code: 'QUERY_TOO_LONG',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Try Pexels first, then fallback to Unsplash
    let images: OutfitImage[] = [];
    try {
      images = await searchPexelsImages(variation, count);
    } catch (pexelsError) {
      console.warn('Pexels search failed, falling back to Unsplash:', pexelsError);
      try {
        images = await searchOutfitImages(variation, count);
      } catch (unsplashError) {
        console.error('Both image search services failed:', unsplashError);
        // Return empty array instead of error for graceful degradation
        images = [];
      }
    }

    const response: SearchOutfitImagesResponse = { images };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Image search API error:', error);

    const errorResponse: ApiErrorResponse = {
      error: 'Failed to search images',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

