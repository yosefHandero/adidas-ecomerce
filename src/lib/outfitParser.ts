/**
 * Parse free-form outfit text into structured items (type, color?, zone?).
 * Deterministic, no AI. Used for "Apply to mannequin" flow.
 */

import type { ClothingZone } from "./clothingCatalog";

export interface ParsedItem {
  type: string;
  color?: string;
  zone?: ClothingZone;
}

const COLORS = new Set([
  "green",
  "yellow",
  "red",
  "blue",
  "black",
  "white",
  "gray",
  "grey",
  "brown",
  "purple",
  "pink",
  "orange",
  "navy",
  "beige",
  "olive",
  "tan",
  "cream",
]);

const ZONE_KEYWORDS: Record<ClothingZone, string[]> = {
  head: ["hat", "cap", "beanie"],
  torso: ["shirt", "t-shirt", "tee", "jacket", "hoodie", "coat"],
  legs: ["pants", "jeans", "shorts"],
  feet: ["shoes", "sneakers", "boots", "socks"],
};

function findColor(words: string[]): string | undefined {
  for (const w of words) {
    const lower = w.toLowerCase();
    if (COLORS.has(lower)) return lower;
  }
  return undefined;
}

function findZone(words: string[]): ClothingZone | undefined {
  const joined = words.join(" ").toLowerCase();
  for (const [zone, keywords] of Object.entries(ZONE_KEYWORDS)) {
    for (const kw of keywords) {
      if (joined.includes(kw)) return zone as ClothingZone;
    }
  }
  return undefined;
}

function extractType(words: string[]): string {
  const skip = new Set(["a", "an", "the", "with", "and"]);
  const filtered = words.filter((w) => !skip.has(w.toLowerCase()) && !COLORS.has(w.toLowerCase()));
  return filtered.join(" ").trim() || words.join(" ").trim();
}

/**
 * Split input by comma and " and ", then parse each segment into a ParsedItem.
 */
export function parseOutfitText(input: string): ParsedItem[] {
  if (!input || typeof input !== "string") return [];

  const raw = input
    .split(/,\s*|\s+and\s+|\s+with\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const result: ParsedItem[] = [];

  for (const segment of raw) {
    const words = segment.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    const color = findColor(words);
    const zone = findZone(words);
    const type = extractType(words);
    if (!type) continue;

    result.push({ type, color, zone });
  }

  return result;
}
