"use client";

import { useState } from "react";
import Image from "next/image";
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type. Please select an image file.');
        e.target.value = "";
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        console.error('File size too large. Please select an image smaller than 5MB.');
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImagePreview(reader.result as string);
        }
      };
      reader.onerror = () => {
        console.error('Error reading image file');
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    }
    // Clear the input so the same file can be selected again
    e.target.value = "";
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
                  <div className="mt-2 relative w-16 h-16 rounded overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt="Item"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
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
            <div className="relative w-20 h-20 rounded overflow-hidden mt-2">
              <Image
                src={imagePreview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
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
