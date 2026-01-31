import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit, getClientIP } from '../rate-limit/rate-limiter';
import {
  createErrorResponse,
  createSuccessResponse,
  ErrorCode,
  getHttpStatusForErrorCode,
  type ApiResponse,
} from '@/lib/errors';
import { logger } from '../logger/logger';

/**
 * Configuration for API handler wrapper
 */
export interface HandlerConfig {
  /** Zod schema for request body validation */
  schema?: z.ZodSchema;
  /** Rate limit: max requests per window */
  rateLimitMax?: number;
  /** Rate limit: time window in milliseconds */
  rateLimitWindowMs?: number;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Custom error handler - return undefined to use default error handling */
  onError?: (error: unknown) => ApiResponse<never> | undefined;
}

/**
 * Generate a unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
function createTimeout(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);
  });
}


export async function handlerWrapper<TInput, TOutput>(
  request: NextRequest,
  config: HandlerConfig,
  handler: (data: TInput) => Promise<TOutput>
): Promise<NextResponse<ApiResponse<TOutput>>> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 1. Rate limiting
    if (config.rateLimitMax !== undefined) {
      const clientIP = getClientIP(request);
      const rateLimitResult = rateLimit(
        clientIP,
        config.rateLimitMax,
        config.rateLimitWindowMs || 60 * 1000
      );

      if (!rateLimitResult.allowed) {
        logger.warn('Rate limit exceeded', {
          requestId,
          clientIP,
          retryAfter: rateLimitResult.retryAfter,
        });

        const errorResponse = createErrorResponse(
          ErrorCode.RATE_LIMITED,
          `Rate limit exceeded. Please try again in ${rateLimitResult.retryAfter} second${rateLimitResult.retryAfter !== 1 ? 's' : ''}.`,
          {
            retryAfter: rateLimitResult.retryAfter,
            requestId,
          }
        );

        return NextResponse.json(errorResponse, {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(config.rateLimitMax),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
            'Retry-After': String(rateLimitResult.retryAfter || 60),
          },
        });
      }
    }

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const errorResponse = createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Invalid JSON in request body',
        { requestId }
      );
      return NextResponse.json(errorResponse, {
        status: 400,
      });
    }

    // 3. Validate with Zod schema
    if (config.schema) {
      const validationResult = config.schema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        const errorMessage = firstError
          ? `${firstError.path.join('.')}: ${firstError.message}`
          : 'Invalid request data';

        logger.warn('Validation error', {
          requestId,
          errors: validationResult.error.issues,
        });

        const errorResponse = createErrorResponse(
          ErrorCode.VALIDATION_ERROR,
          errorMessage,
          {
            details: validationResult.error.issues,
            requestId,
          }
        );
        return NextResponse.json(errorResponse, {
          status: 400,
        });
      }

      // 4. Execute handler with timeout
      const validatedData = validationResult.data as TInput;
      const timeoutMs = config.timeoutMs || 60000; // Default 60s

      let result: TOutput;
      try {
        if (timeoutMs > 0) {
          result = await Promise.race([
            handler(validatedData),
            createTimeout(timeoutMs),
          ]);
        } else {
          result = await handler(validatedData);
        }
      } catch (timeoutError) {
        if (timeoutError instanceof Error && timeoutError.message === 'Request timeout') {
          logger.error('Request timeout', {
            requestId,
            timeoutMs,
          });

          const errorResponse = createErrorResponse(
            ErrorCode.TIMEOUT,
            `Request timed out after ${timeoutMs}ms`,
            { requestId }
          );
          return NextResponse.json(errorResponse, {
            status: 503,
          });
        }
        throw timeoutError; // Re-throw if not a timeout
      }

      // 5. Return success response
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        requestId,
        duration,
        method: request.method,
        path: request.nextUrl.pathname,
      });

      const successResponse = createSuccessResponse(result, {
        duration,
        requestId,
      });

      return NextResponse.json(successResponse);
    } else {
      // No schema validation, execute handler with timeout protection
      const timeoutMs = config.timeoutMs || 60000; // Default 60s

      let result: TOutput;
      try {
        if (timeoutMs > 0) {
          result = await Promise.race([
            handler(body as TInput),
            createTimeout(timeoutMs),
          ]);
        } else {
          result = await handler(body as TInput);
        }
      } catch (timeoutError) {
        if (timeoutError instanceof Error && timeoutError.message === 'Request timeout') {
          logger.error('Request timeout', {
            requestId,
            timeoutMs,
          });

          const errorResponse = createErrorResponse(
            ErrorCode.TIMEOUT,
            `Request timed out after ${timeoutMs}ms`,
            { requestId }
          );
          return NextResponse.json(errorResponse, {
            status: 503,
          });
        }
        throw timeoutError; // Re-throw if not a timeout
      }

      const duration = Date.now() - startTime;
      const successResponse = createSuccessResponse(result, {
        duration,
        requestId,
      });

      return NextResponse.json(successResponse);
    }
  } catch (error) {
    // 6. Handle errors
    logger.error('Handler error', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Use custom error handler if provided
    if (config.onError) {
      const errorResponse = config.onError(error);
      // If onError returns undefined, fall through to default error handling
      if (errorResponse && !errorResponse.success) {
        const status = getHttpStatusForErrorCode(errorResponse.error.code);
        return NextResponse.json(errorResponse, { status });
      }
    }

    // Default error mapping
    let errorCode = ErrorCode.INTERNAL_ERROR;
    let message = 'An unexpected error occurred';
    let status = 500;

    if (error instanceof Error) {
      // Map known error messages to error codes
      // Check for query length errors first (validation error - 400)
      if (error.message.includes('query too long') || error.message.includes('QUERY_TOO_LONG') ||
          error.message.includes('Search query too long')) {
        errorCode = ErrorCode.QUERY_TOO_LONG;
        message = error.message || 'Search query is too long. Please reduce the length.';
        status = 400;
      } else if (error.message.includes('API key') || error.message.includes('not configured') ||
          error.message.includes('HUGGING_FACE_API_KEY') || error.message.includes('HUGGINGFACE_API_KEY')) {
        errorCode = ErrorCode.CONFIG_ERROR;
        message = 'AI service is not properly configured. Please check your HUGGING_FACE_API_KEY.';
        status = 500;
      } else if (error.message.includes('Invalid AI response format') || error.message.includes('JSON')) {
        errorCode = ErrorCode.INVALID_RESPONSE;
        message = 'AI service returned invalid response. Please try again.';
        status = 500;
      } else if (error.message.includes('quota') || error.message.includes('Quota exceeded') ||
                 error.message.includes('rate limit') || error.message.includes('429')) {
        errorCode = ErrorCode.QUOTA_EXCEEDED;
        message = 'AI service quota exceeded. Please check your API billing or try again later.';
        status = 503;
      } else if (error.message.includes('fetch') || error.message.includes('timeout') ||
                 error.message.includes('aborted') || error.message.includes('network')) {
        errorCode = ErrorCode.NETWORK_ERROR;
        message = 'Network error. Please check your connection and try again.';
        status = 503;
      } else if (process.env.NODE_ENV === 'development') {
        // In development, include more details
        message = `Failed: ${error.message}`;
      }
    }

    const errorResponse = createErrorResponse(errorCode, message, {
      details: process.env.NODE_ENV === 'development' ? error : undefined,
      requestId,
    });

    return NextResponse.json(errorResponse, { status });
  }
}
