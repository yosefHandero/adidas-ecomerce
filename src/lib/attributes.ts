import { UserItem } from "./types";
import { COLOR_WORDS, ITEM_TYPE_WORDS } from "./constants";

export interface TextAttributes {
  colors: string[];
  itemTypes: string[];
}

export function extractTextAttributes(text: string): TextAttributes {
  const colors: string[] = [];
  const itemTypes: string[] = [];

  for (const color of COLOR_WORDS) {
    const regex = new RegExp(`\\b${color}\\b`, "i");
    if (regex.test(text)) {
      colors.push(color);
    }
  }

  for (const itemType of ITEM_TYPE_WORDS) {
    const regex = new RegExp(`\\b${itemType}\\b`, "i");
    if (regex.test(text)) {
      itemTypes.push(itemType);
    }
  }

  return {
    colors: [...new Set(colors)],
    itemTypes: [...new Set(itemTypes)],
  };
}

export function buildExactMatchesFromUserItems(userItems: UserItem[]): string[] {
  const exactMatches: string[] = [];

  for (const item of userItems) {
    const desc = item.description.toLowerCase();
    const attrs = extractTextAttributes(desc);

    if (attrs.colors.length > 0 && attrs.itemTypes.length > 0) {
      for (const color of attrs.colors) {
        for (const itemType of attrs.itemTypes) {
          exactMatches.push(`${color} ${itemType}`);
        }
      }
      continue;
    }

    if (attrs.colors.length > 0) {
      exactMatches.push(...attrs.colors);
      continue;
    }

    if (attrs.itemTypes.length > 0) {
      exactMatches.push(...attrs.itemTypes);
    }
  }

  return [...new Set(exactMatches)];
}

/**
 * Extract required keywords (colors + item types) for metadata filtering.
 */
export function extractRequiredKeywords(userItems?: UserItem[]): string[] {
  if (!userItems || userItems.length === 0) return [];

  const keywords: string[] = [];
  for (const item of userItems) {
    const attrs = extractTextAttributes(item.description);
    keywords.push(...attrs.colors, ...attrs.itemTypes);
  }

  return [...new Set(keywords)];
}

/**
 * Build a strict search query that prioritizes exact attribute matches from user items.
 * This ensures images match the exact colors and item types specified.
 * Adds "person wearing" or "outfit" context to find photos of people wearing the items.
 */
export function buildStrictSearchQuery(
  userItems: UserItem[],
  variationName: string
): string {
  const queryParts: string[] = [];

  // Build queries that find people wearing the items
  // For each user item, create a query like "person wearing yellow dress" or "yellow dress outfit"
  const outfitQueries: string[] = [];

  for (const item of userItems) {
    const desc = item.description.toLowerCase().trim();

    // Skip generic descriptions
    if (desc === "clothing item" || desc.length < 3) {
      continue;
    }

    // Extract attributes to build accurate query
    const attrs = extractTextAttributes(item.description);

    if (attrs.colors.length > 0 && attrs.itemTypes.length > 0) {
      // Has both color and item type: "person wearing yellow dress"
      for (const color of attrs.colors.slice(0, 1)) { // Take first color
        for (const itemType of attrs.itemTypes.slice(0, 1)) { // Take first item type
          outfitQueries.push(`person wearing ${color} ${itemType}`);
          outfitQueries.push(`${color} ${itemType} outfit`);
        }
      }
    } else if (attrs.colors.length > 0) {
      // Has color but no item type: use full description
      outfitQueries.push(`person wearing ${item.description}`);
      outfitQueries.push(`${item.description} outfit`);
    } else if (attrs.itemTypes.length > 0) {
      // Has item type but no color: "person wearing dress"
      for (const itemType of attrs.itemTypes.slice(0, 1)) {
        outfitQueries.push(`person wearing ${itemType}`);
        outfitQueries.push(`${itemType} outfit`);
      }
    } else {
      // Use description as-is with outfit context
      outfitQueries.push(`person wearing ${item.description}`);
      outfitQueries.push(`${item.description} outfit`);
    }
  }

  // Add outfit queries first (most specific)
  queryParts.push(...outfitQueries.slice(0, 3)); // Limit to 3 to avoid query length issues

  // Also add exact color + item type combinations for additional matching
  const exactMatches = buildExactMatchesFromUserItems(userItems);
  queryParts.push(...exactMatches.slice(0, 2)); // Limit to 2

  // Add style context
  queryParts.push(`${variationName} style`);

  // Add general outfit/fashion context
  queryParts.push("fashion outfit");

  return queryParts.filter(Boolean).join(" ").trim();
}

