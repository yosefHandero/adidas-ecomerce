"use client";

import { OutfitVariation } from "@/lib/types";
import { useState, useRef } from "react";

interface OutfitResultsProps {
  variations: OutfitVariation[];
  onItemSwap?: (variationIndex: number, itemIndex: number) => void;
  onVariationChange?: (variation: OutfitVariation) => void;
}

export function OutfitResults({
  variations,
  onItemSwap,
  onVariationChange,
}: OutfitResultsProps) {
  const [selectedVariation, setSelectedVariation] = useState(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleVariationChange = (index: number) => {
    setSelectedVariation(index);

    // Clear existing timer to debounce rapid clicks
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce variation change to prevent rapid API calls (500ms delay)
    if (onVariationChange) {
      debounceTimerRef.current = setTimeout(() => {
        onVariationChange(variations[index]);
      }, 500);
    }
  };

  if (variations.length === 0) return null;

  const variation = variations[selectedVariation];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-900">
        Outfit Variations
      </h3>

      {/* Variation Tabs */}
      <div className="flex gap-2 mb-6">
        {variations.map((v, index) => (
          <button
            key={v.name}
            onClick={() => handleVariationChange(index)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedVariation === index
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* Selected Variation Details */}
      <div className="space-y-4">
        {/* Color Palette */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Color Palette
          </h4>
          <div className="flex gap-2">
            {variation.color_palette.map((color, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Items List */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
          <div className="space-y-2">
            {variation.items.map((item, index) => (
              <div
                key={`${item.item_type}-${item.body_zone}-${index}`}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {item.item_type}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description}
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-500">
                      <span>Color: {item.color}</span>
                      {item.material && <span>Material: {item.material}</span>}
                    </div>
                    <p className="text-xs text-gray-600 mt-2 italic">
                      &ldquo;{item.why_it_matches}&rdquo;
                    </p>
                    {item.style_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.style_tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {onItemSwap && (
                    <button
                      onClick={() => onItemSwap(selectedVariation, index)}
                      className="ml-3 px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Swap
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Styling Notes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-2">✓ Do</h4>
            <ul className="space-y-1">
              {variation.styling_notes.do.map((note, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start">
                  <span className="text-green-600 mr-2">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-2">
              ✗ Don&apos;t
            </h4>
            <ul className="space-y-1">
              {variation.styling_notes.dont.map((note, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
