import { z } from "zod";
import {
  BODY_ZONES,
  BUDGETS,
  FITS,
  OCCASIONS,
  VARIATION_NAMES,
  WEATHERS,
} from "./types";

// Custom validator for image URLs that accepts both regular URLs and data URLs
// FileReader.readAsDataURL() produces: data:image/[type];base64,[base64-data]
const imageUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val === "") return true; // Empty is allowed (optional field)

      // Check if it's a data URL (data:image/...)
      if (val.startsWith("data:image/")) {
        // Validate data URL format: data:image/[type];base64,[base64-data]
        // FileReader always produces this exact format, but we allow some variations
        // Pattern: data:image/[type];base64,[data] or data:image/[type];charset=...;base64,[data]
        const dataUrlPattern =
          /^data:image\/[a-zA-Z0-9+]+(;[^;]+)*;base64,[A-Za-z0-9+/=\s]+$/;
        return dataUrlPattern.test(val);
      }

      // Check if it's a valid URL (http, https, blob, or data)
      try {
        const url = new URL(val);
        // Allow common URL schemes for images
        return ["http:", "https:", "data:", "blob:"].includes(url.protocol);
      } catch {
        return false;
      }
    },
    {
      message:
        "Invalid image URL. Must be a valid URL (http/https) or data URL (data:image/...)",
    }
  )
  .optional()
  .or(z.literal(""));

// Validation schemas for API routes
export const UserItemSchema = z.object({
  id: z.string().min(1, "ID is required"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description too long"),
  imageUrl: imageUrlSchema,
});

export const OutfitPreferencesSchema = z.object({
  occasion: z.enum(OCCASIONS),
  vibe: z.number().int().min(0).max(100),
  fit: z.enum(FITS),
  weather: z.enum(WEATHERS),
  budget: z.enum(BUDGETS),
});

export const GenerateOutfitRequestSchema = z.object({
  userItems: z
    .array(UserItemSchema)
    .min(1, "At least one item is required")
    .max(20, "Too many items"),
  preferences: OutfitPreferencesSchema,
});

export const OutfitVariationSchema = z.object({
  name: z.enum(VARIATION_NAMES),
  suggestion: z.string(),
  suggestion_man: z.string().optional(),
  suggestion_woman: z.string().optional(),
  items: z.array(
    z.object({
      item_type: z.string(),
      description: z.string(),
      color: z.string(),
      material: z.string().optional(),
      style_tags: z.array(z.string()),
      why_it_matches: z.string(),
      body_zone: z.enum(BODY_ZONES),
    })
  ),
  color_palette: z.array(z.string()),
  styling_tips: z.array(z.string()),
  styling_tips_man: z.array(z.string()).optional(),
  styling_tips_woman: z.array(z.string()).optional(),
});

export const SearchOutfitImagesRequestSchema = z.object({
  variation: OutfitVariationSchema,
  count: z.number().int().min(1).max(10).optional().default(3),
  userItems: z.array(UserItemSchema).optional(), // Optional: for strict attribute matching
});

export const SearchSuggestionImagesRequestSchema = z.object({
  suggestion: z
    .string()
    .min(1, "Suggestion is required")
    .max(1000, "Suggestion text too long"),
  variationName: z.enum(VARIATION_NAMES).optional(),
  colorPalette: z.array(z.string()).optional(),
  userItems: z.array(UserItemSchema).optional(), // Optional: for strict attribute matching
});
