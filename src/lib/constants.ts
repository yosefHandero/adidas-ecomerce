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
