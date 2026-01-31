// Single source of truth for domain enums (used by both TS types and Zod schemas)
export const OCCASIONS = ["Street", "Work", "Gym", "Date", "Travel"] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const FITS = ["Slim", "Regular", "Oversized"] as const;
export type Fit = (typeof FITS)[number];

export const WEATHERS = ["Warm", "Cold", "Rain"] as const;
export type Weather = (typeof WEATHERS)[number];

export const BUDGETS = ["$", "$$", "$$$"] as const;
export type Budget = (typeof BUDGETS)[number];

export const VARIATION_NAMES = ["Minimal", "Street", "Elevated"] as const;
export type VariationName = (typeof VARIATION_NAMES)[number];

export const BODY_ZONES = ["head", "torso", "legs", "feet", "accessories"] as const;
export type BodyZone = (typeof BODY_ZONES)[number];

export interface UserItem {
  id: string;
  description: string;
  imageUrl?: string;
}

export interface OutfitItem {
  item_type: string;
  description: string;
  color: string;
  material?: string;
  style_tags: string[];
  why_it_matches: string;
  body_zone: BodyZone;
}

export interface OutfitVariation {
  name: VariationName;
  suggestion: string;
  /** Man-specific suggestion; falls back to `suggestion` when absent */
  suggestion_man?: string;
  /** Woman-specific suggestion; falls back to `suggestion` when absent */
  suggestion_woman?: string;
  items: OutfitItem[];
  color_palette: string[];
  styling_tips: string[];
  /** Man-specific tips; falls back to `styling_tips` when absent */
  styling_tips_man?: string[];
  /** Woman-specific tips; falls back to `styling_tips` when absent */
  styling_tips_woman?: string[];
}

export interface OutfitResponse {
  variations: OutfitVariation[];
}

export interface OutfitPreferences {
  occasion: Occasion;
  vibe: number; // 0-100 (Minimal ↔ Bold)
  fit: Fit;
  weather: Weather;
  budget: Budget;
}
