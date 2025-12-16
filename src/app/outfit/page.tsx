"use client";

import { useState, useEffect } from "react";
import { OutfitInputPanel } from "@/components/OutfitInputPanel";
import { MannequinStage } from "@/components/MannequinStage";
import { OutfitResults } from "@/components/OutfitResults";
import { OutfitImageGrid } from "@/components/OutfitImageGrid";
import type { OutfitImage } from "@/lib/imageSearch";
import {
  UserItem,
  OutfitPreferences,
  OutfitVariation,
  OutfitItem,
} from "@/lib/types";

export default function OutfitPage() {
  // #region agent log
  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch(
        "http://127.0.0.1:7242/ingest/127737af-b2fa-4ac9-ba95-eecc060c2b51",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "src/app/outfit/page.tsx:16",
            message: "OutfitPage mounted",
            data: { hasWindow: true },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "H1",
          }),
        }
      ).catch(() => {});
      // Check if CSS is loaded after mount
      setTimeout(() => {
        const stylesheets = Array.from(document.styleSheets);
        const hasLayoutCSS = stylesheets.some((sheet) => {
          try {
            return sheet.href && sheet.href.includes("layout.css");
          } catch {
            return false;
          }
        });
        const linkTags = Array.from(
          document.querySelectorAll('link[rel="stylesheet"]')
        );
        fetch(
          "http://127.0.0.1:7242/ingest/127737af-b2fa-4ac9-ba95-eecc060c2b51",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "src/app/outfit/page.tsx:16",
              message: "CSS check",
              data: {
                stylesheetCount: stylesheets.length,
                linkTagCount: linkTags.length,
                hasLayoutCSS,
                linkHrefs: linkTags.map(
                  (l) => l.getAttribute("href") || "no-href"
                ),
                stylesheetHrefs: stylesheets.map((s) => {
                  try {
                    return s.href || "inline";
                  } catch {
                    return "error";
                  }
                }),
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "H1",
            }),
          }
        ).catch(() => {});
      }, 100);
    }
  }, []);
  // #endregion
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [preferences, setPreferences] = useState<OutfitPreferences>({
    occasion: "Street",
    vibe: 50,
    fit: "Regular",
    weather: "Warm",
    budget: "$$",
  });
  const [variations, setVariations] = useState<OutfitVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [outfitImages, setOutfitImages] = useState<OutfitImage[]>([]);
  const [imageCache, setImageCache] = useState<Map<string, OutfitImage[]>>(
    new Map()
  );
  const [currentVariationKey, setCurrentVariationKey] = useState<string | null>(
    null
  );
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (userItems.length === 0) {
      setError("Please add at least one item");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Call API route that uses the AI service
      const response = await fetch("/api/generate-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userItems,
          preferences,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to generate outfit";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;

          // User-friendly error messages
          if (errorData.code === "VALIDATION_ERROR") {
            errorMessage = `Invalid input: ${errorData.error}`;
          } else if (errorData.code === "CONFIG_ERROR") {
            errorMessage =
              "AI service is not properly configured. Please contact support.";
          } else if (errorData.code === "QUOTA_EXCEEDED") {
            errorMessage = "AI service quota exceeded. Please try again later.";
          }
        } catch {
          // If JSON parsing fails, use status-based message
          if (response.status === 400) {
            errorMessage = "Invalid request. Please check your input.";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setVariations(data.variations);
      setSelectedVariation(0);

      // Fetch images for the first variation
      if (data.variations && data.variations.length > 0) {
        await fetchOutfitImages(data.variations[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate cache key from variation
  const getVariationKey = (variation: OutfitVariation): string => {
    return `${variation.name}-${variation.items
      .map((i) => i.item_type)
      .join("-")}`;
  };

  const fetchOutfitImages = async (variation: OutfitVariation) => {
    // Prevent multiple simultaneous requests
    if (isFetching) {
      console.log("Image fetch already in progress, skipping...");
      return;
    }

    const variationKey = getVariationKey(variation);

    // Check cache first
    if (imageCache.has(variationKey)) {
      console.log("Using cached images for variation:", variationKey);
      setOutfitImages(imageCache.get(variationKey)!);
      setCurrentVariationKey(variationKey);
      return;
    }

    // If we're already showing images for this variation, don't fetch again
    if (currentVariationKey === variationKey && outfitImages.length > 0) {
      console.log("Images already loaded for this variation");
      return;
    }

    setIsFetching(true);
    setIsLoadingImages(true);
    setOutfitImages([]);

    try {
      // Add small delay to prevent rapid successive requests
      await new Promise((resolve) => setTimeout(resolve, 300));

      const response = await fetch("/api/search-outfit-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variation,
          count: 3, // Reduced from 6 to 3
        }),
      });

      if (!response.ok) {
        // Don't throw error, just log and use empty array
        console.warn("Image fetch failed, using empty array");
        setOutfitImages([]);
        return;
      }

      const data = await response.json();
      const images = data.images || [];

      // Cache the results
      setImageCache((prev) => new Map(prev).set(variationKey, images));
      setOutfitImages(images);
      setCurrentVariationKey(variationKey);
    } catch (err) {
      console.error("Image search error:", err);
      // Don't show error to user, just use empty array
      setOutfitImages([]);
    } finally {
      setIsLoadingImages(false);
      setIsFetching(false);
    }
  };

  const handleItemClick = (item: OutfitItem) => {
    // TODO: Open swap modal or show alternatives
    console.log("Item clicked:", item);
  };

  const handleItemSwap = (variationIndex: number, itemIndex: number) => {
    // TODO: Implement item swapping logic
    console.log("Swap item:", variationIndex, itemIndex);
  };

  const handleImagePaste = (
    imageUrl: string,
    zone: OutfitItem["body_zone"]
  ) => {
    // Create a new user item from pasted image
    const zoneNames: Record<OutfitItem["body_zone"], string> = {
      head: "Hat or headwear",
      torso: "Top or shirt",
      legs: "Pants or bottoms",
      feet: "Shoes or footwear",
      accessories: "Accessory",
    };

    const newItem: UserItem = {
      id: Date.now().toString(),
      description: `Pasted ${zoneNames[zone]}`,
      imageUrl: imageUrl,
    };

    setUserItems([...userItems, newItem]);

    // Trigger item added feedback
    setTimeout(() => {
      const event = new CustomEvent("itemAdded", { detail: { item: newItem } });
      window.dispatchEvent(event);
    }, 100);
  };

  const currentItems =
    selectedVariation !== null
      ? variations[selectedVariation]?.items || []
      : [];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            OutfitBuilder
          </h1>
          <p className="text-gray-600">AI-powered outfit recommendations</p>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
          {/* Left Panel - Input (30-35%) */}
          <div className="lg:col-span-1">
            <OutfitInputPanel
              userItems={userItems}
              preferences={preferences}
              onItemsChange={setUserItems}
              onPreferencesChange={setPreferences}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>

          {/* Right Panel - Mannequin or Images (65-70%) */}
          <div className="lg:col-span-2">
            {variations.length > 0 &&
            (outfitImages.length > 0 || isLoadingImages) ? (
              <OutfitImageGrid
                images={outfitImages}
                isLoading={isLoadingImages}
                onImageClick={(image) => {
                  window.open(image.url, "_blank", "noopener,noreferrer");
                }}
              />
            ) : (
              <MannequinStage
                items={currentItems}
                userItems={userItems}
                onItemClick={handleItemClick}
                onImagePaste={handleImagePaste}
              />
            )}
          </div>
        </div>

        {/* Results Panel */}
        {variations.length > 0 && (
          <div className="mt-6">
            <OutfitResults
              variations={variations}
              onItemSwap={handleItemSwap}
              onVariationChange={fetchOutfitImages}
            />
          </div>
        )}
      </div>
    </div>
  );
}
