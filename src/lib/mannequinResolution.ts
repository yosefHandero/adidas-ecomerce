import { UserItem, type BodyZone, type ResolvedItem } from "./types";
import { parseColorFromDescription } from "./colorParsing";
import { getZoneFromDescription } from "./zoneUtils";

/**
 * Resolve raw user items into structured data for mannequin overlays and chips.
 * Output: { id, label, zone, color, confidence, visible: true }
 * Client-only; no API calls.
 */
export function resolveUserItems(userItems: UserItem[]): ResolvedItem[] {
  return userItems.map((item, itemIndex) => {
    const zone = getZoneFromDescription(item.description);
    const { color, confidence } = parseColorFromDescription(item.description);
    return {
      id: item.id,
      label: item.description,
      zone,
      color,
      confidence,
      visible: true,
      itemIndex,
    };
  });
}

/**
 * For each zone, pick the overlay color from the most recent *visible* item in that zone.
 * Hidden items are excluded. Order = itemIndex (last in list = most recent).
 */
export function getOverlayColorPerZone(
  resolvedItems: ResolvedItem[],
  hiddenItemIds: Set<string>
): Record<"head" | "torso" | "legs" | "feet", string | null> {
  const result: Record<"head" | "torso" | "legs" | "feet", string | null> = {
    head: null,
    torso: null,
    legs: null,
    feet: null,
  };

  const visible = [...resolvedItems]
    .filter((r) => !hiddenItemIds.has(r.id))
    .sort((a, b) => b.itemIndex - a.itemIndex);

  for (const item of visible) {
    const z = item.zone;
    if (
      (z === "head" || z === "torso" || z === "legs" || z === "feet") &&
      result[z] === null
    ) {
      result[z] = item.color;
    }
  }

  return result;
}

/**
 * Group resolved items by zone for chip positioning and +N badge.
 */
export function groupResolvedItemsByZone(
  resolvedItems: ResolvedItem[]
): Map<BodyZone, ResolvedItem[]> {
  const map = new Map<BodyZone, ResolvedItem[]>();
  for (const item of resolvedItems) {
    const list = map.get(item.zone) ?? [];
    list.push(item);
    map.set(item.zone, list);
  }
  return map;
}
