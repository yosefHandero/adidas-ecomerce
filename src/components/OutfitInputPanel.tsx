"use client";

import { useState, useEffect } from "react";
import {
  UserItem,
  OutfitPreferences,
  Occasion,
  Fit,
  Weather,
  Budget,
} from "@/lib/types";

interface OutfitInputPanelProps {
  userItems: UserItem[];
  preferences: OutfitPreferences;
  onItemsChange: (items: UserItem[]) => void;
  onPreferencesChange: (preferences: OutfitPreferences) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function OutfitInputPanel({
  userItems,
  preferences,
  onItemsChange,
  onPreferencesChange,
  onGenerate,
  isGenerating,
}: OutfitInputPanelProps) {
  // #region agent log
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        // Test if Tailwind utility classes are working
        const testEl = document.createElement("div");
        testEl.className =
          "flex items-center bg-blue-600 text-white rounded-lg";
        testEl.style.position = "absolute";
        testEl.style.top = "-9999px";
        document.body.appendChild(testEl);
        const styles = window.getComputedStyle(testEl);
        const result = {
          display: styles.display,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderRadius: styles.borderRadius,
        };
        document.body.removeChild(testEl);
        fetch(
          "http://127.0.0.1:7242/ingest/127737af-b2fa-4ac9-ba95-eecc060c2b51",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "src/components/OutfitInputPanel.tsx:22",
              message: "Tailwind class test",
              data: {
                testResult: result,
                isTailwindWorking:
                  result.display === "flex" &&
                  result.backgroundColor !== "rgba(0, 0, 0, 0)",
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "H3",
            }),
          }
        ).catch(() => {});
      }, 200);
    }
  }, []);
  // #endregion
  const [newItemDescription, setNewItemDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleAddItem = () => {
    const trimmed = newItemDescription.trim();
    if (!trimmed) return;

    // Prevent adding duplicate items
    if (
      userItems.some(
        (item) => item.description.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      return;
    }

    const newItem: UserItem = {
      id: Date.now().toString(),
      description: trimmed,
      imageUrl: imagePreview || undefined,
    };

    onItemsChange([...userItems, newItem]);
    setNewItemDescription("");
    setImagePreview(null);

    // Trigger item added feedback
    if (typeof window !== "undefined") {
      setTimeout(() => {
        const event = new CustomEvent("itemAdded", {
          detail: { item: newItem },
        });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(userItems.filter((item) => item.id !== id));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full min-h-[600px] flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Build Your Outfit
      </h2>

      {/* Items Section */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Your Items
        </label>
        <div className="space-y-3 mb-3">
          {userItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <p className="text-sm text-gray-900">{item.description}</p>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt="Item"
                    className="mt-2 w-16 h-16 object-cover rounded"
                  />
                )}
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="ml-3 text-red-500 hover:text-red-700 text-lg"
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={newItemDescription}
            onChange={(e) => setNewItemDescription(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
            placeholder="Describe an item (e.g., 'Black leather jacket')"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <span className="block px-4 py-2 text-sm text-center border border-gray-300 rounded-lg hover:bg-gray-50">
                {imagePreview ? "Image Selected" : "Upload Image (Optional)"}
              </span>
            </label>
            <button
              onClick={handleAddItem}
              disabled={!newItemDescription.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded mt-2"
            />
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Occasion
          </label>
          <select
            value={preferences.occasion}
            onChange={(e) =>
              onPreferencesChange({
                ...preferences,
                occasion: e.target.value as Occasion,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {(["Street", "Work", "Gym", "Date", "Travel"] as Occasion[]).map(
              (occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Vibe: {preferences.vibe}/100 (
            {preferences.vibe < 33
              ? "Minimal"
              : preferences.vibe < 67
              ? "Balanced"
              : "Bold"}
            )
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={preferences.vibe}
            onChange={(e) =>
              onPreferencesChange({
                ...preferences,
                vibe: parseInt(e.target.value),
              })
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fit
          </label>
          <select
            value={preferences.fit}
            onChange={(e) =>
              onPreferencesChange({
                ...preferences,
                fit: e.target.value as Fit,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {(["Slim", "Regular", "Oversized"] as Fit[]).map((fit) => (
              <option key={fit} value={fit}>
                {fit}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Weather
          </label>
          <select
            value={preferences.weather}
            onChange={(e) =>
              onPreferencesChange({
                ...preferences,
                weather: e.target.value as Weather,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {(["Warm", "Cold", "Rain"] as Weather[]).map((weather) => (
              <option key={weather} value={weather}>
                {weather}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Budget
          </label>
          <select
            value={preferences.budget}
            onChange={(e) =>
              onPreferencesChange({
                ...preferences,
                budget: e.target.value as Budget,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {(["$", "$$", "$$$"] as Budget[]).map((budget) => (
              <option key={budget} value={budget}>
                {budget === "$"
                  ? "Budget-Friendly"
                  : budget === "$$"
                  ? "Mid-Range"
                  : "Premium"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={userItems.length === 0 || isGenerating}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        type="button"
        aria-label={isGenerating ? "Generating outfit..." : "Generate outfit"}
      >
        {isGenerating ? "Generating..." : "Build My Outfit"}
      </button>
    </div>
  );
}
