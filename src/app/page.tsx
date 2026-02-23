"use client";

import { useState, useMemo } from "react";
import { OutfitInputPanel } from "@/components/OutfitInputPanel";
import { MannequinStage } from "@/components/MannequinStage";
import { ResetButton } from "@/components/ResetButton";
import { AppHeader } from "@/components/AppHeader";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { OutfitVariationCard } from "@/components/OutfitVariationCard";
import { UserItem, OutfitPreferences } from "@/lib/types";
import { useOutfitGeneration } from "@/hooks/useOutfitGeneration";
import { useSuggestionImage } from "@/hooks/useSuggestionImage";
import { resolveUserItems } from "@/lib/mannequinResolution";
import {
  getDefaultEnabledClothes,
  CLOTHING,
} from "@/lib/clothingCatalog";
import { parseOutfitText } from "@/lib/outfitParser";
import { resolveParsedItemsToCatalog } from "@/lib/clothingResolver";
import type { ResolvedWear } from "@/lib/clothingResolver";

const DEFAULT_PREFERENCES: OutfitPreferences = {
  occasion: "Street",
  vibe: 50,
  fit: "Regular",
  weather: "Warm",
  budget: "$$",
};

export default function Home() {
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [preferences, setPreferences] =
    useState<OutfitPreferences>(DEFAULT_PREFERENCES);
  const [model, setModel] = useState<"man" | "woman">("man");
  const [enabledClothes, setEnabledClothes] = useState<Record<string, boolean>>(
    getDefaultEnabledClothes,
  );
  const [activeWear, setActiveWear] = useState<ResolvedWear[] | null>(null);
  const [unmatchedItems, setUnmatchedItems] = useState<string[]>([]);
  const [isApplyingOutfit, setIsApplyingOutfit] = useState(false);
  const [globalTint, setGlobalTint] = useState<string | undefined>(undefined);
  const [tintByItemId, setTintByItemId] = useState<Record<string, string>>({});

  const {
    variations,
    selectedVariation,
    setSelectedVariation,
    isGenerating,
    error,
    handleGenerate,
    reset: resetGeneration,
  } = useOutfitGeneration(userItems, preferences);

  const {
    suggestionImages,
    manImageLoadError,
    womanImageLoadError,
    setManImageLoadError,
    setWomanImageLoadError,
    reset: resetImage,
  } = useSuggestionImage(variations, userItems, selectedVariation);

  const handleItemClick = () => {
    // Placeholder for future implementation
  };

  const [hiddenItemIds, setHiddenItemIds] = useState<Set<string>>(new Set());

  const resolvedItems = useMemo(() => resolveUserItems(userItems), [userItems]);

  const handleToggleItemVisibility = (itemId: string) => {
    setHiddenItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleApplyOutfitText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsApplyingOutfit(true);
    setUnmatchedItems([]);
    setActiveWear(null);
    setTimeout(() => {
      const parsed = parseOutfitText(trimmed);
      const { resolved, unmatched } = resolveParsedItemsToCatalog(
        parsed,
        CLOTHING,
      );
      const nextEnabled: Record<string, boolean> = {};
      for (const c of CLOTHING) {
        nextEnabled[c.id] = resolved.some((r) => r.id === c.id);
      }
      setEnabledClothes(nextEnabled);
      setActiveWear(resolved);
      setUnmatchedItems(unmatched);
      setIsApplyingOutfit(false);
    }, 0);
  };

  const handleReset = () => {
    resetGeneration();
    resetImage();
    setUserItems([]);
    setHiddenItemIds(new Set());
    setPreferences(DEFAULT_PREFERENCES);
    setModel("man");
    setEnabledClothes(getDefaultEnabledClothes());
    setActiveWear(null);
    setUnmatchedItems([]);
    setGlobalTint(undefined);
    setTintByItemId({});
  };

  const currentItems =
    selectedVariation !== null
      ? variations[selectedVariation]?.items || []
      : [];

  const hasValidVariation =
    variations.length > 0 &&
    selectedVariation !== null &&
    selectedVariation >= 0 &&
    selectedVariation < variations.length;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative">
      <ResetButton onReset={handleReset} />

      <div className="max-w-7xl mx-auto">
        <AppHeader />

        <ErrorDisplay error={error} />

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 min-h-[600px]">
          {/* Left Panel - Input (30-35%) */}
          <div className="lg:col-span-1">
            <OutfitInputPanel
              userItems={userItems}
              preferences={preferences}
              model={model}
              enabledClothes={enabledClothes}
              onEnabledClothesChange={setEnabledClothes}
              globalTint={globalTint}
              onGlobalTintChange={setGlobalTint}
              tintByItemId={tintByItemId}
              onTintByItemIdChange={setTintByItemId}
              unmatchedItems={unmatchedItems}
              onApplyOutfitText={handleApplyOutfitText}
              isApplyingOutfit={isApplyingOutfit}
              onModelChange={setModel}
              onItemsChange={setUserItems}
              onPreferencesChange={setPreferences}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>

          {/* Right Panel - Mannequin or Suggestions (65-70%) */}
          <div className="lg:col-span-2">
            {hasValidVariation ? (
              <OutfitVariationCard
                variation={variations[selectedVariation]}
                variations={variations}
                selectedIndex={selectedVariation}
                onSelectVariation={setSelectedVariation}
                suggestionImages={suggestionImages}
                manImageLoadError={manImageLoadError}
                womanImageLoadError={womanImageLoadError}
                onManImageError={() => setManImageLoadError(true)}
                onWomanImageError={() => setWomanImageLoadError(true)}
              />
            ) : (
              <MannequinStage
                model={model}
                enabledClothes={enabledClothes}
                activeWear={activeWear}
                unmatchedItems={unmatchedItems}
                globalTint={globalTint}
                tintByItemId={tintByItemId}
                items={currentItems}
                userItems={userItems}
                resolvedItems={resolvedItems}
                hiddenItemIds={hiddenItemIds}
                onItemClick={handleItemClick}
                onToggleItemVisibility={handleToggleItemVisibility}
                isGenerating={isGenerating}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
