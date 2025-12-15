import { NextRequest, NextResponse } from 'next/server';
import { searchOutfitImages, searchPexelsImages, type OutfitImage } from '@/lib/imageSearch';
import { SearchOutfitImagesRequestSchema, type ApiErrorResponse, type SearchOutfitImagesResponse } from '@/lib/validation';

// Rate limiting: simple in-memory store (for production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      const errorResponse: ApiErrorResponse = {
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      };
      return NextResponse.json(errorResponse, { status: 429 });
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
      .map(item => item.shopping_search_terms || item.description)
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

