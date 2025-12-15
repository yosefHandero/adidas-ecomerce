import { z } from 'zod';

// Validation schemas for API routes
export const UserItemSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export const OutfitPreferencesSchema = z.object({
  occasion: z.enum(['Street', 'Work', 'Gym', 'Date', 'Travel']),
  vibe: z.number().int().min(0).max(100),
  fit: z.enum(['Slim', 'Regular', 'Oversized']),
  weather: z.enum(['Warm', 'Cold', 'Rain']),
  budget: z.enum(['$', '$$', '$$$']),
});

export const GenerateOutfitRequestSchema = z.object({
  userItems: z.array(UserItemSchema).min(1, 'At least one item is required').max(20, 'Too many items'),
  preferences: OutfitPreferencesSchema,
});

export const OutfitVariationSchema = z.object({
  name: z.enum(['Minimal', 'Street', 'Elevated']),
  items: z.array(z.object({
    item_type: z.string(),
    description: z.string(),
    color: z.string(),
    material: z.string().optional(),
    style_tags: z.array(z.string()),
    why_it_matches: z.string(),
    shopping_search_terms: z.string(),
    body_zone: z.enum(['head', 'torso', 'legs', 'feet', 'accessories']),
  })),
  color_palette: z.array(z.string()),
  styling_notes: z.object({
    do: z.array(z.string()),
    dont: z.array(z.string()),
  }),
});

export const SearchOutfitImagesRequestSchema = z.object({
  variation: OutfitVariationSchema,
  count: z.number().int().min(1).max(10).optional().default(3),
});

// Response types
export interface ApiErrorResponse {
  error: string;
  code?: string;
}

export interface GenerateOutfitResponse {
  variations: z.infer<typeof OutfitVariationSchema>[];
}

export interface SearchOutfitImagesResponse {
  images: Array<{
    id: string;
    url: string;
    thumbnail: string;
    photographer?: string;
    photographerUrl?: string;
    description?: string;
  }>;
}
