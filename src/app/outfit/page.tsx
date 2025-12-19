"use client";

import { useState, useRef, useEffect } from "react";
import { OutfitInputPanel } from "@/components/OutfitInputPanel";
import { MannequinStage } from "@/components/MannequinStage";
import { OutfitResults } from "@/components/OutfitResults";
import {
  UserItem,
  OutfitPreferences,
  OutfitVariation,
  OutfitItem,
} from "@/lib/types";

export default function OutfitPage() {
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
  const [error, setError] = useState<string | null>(null);
  const [lastGenerateTime, setLastGenerateTime] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inFlightRequestRef = useRef<Promise<void> | null>(null);
  const DEBOUNCE_MS = 3000; // 3 seconds cooldown

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
    // Set ref FIRST to create atomic operation, then check
    if (inFlightRequestRef.current) {
      return; // Already have a request in flight
    }

    // Cancel any in-flight request (shouldn't happen due to check above, but safety)
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
        // Call API route that uses the AI service
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
          let errorMessage = "Failed to generate outfit";
          // Check Retry-After header first (available even if JSON parsing fails)
          const retryAfter = response.headers.get("Retry-After");

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;

            // User-friendly error messages
            if (errorData.code === "VALIDATION_ERROR") {
              errorMessage = `Invalid input: ${errorData.error}`;
            } else if (errorData.code === "CONFIG_ERROR") {
              errorMessage =
                errorData.error ||
                "AI service is not properly configured. Please check your API keys.";
            } else if (errorData.code === "QUOTA_EXCEEDED") {
              // Use Retry-After header if available, otherwise use error message from API
              if (retryAfter) {
                errorMessage = `AI service quota exceeded. Please try again in ${retryAfter} second${
                  retryAfter !== "1" ? "s" : ""
                }.`;
              } else {
                errorMessage =
                  errorData.error ||
                  "AI service quota exceeded. Please try again later.";
              }
            } else if (
              errorData.code === "RATE_LIMITED" ||
              errorData.code === "RATE_LIMIT_EXCEEDED"
            ) {
              // Use Retry-After header if available, otherwise use error message from API
              if (retryAfter) {
                errorMessage = `Too many requests. Please wait ${retryAfter} second${
                  retryAfter !== "1" ? "s" : ""
                } before trying again.`;
              } else {
                errorMessage =
                  errorData.error ||
                  "Too many requests. Please wait before trying again.";
              }
            } else if (errorData.code === "UPSTREAM_UNAVAILABLE") {
              // Use Retry-After header if available, otherwise use error message from API
              if (retryAfter) {
                errorMessage = `Service temporarily unavailable. Please try again in ${retryAfter} second${
                  retryAfter !== "1" ? "s" : ""
                }.`;
              } else {
                errorMessage =
                  errorData.error ||
                  "Service temporarily unavailable. Please try again later.";
              }
            } else if (errorData.code === "INVALID_RESPONSE") {
              errorMessage =
                errorData.error ||
                "AI service returned an invalid response. Please try again.";
            } else if (errorData.code === "NETWORK_ERROR") {
              errorMessage =
                errorData.error ||
                "Network error. Please check your connection and try again.";
            } else if (errorData.code === "NO_PROVIDERS") {
              errorMessage =
                errorData.error ||
                "No AI providers are available. Please check your API key configuration.";
            } else if (errorData.error) {
              // Use the error message from the API if available
              errorMessage = errorData.error;
            }
          } catch {
            // If JSON parsing fails, use status-based message
            if (response.status === 400) {
              errorMessage = "Invalid request. Please check your input.";
            } else if (response.status === 429 || response.status === 503) {
              // Check Retry-After header for both rate limit (429) and quota (503) errors
              if (retryAfter) {
                errorMessage = `Please wait ${retryAfter} second${
                  retryAfter !== "1" ? "s" : ""
                } before trying again.`;
              } else if (response.status === 429) {
                errorMessage =
                  "Too many requests. Please wait before trying again.";
              } else {
                errorMessage =
                  "Service temporarily unavailable. Please try again later.";
              }
            } else if (response.status >= 500) {
              errorMessage = "Server error. Please try again later.";
            } else if (response.status === 401) {
              errorMessage =
                "Authentication failed. Please check your API keys.";
            } else if (response.status === 403) {
              errorMessage = "Access forbidden. Please check your permissions.";
            } else if (response.status === 404) {
              errorMessage = "Service not found. Please try again later.";
            }
          }

          // Set error state and return early instead of throwing
          // This prevents React from logging the error as unhandled
          setError(errorMessage);
          return;
        }

        const data = await response.json();

        // Update state atomically
        setVariations(data.variations);
        setSelectedVariation(0);
      } catch (err) {
        // Don't show error if request was aborted, but still let finally block execute
        if (err instanceof Error && err.name === "AbortError") {
          // Don't set error message for aborted requests
          // The finally block will still execute to clean up refs
          return;
        }
        // Handle network errors and other unexpected errors
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        // Only log unexpected errors, not API errors (which are handled above)
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
        // Check by comparing abortController instead of promise (more reliable)
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
          inFlightRequestRef.current = null;
        }
      }
    })();

    // Store the in-flight promise IMMEDIATELY to prevent race conditions
    // This must happen synchronously before any await
    inFlightRequestRef.current = requestPromise;

    // Wait for the request to complete
    try {
      await requestPromise;
    } catch {
      // Error already handled in requestPromise catch block
      // This catch prevents unhandled promise rejection
    }
  };

  // Cleanup on unmount: cancel any in-flight requests
  useEffect(() => {
    return () => {
      // Cancel outfit generation request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleItemClick = () => {
    // TODO: Open swap modal or show alternatives
    // Placeholder for future implementation
  };

  const handleItemSwap = () => {
    // TODO: Implement item swapping logic
    // Placeholder for future implementation
  };

  const handleImageAdd = (imageUrl: string, item: OutfitItem) => {
    // Create a new user item from the selected image
    const zoneNames: Record<OutfitItem["body_zone"], string> = {
      head: "Hat or headwear",
      torso: "Top or shirt",
      legs: "Pants or bottoms",
      feet: "Shoes or footwear",
      accessories: "Accessory",
    };

    const newItem: UserItem = {
      id: Date.now().toString(),
      description:
        item.description || `${zoneNames[item.body_zone]} - ${item.item_type}`,
      imageUrl: imageUrl,
    };

    setUserItems([...userItems, newItem]);

    // Trigger item added feedback
    setTimeout(() => {
      const event = new CustomEvent("itemAdded", { detail: { item: newItem } });
      window.dispatchEvent(event);
    }, 100);
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

          {/* Right Panel - Mannequin or Suggestions (65-70%) */}
          <div className="lg:col-span-2">
            {variations.length > 0 &&
            selectedVariation !== null &&
            selectedVariation >= 0 &&
            selectedVariation < variations.length ? (
              // Show brief suggestion when variations exist
              (() => {
                const currentVariation = variations[selectedVariation];
                if (!currentVariation) return null;

                return (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 h-full min-h-[600px] flex flex-col">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900">
                      {currentVariation.name} Style
                    </h2>

                    {/* Brief Suggestion */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Outfit Suggestion
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-base">
                        {currentVariation.suggestion}
                      </p>
                    </div>

                    {/* Styling Tips */}
                    {currentVariation.styling_tips &&
                      currentVariation.styling_tips.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            Styling Tips
                          </h3>
                          <ul className="space-y-2">
                            {currentVariation.styling_tips.map((tip, index) => (
                              <li
                                key={index}
                                className="flex items-start text-gray-700"
                              >
                                <span className="text-blue-600 mr-2">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Color Palette */}
                    {currentVariation.color_palette &&
                      currentVariation.color_palette.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            Color Palette
                          </h3>
                          <div className="flex gap-3 flex-wrap">
                            {currentVariation.color_palette.map((color, i) => (
                              <div
                                key={i}
                                className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })()
            ) : (
              // Show mannequin only when no variations exist
              <MannequinStage
                items={currentItems}
                userItems={userItems}
                onItemClick={handleItemClick}
                onImagePaste={handleImagePaste}
                isGenerating={isGenerating}
              />
            )}
          </div>
        </div>

        {/* Results Panel */}
        {variations.length > 0 && (
          <div className="mt-6">
            <OutfitResults
              variations={variations}
              selectedVariation={selectedVariation ?? 0}
              onItemSwap={handleItemSwap}
              onImageAdd={handleImageAdd}
              onVariationChange={(variation) => {
                // Update selected variation when user switches tabs
                const index = variations.findIndex(
                  (v) => v.name === variation.name
                );
                if (index !== -1) {
                  setSelectedVariation(index);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
