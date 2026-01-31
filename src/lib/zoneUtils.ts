import { BodyZone, OutfitItem } from "./types";

// Zone positions on mannequin (percentage-based)
export const ZONE_POSITIONS: Record<
  OutfitItem["body_zone"],
  { x: number; y: number }
> = {
  head: { x: 50, y: 12 },
  torso: { x: 50, y: 38 },
  legs: { x: 50, y: 68 },
  feet: { x: 50, y: 92 },
  accessories: { x: 75, y: 28 },
};

/**
 * Determine zone from description using keyword matching
 */
export function getZoneFromDescription(
  description: string
): OutfitItem["body_zone"] {
  const desc = description.toLowerCase();

  // Feet
  if (
    desc.includes("shoe") ||
    desc.includes("boot") ||
    desc.includes("sneaker") ||
    desc.includes("heel") ||
    desc.includes("sandal") ||
    desc.includes("foot")
  ) {
    return "feet";
  }

  // Legs (include dresses/skirts in legs zone)
  if (
    desc.includes("pant") ||
    desc.includes("jean") ||
    desc.includes("trouser") ||
    desc.includes("short") ||
    desc.includes("skirt") ||
    desc.includes("dress") ||
    desc.includes("leg")
  ) {
    return "legs";
  }

  // Head
  if (
    desc.includes("hat") ||
    desc.includes("cap") ||
    desc.includes("beanie") ||
    desc.includes("head")
  ) {
    return "head";
  }

  // Accessories
  if (
    desc.includes("bag") ||
    desc.includes("backpack") ||
    desc.includes("belt") ||
    desc.includes("watch") ||
    desc.includes("jewelry") ||
    desc.includes("necklace") ||
    desc.includes("bracelet") ||
    desc.includes("ring") ||
    desc.includes("earring") ||
    desc.includes("glasses") ||
    desc.includes("sunglasses") ||
    desc.includes("scarf")
  ) {
    return "accessories";
  }

  // Torso
  if (
    desc.includes("shirt") ||
    desc.includes("jacket") ||
    desc.includes("top") ||
    desc.includes("coat") ||
    desc.includes("blazer") ||
    desc.includes("hoodie") ||
    desc.includes("cardigan") ||
    desc.includes("sweater")
  ) {
    return "torso";
  }

  // Default to torso
  return "torso";
}

/**
 * Infer a body zone from an item's type and description (canonical logic for AI + UI).
 */
export function inferBodyZoneFromItem(
  itemType: string,
  description: string
): BodyZone {
  return getZoneFromDescription(`${itemType} ${description}`);
}

/**
 * Determine zone from position coordinates
 */
export function getZoneFromPosition(
  x: number,
  y: number
): OutfitItem["body_zone"] {
  // Check for accessories zone first (right side, upper area)
  if (x > 65 && y >= 20 && y < 40) return "accessories";

  // Then check vertical zones
  if (y < 20) return "head";
  if (y < 50) return "torso";
  if (y < 80) return "legs";
  return "feet";
}

/**
 * Calculate item position with offset for multiple items in same zone
 */
export function getItemPosition(
  item: OutfitItem,
  index: number,
  total: number
): { x: number; y: number } {
  const base = ZONE_POSITIONS[item.body_zone];
  if (total === 1) return base;

  const offset = (index - (total - 1) / 2) * 8;
  return {
    x:
      base.x +
      (item.body_zone === "torso" || item.body_zone === "legs" ? offset : 0),
    y:
      base.y +
      (item.body_zone === "head" || item.body_zone === "feet" ? offset : 0),
  };
}
