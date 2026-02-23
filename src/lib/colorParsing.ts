/**
 * Client-only color parsing from item descriptions.
 * No server calls. Used for mannequin zone overlay colors.
 */

import type { ColorConfidence } from "./types";

export type { ColorConfidence };

export interface ParseColorResult {
  color: string;
  confidence: ColorConfidence;
}

/** Multi-word color phrases (checked first, case-insensitive) */
const MULTI_WORD_COLORS: Array<{ phrase: string; color: string }> = [
  { phrase: "light blue", color: "#87CEEB" },
  { phrase: "dark blue", color: "#00008B" },
  { phrase: "navy blue", color: "#000080" },
  { phrase: "off white", color: "#FAF9F6" },
  { phrase: "off-white", color: "#FAF9F6" },
  { phrase: "dark gray", color: "#5a5a5a" },
  { phrase: "dark grey", color: "#5a5a5a" },
  { phrase: "light gray", color: "#d3d3d3" },
  { phrase: "light grey", color: "#d3d3d3" },
  { phrase: "light pink", color: "#FFB6C1" },
  { phrase: "hot pink", color: "#FF69B4" },
  { phrase: "forest green", color: "#228B22" },
  { phrase: "olive green", color: "#6B8E23" },
  { phrase: "royal blue", color: "#4169E1" },
  { phrase: "sky blue", color: "#87CEEB" },
  { phrase: "blood red", color: "#8B0000" },
  { phrase: "burgundy red", color: "#800020" },
];

/** Single-word color to CSS (hex or named) */
const COLOR_TO_CSS: Record<string, string> = {
  yellow: "#FBBF24",
  red: "#DC2626",
  blue: "#2563EB",
  green: "#16A34A",
  black: "#171717",
  white: "#F5F5F5",
  gray: "#6B7280",
  grey: "#6B7280",
  brown: "#78350F",
  pink: "#EC4899",
  purple: "#7C3AED",
  orange: "#EA580C",
  beige: "#D4B896",
  navy: "#000080",
  maroon: "#800000",
  burgundy: "#800020",
  olive: "#6B8E23",
  tan: "#D2B48C",
  cream: "#FFFDD0",
  ivory: "#FFFFF0",
  silver: "#C0C0C0",
  gold: "#FFD700",
  bronze: "#CD7F32",
  teal: "#0D9488",
  cyan: "#06B6D4",
  magenta: "#D946EF",
  violet: "#8B5CF6",
  indigo: "#4F46E5",
  coral: "#F97316",
  salmon: "#F97316",
  turquoise: "#14B8A6",
  khaki: "#C3B091",
  charcoal: "#36454F",
  slate: "#64748B",
  peach: "#FFCBA4",
  lavender: "#E6E6FA",
  mint: "#98FF98",
  amber: "#F59E0B",
  rust: "#B7410E",
  emerald: "#059669",
  sapphire: "#0F52BA",
  ruby: "#E0115F",
  copper: "#B87333",
  plum: "#8E4585",
};

/** Synonyms: map to canonical color key used in COLOR_TO_CSS */
const COLOR_SYNONYMS: Record<string, string> = {
  navy: "navy",
  "dark blue": "navy",
  cream: "cream",
  ivory: "ivory",
  "off white": "cream",
  "off-white": "cream",
  charcoal: "gray",
  slate: "gray",
  grey: "gray",
};

/** Item-type keyword -> implied color when no color word found */
const IMPLIED_COLOR_BY_ITEM: Record<string, string> = {
  denim: "#2563EB",
  jean: "#2563EB",
  leather: "#78350F",
  "leather jacket": "#78350F",
  camo: "#4D5D53",
  camouflage: "#4D5D53",
};

const NEUTRAL_LOW_CONFIDENCE = "#9CA3AF"; // gray-400

/**
 * Parse a color from an item description (client-only).
 * Multi-word phrases first, then single words with synonyms, then implied by item type.
 */
export function parseColorFromDescription(
  description: string
): ParseColorResult {
  const desc = description.toLowerCase().trim();
  if (!desc) {
    return { color: NEUTRAL_LOW_CONFIDENCE, confidence: "low" };
  }

  // 1. Multi-word phrases first (high confidence)
  for (const { phrase, color } of MULTI_WORD_COLORS) {
    if (desc.includes(phrase)) {
      return { color, confidence: "high" };
    }
  }

  // 2. Single-word colors (and synonyms via COLOR_TO_CSS keys)
  for (const [word, css] of Object.entries(COLOR_TO_CSS)) {
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(desc)) {
      return { color: css, confidence: "high" };
    }
  }

  // 3. Synonym mapping: try known synonyms that might appear as words
  for (const [syn, canonical] of Object.entries(COLOR_SYNONYMS)) {
    const re = new RegExp(`\\b${syn.replace(/\\s/g, "\\s")}\\b`, "i");
    if (re.test(desc)) {
      const color = COLOR_TO_CSS[canonical] ?? NEUTRAL_LOW_CONFIDENCE;
      return { color, confidence: "high" };
    }
  }

  // 4. Implied by item type (medium confidence)
  for (const [keyword, color] of Object.entries(IMPLIED_COLOR_BY_ITEM)) {
    if (desc.includes(keyword)) {
      return { color, confidence: "high" };
    }
  }

  return { color: NEUTRAL_LOW_CONFIDENCE, confidence: "low" };
}
