"use client";

import { useState } from "react";
import { OutfitInputPanel } from "@/components/OutfitInputPanel";
import { MannequinStage } from "@/components/MannequinStage";
import { ResetButton } from "@/components/ResetButton";
import { AppHeader } from "@/components/AppHeader";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { OutfitVariationCard } from "@/components/OutfitVariationCard";
import { UserItem, OutfitPreferences } from "@/lib/types";
import { useOutfitGeneration } from "@/hooks/useOutfitGeneration";
import { useSuggestionImage } from "@/hooks/useSuggestionImage";

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

  const handleReset = () => {
    resetGeneration();
    resetImage();
    setUserItems([]);
    setPreferences(DEFAULT_PREFERENCES);
    setModel("man");
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
                items={currentItems}
                userItems={userItems}
                onItemClick={handleItemClick}
                isGenerating={isGenerating}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
