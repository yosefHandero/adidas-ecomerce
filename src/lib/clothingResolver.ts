/**
 * Map parsed outfit text items to catalog entries. Returns resolved wears (with tint) and unmatched labels.
 */

import type { ClothingItem, ClothingZone, ClothingTransform } from "./clothingCatalog";
import type { ParsedItem } from "./outfitParser";
import { colorNameToHex } from "./colorMap";

export interface ResolvedWear {
  id: string;
  url: string;
  zone: ClothingZone;
  transform: ClothingTransform;
  tintHex?: string;
}

export interface ResolveResult {
  resolved: ResolvedWear[];
  unmatched: string[];
}

function typeToKeywords(type: string): string[] {
  return type
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function scoreMatch(parsedKeywords: string[], catalogItem: ClothingItem): number {
  let score = 0;
  const catKw = catalogItem.keywords.map((k) => k.toLowerCase());
  for (const pk of parsedKeywords) {
    if (catKw.some((ck) => ck === pk || ck.includes(pk) || pk.includes(ck))) score += 1;
  }
  return score;
}

function findBestCatalogItem(
  parsed: ParsedItem,
  catalog: readonly ClothingItem[],
): ClothingItem | null {
  const parsedKeywords = typeToKeywords(parsed.type);
  if (parsedKeywords.length === 0) return null;

  const zoneFiltered =
    parsed.zone != null
      ? catalog.filter((c) => c.zone === parsed.zone)
      : [...catalog];

  let best: { item: ClothingItem; score: number } | null = null;

  for (const item of zoneFiltered) {
    const score = scoreMatch(parsedKeywords, item);
    if (score > 0 && (best === null || score > best.score)) {
      best = { item, score };
    }
  }

  return best?.item ?? null;
}

/**
 * Resolve parsed outfit items to catalog wears. Uses keyword overlap and optional zone.
 * Unmatched parsed types are listed in result.unmatched.
 */
export function resolveParsedItemsToCatalog(
  parsedItems: ParsedItem[],
  catalog: readonly ClothingItem[],
): ResolveResult {
  const resolved: ResolvedWear[] = [];
  const unmatched: string[] = [];
  const usedIds = new Set<string>();

  for (const parsed of parsedItems) {
    const catalogItem = findBestCatalogItem(parsed, catalog);
    if (!catalogItem) {
      unmatched.push(parsed.type);
      continue;
    }
    if (usedIds.has(catalogItem.id)) continue;
    usedIds.add(catalogItem.id);

    const tintHex =
      catalogItem.supportsTint && parsed.color
        ? colorNameToHex(parsed.color)
        : undefined;

    resolved.push({
      id: catalogItem.id,
      url: catalogItem.url,
      zone: catalogItem.zone,
      transform: catalogItem.transform,
      ...(tintHex && { tintHex }),
    });
  }

  return { resolved, unmatched };
}
