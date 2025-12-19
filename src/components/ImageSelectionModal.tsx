"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { OutfitImage } from "@/lib/imageSearch";

import { OutfitItem } from "@/lib/types";

interface ImageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  item: OutfitItem;
}

export function ImageSelectionModal({
  isOpen,
  onClose,
  onSelect,
  item,
}: ImageSelectionModalProps) {
  const [images, setImages] = useState<OutfitImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      setImages([]);

      try {
        // Create a minimal variation with just this item for the search
        const minimalVariation = {
          name: "Minimal" as const,
          suggestion: "",
          items: [item],
          color_palette: [],
          styling_tips: [],
        };

        const response = await fetch("/api/search-outfit-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variation: minimalVariation,
            count: 6,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to fetch images");
        }

        const data = await response.json();
        setImages(data.images || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch images";
        setError(errorMessage);
        console.error("Image fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [isOpen, item]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Select Image for {item.item_type}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading images...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && images.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No images found. Try a different search term.
            </div>
          )}

          {!loading && !error && images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-all"
                  onClick={() => {
                    onSelect(image.url);
                    onClose();
                  }}
                >
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={image.thumbnail || image.url}
                      alt={image.description || item.description}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-semibold">
                      Select
                    </span>
                  </div>
                  {image.photographer && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Photo by {image.photographer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
