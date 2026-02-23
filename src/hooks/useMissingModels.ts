"use client";

import { useState, useEffect } from "react";
import type { ClothingItem } from "@/lib/clothingCatalog";
import { getMissingModels } from "@/lib/clothingCatalog";

/**
 * Client-only: returns labels of catalog items whose GLB URL is missing (404).
 * Cached by getMissingModels. Use to avoid attempting to load missing files.
 */
export function useMissingModels(catalog: readonly ClothingItem[]): string[] {
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    getMissingModels(catalog).then((labels) => {
      if (!cancelled) setMissing(labels);
    });
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  return missing;
}
