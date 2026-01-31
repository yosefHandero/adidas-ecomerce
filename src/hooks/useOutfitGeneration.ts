import { useState, useRef, useEffect } from "react";
import { UserItem, OutfitPreferences, OutfitVariation } from "@/lib/types";
import {
  parseApiResponse,
  parseApiError,
  getUserFriendlyErrorMessage,
} from "@/lib/api-client";

const DEBOUNCE_MS = 3000; // 3 seconds cooldown

export function useOutfitGeneration(
  userItems: UserItem[],
  preferences: OutfitPreferences
) {
  const [variations, setVariations] = useState<OutfitVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerateTime, setLastGenerateTime] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inFlightRequestRef = useRef<Promise<void> | null>(null);

  const handleGenerate = async () => {
    if (userItems.length === 0) {
      setError("Please add at least one item");
      return;
    }

    // Debounce: prevent rapid clicks
    const now = Date.now();
    const timeSinceLastGenerate = now - lastGenerateTime;
    if (timeSinceLastGenerate < DEBOUNCE_MS) {
      const remainingSeconds = Math.ceil(
        (DEBOUNCE_MS - timeSinceLastGenerate) / 1000
      );
      setError(
        `Please wait ${remainingSeconds} second${
          remainingSeconds !== 1 ? "s" : ""
        } before generating again`
      );
      return;
    }

    // Atomic check: prevent duplicate requests
    if (inFlightRequestRef.current) {
      return; // Already have a request in flight
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setLastGenerateTime(now);
    setIsGenerating(true);
    setError(null);

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Create in-flight promise to prevent duplicate requests
    const requestPromise = (async () => {
      try {
        const response = await fetch("/api/generate-outfit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userItems,
            preferences,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          let errorData = { error: "Failed to generate outfit" };

          try {
            const errorDataRaw = await response.json();
            errorData = parseApiError(errorDataRaw);
          } catch {
            // If JSON parsing fails, use status-based fallback
            // getUserFriendlyErrorMessage will handle status codes
          }

          const errorMessage = getUserFriendlyErrorMessage(errorData, response);
          setError(errorMessage);
          return;
        }

        const dataRaw = await response.json();
        const data = parseApiResponse<{ variations: OutfitVariation[] }>(
          dataRaw
        );

        // Update state atomically
        setVariations(data.variations);
        setSelectedVariation(0);
      } catch (err) {
        // Don't show error if request was aborted
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        // Handle network errors and other unexpected errors
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        // Only log unexpected errors, not API errors
        if (
          !(
            err instanceof Error &&
            err.message.includes("Failed to generate outfit")
          )
        ) {
          console.error("Generation error:", err);
        }
      } finally {
        // Always execute cleanup, even if request was aborted
        setIsGenerating(false);

        // Clear refs only if this is still the current request
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
          inFlightRequestRef.current = null;
        }
      }
    })();

    // Store the in-flight promise IMMEDIATELY to prevent race conditions
    inFlightRequestRef.current = requestPromise;

    // Wait for the request to complete
    try {
      await requestPromise;
    } catch {
      // Error already handled in requestPromise catch block
      // This catch prevents unhandled promise rejection
    }
  };

  const reset = () => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    inFlightRequestRef.current = null;

    // Reset all state
    setVariations([]);
    setSelectedVariation(null);
    setIsGenerating(false);
    setError(null);
    setLastGenerateTime(0);
  };

  // Cleanup on unmount: cancel any in-flight requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    variations,
    selectedVariation,
    setSelectedVariation,
    isGenerating,
    error,
    handleGenerate,
    reset,
  };
}
