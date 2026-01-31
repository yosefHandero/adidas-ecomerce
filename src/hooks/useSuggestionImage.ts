import { useState, useRef, useEffect } from "react";
import { OutfitVariation, UserItem } from "@/lib/types";
import { parseApiResponse, parseApiError } from "@/lib/api-client";

export interface SuggestionImage {
  id: string;
  url: string;
  thumbnail: string;
  photographer?: string;
  photographerUrl?: string;
  description?: string;
}

export interface SuggestionImagesState {
  manImage: SuggestionImage | null;
  womanImage: SuggestionImage | null;
  loading: boolean;
  error: string | null;
}

export function useSuggestionImage(
  variations: OutfitVariation[],
  userItems: UserItem[],
  selectedVariationIndex: number | null
) {
  const [suggestionImages, setSuggestionImages] =
    useState<SuggestionImagesState>({
      manImage: null,
      womanImage: null,
      loading: false,
      error: null,
    });

  const [manImageLoadError, setManImageLoadError] = useState<boolean>(false);
  const [womanImageLoadError, setWomanImageLoadError] =
    useState<boolean>(false);
  const imageCacheRef = useRef<
    Map<string, { manImage: SuggestionImage | null; womanImage: SuggestionImage | null }>
  >(new Map());

  // Fetch images for the currently selected variation (Minimal / Street / Elevated)
  useEffect(() => {
    // Reset state when no variations or no selection
    if (variations.length === 0 || selectedVariationIndex === null) {
      setSuggestionImages({
        manImage: null,
        womanImage: null,
        loading: false,
        error: null,
      });
      setManImageLoadError(false);
      setWomanImageLoadError(false);
      return;
    }

    const selectedVariation = variations[selectedVariationIndex];
    if (!selectedVariation || !selectedVariation.suggestion) {
      setSuggestionImages({
        manImage: null,
        womanImage: null,
        loading: false,
        error: null,
      });
      setManImageLoadError(false);
      setWomanImageLoadError(false);
      return;
    }

    // Cache per variation so Street and Elevated get different images
    const suggestionKey = selectedVariation.suggestion.trim().toLowerCase();
    const variationName = selectedVariation.name;
    const cacheKey = `suggestion-images-${suggestionKey}-${variationName}`;
    const cached = imageCacheRef.current.get(cacheKey);
    if (cached) {
      setSuggestionImages({
        manImage: cached.manImage,
        womanImage: cached.womanImage,
        loading: false,
        error: null,
      });
      setManImageLoadError(false);
      setWomanImageLoadError(false);
      return;
    }

    // Fetch images for this variation (context-specific imagery)
    setSuggestionImages((prev) => ({ ...prev, loading: true, error: null }));
    setManImageLoadError(false);
    setWomanImageLoadError(false);

    const colorPalette = selectedVariation.color_palette ?? [];

    fetch("/api/search-suggestion-images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        suggestion: selectedVariation.suggestion,
        variationName,
        colorPalette,
        userItems: userItems,
      }),
    })
      .then(async (res) => {
        let data: unknown;
        try {
          data = await res.json();
        } catch (parseError) {
          throw new Error(
            `Failed to fetch images: ${res.status} (Invalid response)`
          );
        }

        if (!res.ok) {
          const errorData = parseApiError(data);
          throw new Error(
            errorData.error || `Failed to fetch images: ${res.status}`
          );
        }

        return parseApiResponse<{
          manImage: SuggestionImage | null;
          womanImage: SuggestionImage | null;
        }>(data);
      })
      .then((responseData) => {
        if (!responseData || typeof responseData !== "object") {
          throw new Error("Invalid response format");
        }

        const manImage = responseData.manImage ?? null;
        const womanImage = responseData.womanImage ?? null;

        imageCacheRef.current.set(cacheKey, { manImage, womanImage });
        setSuggestionImages({
          manImage,
          womanImage,
          loading: false,
          error: null,
        });
        setManImageLoadError(false);
        setWomanImageLoadError(false);
      })
      .catch((error) => {
        console.error("Error fetching suggestion images:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch images";
        setSuggestionImages({
          manImage: null,
          womanImage: null,
          loading: false,
          error: errorMessage,
        });
        setManImageLoadError(false);
        setWomanImageLoadError(false);
      });
  }, [variations, userItems, selectedVariationIndex]);

  const reset = () => {
    setSuggestionImages({
      manImage: null,
      womanImage: null,
      loading: false,
      error: null,
    });
    setManImageLoadError(false);
    setWomanImageLoadError(false);
    imageCacheRef.current.clear();
  };

  return {
    suggestionImages,
    manImageLoadError,
    womanImageLoadError,
    setManImageLoadError,
    setWomanImageLoadError,
    reset,
  };
}
