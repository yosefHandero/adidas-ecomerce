/**
 * Shared constants for fashion-related attribute extraction
 * Used across imageSearch and ai modules
 */

/**
 * Common color words for fashion item matching
 */
export const COLOR_WORDS = [
  "yellow",
  "red",
  "blue",
  "green",
  "black",
  "white",
  "gray",
  "grey",
  "brown",
  "pink",
  "purple",
  "orange",
  "beige",
  "navy",
  "maroon",
  "burgundy",
  "olive",
  "tan",
  "cream",
  "ivory",
  "silver",
  "gold",
  "bronze",
  "teal",
  "cyan",
  "magenta",
  "violet",
  "indigo",
  "coral",
  "salmon",
  "turquoise",
  "khaki",
  "charcoal",
  "slate",
  "peach",
  "lavender",
  "mint",
  "amber",
  "rust",
  "emerald",
  "sapphire",
  "ruby",
  "copper",
  "plum",
] as const;

/**
 * Common item type words for fashion item matching
 */
export const ITEM_TYPE_WORDS = [
  "pants",
  "trousers",
  "jeans",
  "shorts",
  "jacket",
  "blazer",
  "coat",
  "shirt",
  "top",
  "t-shirt",
  "tee",
  "sweater",
  "hoodie",
  "cardigan",
  "dress",
  "skirt",
  "shoes",
  "sneakers",
  "boots",
  "heels",
  "sandals",
  "hat",
  "cap",
  "beanie",
  "scarf",
  "bag",
  "backpack",
  "belt",
  "watch",
  "jewelry",
  "glasses",
  "sunglasses",
] as const;

/**
 * Common stop words to filter out from search queries
 */
export const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "with",
  "for",
  "on",
  "at",
  "to",
  "from",
  "by",
  "in",
  "of",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "should",
  "could",
  "may",
  "might",
  "must",
  "can",
  "this",
  "that",
  "these",
  "those",
  "pair",
  "pairs",
]);

/**
 * Style context mappings for variation names
 * Used in image search so Street vs Elevated get context-specific imagery
 */
export const STYLE_CONTEXT: Record<
  "Minimal" | "Street" | "Elevated" | "default",
  string
> = {
  Minimal: "minimalist clean simple neutral colors monochrome",
  Street: "street style urban casual edgy streetwear sneakers",
  Elevated: "elevated sophisticated refined elegant luxury editorial",
  default: "fashion outfit",
};

/**
 * Fallback queries for different variation styles
 */
export const FALLBACK_QUERIES = {
  Minimal: {
    man: "minimalist outfit man neutral colors",
    woman: "minimalist outfit woman neutral colors",
  },
  Street: {
    man: "street style outfit man urban casual",
    woman: "street style outfit woman urban casual",
  },
  Elevated: {
    man: "elevated outfit man sophisticated",
    woman: "elevated outfit woman sophisticated",
  },
  default: {
    man: "fashion outfit man",
    woman: "fashion outfit woman",
  },
} as const;

/**
 * Zone overlay boxes for mannequin dressing (% values relative to wrapper).
 * Aligns with base mannequin PNG (head, torso, legs, feet).
 */
export type ZoneOverlayBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export const ZONE_OVERLAY_BOXES: Record<
  "head" | "torso" | "legs" | "feet",
  ZoneOverlayBox
> = {
  head: { top: 2, left: 36, width: 28, height: 18 },
  torso: { top: 20, left: 22, width: 56, height: 32 },
  legs: { top: 52, left: 28, width: 44, height: 36 },
  feet: { top: 88, left: 30, width: 40, height: 14 },
};

/** Chip stack anchor per zone (%): position of the chip stack to the right of each zone */
export const ZONE_CHIP_STACK_ANCHOR: Record<
  "head" | "torso" | "legs" | "feet" | "accessories",
  { left: number; top: number }
> = {
  head: { left: 68, top: 4 },
  torso: { left: 82, top: 26 },
  legs: { left: 76, top: 58 },
  feet: { left: 74, top: 90 },
  accessories: { left: 78, top: 26 },
};

/**
 * Inpainting mask paths (public URLs).
 * White = modifiable (clothing: head/torso/feet); black = protected.
 * Regenerate with: npm run generate-masks
 */
export const MANNEQUIN_MASK_PATHS = {
  man: "/man_base_mask.png",
  woman: "/woman_base_mask.png",
} as const;
