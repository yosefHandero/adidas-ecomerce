/**
 * Single source of truth for 3D clothing: metadata, zones, transforms, and tint support.
 */

export type ClothingZone = "head" | "torso" | "legs" | "feet";

export type ClothingId =
  | "hat"
  | "shirt"
  | "jacket"
  | "pants"
  | "shorts"
  | "socks"
  | "shoes";

export interface ClothingTransform {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
}

export interface ClothingItem {
  id: ClothingId;
  label: string;
  zone: ClothingZone;
  url: string;
  transform: ClothingTransform;
  /** If true, material color can be set from tint (e.g. shirt, jacket). */
  supportsTint: boolean;
  /** Optional default hex when enabled and no tint is set. */
  defaultTint?: string;
  defaultEnabled?: boolean;
  /** For text parsing: e.g. ["shirt", "t-shirt", "tee"]. */
  keywords: readonly string[];
}

export const CLOTHING: readonly ClothingItem[] = [
  {
    id: "hat",
    label: "Hat",
    zone: "head",
    url: "/models/clothes/hat.glb",
    transform: {
      position: [0, 1.25, 0],
      rotation: [0, 0, 0],
      scale: [0.55, 0.55, 0.55],
    },
    supportsTint: false,
    defaultEnabled: false,
    keywords: ["hat", "cap", "beanie"],
  },
  {
    id: "shirt",
    label: "Shirt",
    zone: "torso",
    url: "/models/clothes/shirt.glb",
    transform: {
      position: [0, 0.23, 0],
      rotation: [0, 0, 0],
      scale: [0.9, 1.2, 0.6],
    },
    supportsTint: true,
    defaultTint: "#ffffff",
    defaultEnabled: true,
    keywords: ["shirt", "t-shirt", "tee"],
  },
  {
    id: "jacket",
    label: "Jacket",
    zone: "torso",
    url: "/models/clothes/jacket.glb",
    transform: {
      position: [0, 0.2, 0],
      rotation: [0, 0, 0],
      scale: [0.92, 1.15, 0.62],
    },
    supportsTint: true,
    defaultTint: "#374151",
    defaultEnabled: false,
    keywords: ["jacket", "hoodie", "coat"],
  },
  {
    id: "pants",
    label: "Pants",
    zone: "legs",
    url: "/models/clothes/pants.glb",
    transform: {
      position: [0, -0.4, 0],
      rotation: [0, 0, 0],
      scale: [0.85, 1.1, 0.7],
    },
    supportsTint: true,
    defaultTint: "#1f2937",
    defaultEnabled: true,
    keywords: ["pants", "jeans"],
  },
  {
    id: "shorts",
    label: "Shorts",
    zone: "legs",
    url: "/models/clothes/shorts.glb",
    transform: {
      position: [0, -0.1, 0],
      rotation: [0, 0, 0],
      scale: [0.88, 1, 0.68],
    },
    supportsTint: true,
    defaultTint: "#4b5563",
    defaultEnabled: false,
    keywords: ["shorts"],
  },
  {
    id: "socks",
    label: "Socks",
    zone: "feet",
    url: "/models/clothes/socks.glb",
    transform: {
      position: [0, -1.15, 0],
      rotation: [0, 0, 0],
      scale: [0.5, 0.5, 0.5],
    },
    supportsTint: true,
    defaultTint: "#fafafa",
    defaultEnabled: false,
    keywords: ["socks"],
  },
  {
    id: "shoes",
    label: "Shoes",
    zone: "feet",
    url: "/models/clothes/shoes.glb",
    transform: {
      position: [0, -1.2, 0],
      rotation: [0, 0, 0],
      scale: [0.6, 0.6, 0.6],
    },
    supportsTint: false,
    defaultEnabled: true,
    keywords: ["shoes", "sneakers", "boots"],
  },
] as const;

export const CLOTHING_ZONES: ClothingZone[] = ["head", "torso", "legs", "feet"];

export function getDefaultEnabledClothes(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const c of CLOTHING) {
    out[c.id] = c.defaultEnabled ?? false;
  }
  return out;
}

/** Client-only: cache for HEAD check results so we don't refetch. */
const urlExistsCache = new Map<string, boolean>();

async function checkUrlExists(url: string): Promise<boolean> {
  if (urlExistsCache.has(url)) return urlExistsCache.get(url)!;
  if (typeof window === "undefined") {
    urlExistsCache.set(url, false);
    return false;
  }
  try {
    const full = new URL(url, window.location.origin).href;
    const res = await fetch(full, { method: "HEAD", cache: "no-store" });
    const ok = res.ok;
    urlExistsCache.set(url, ok);
    return ok;
  } catch {
    urlExistsCache.set(url, false);
    return false;
  }
}

/**
 * Client-only: returns labels of catalog items whose URL returned 404/error.
 * Caches results per URL. Call from useEffect in a client component.
 */
export async function getMissingModels(
  catalog: readonly ClothingItem[],
): Promise<string[]> {
  const results = await Promise.all(
    catalog.map(async (item) => ({
      label: item.label,
      exists: await checkUrlExists(item.url),
    })),
  );
  return results.filter((r) => !r.exists).map((r) => r.label);
}
