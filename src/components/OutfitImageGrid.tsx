"use client";

import { useState } from "react";
import Image from "next/image";
import type { OutfitImage } from "@/lib/imageSearch";

interface OutfitImageGridProps {
  images: OutfitImage[];
  isLoading?: boolean;
  onImageClick?: (image: OutfitImage) => void;
}

export function OutfitImageGrid({
  images,
  isLoading = false,
  onImageClick,
}: OutfitImageGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  };

  const handleImageError = (id: string) => {
    setErrorImages((prev) => new Set(prev).add(id));
  };

  if (isLoading && images.length === 0) {
    return (
      <div className="h-full min-h-[600px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Finding real outfit inspiration...</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="h-full min-h-[600px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg">
        <p className="text-gray-500">No images found</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-4 overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {images.map((image, index) => {
          const isLoaded = loadedImages.has(image.id);
          const hasError = errorImages.has(image.id);

          return (
            <div
              key={image.id}
              className={`relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${
                isLoaded ? "opacity-100" : "opacity-0"
              } ${hasError ? "hidden" : ""}`}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
              onClick={() => onImageClick?.(image)}
            >
              {/* Image */}
              <div className="relative w-full h-full min-h-[200px] bg-gray-200">
                {!hasError && (
                  <div className={`relative w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                    isLoaded ? "opacity-100" : "opacity-0"
                  }`}>
                    <Image
                      src={image.url}
                      alt={image.description || `Outfit inspiration ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      onLoad={() => handleImageLoad(image.id)}
                      onError={() => handleImageError(image.id)}
                    />
                  </div>
                )}

                {/* Loading skeleton */}
                {!isLoaded && !hasError && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                    Click to view
                  </p>
                </div>

                {/* Photographer credit (if available) */}
                {image.photographer && (
                  <div className="absolute bottom-2 left-2 right-2">
                    <a
                      href={image.photographerUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white text-xs opacity-0 group-hover:opacity-70 transition-opacity bg-black/50 px-2 py-1 rounded backdrop-blur-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Photo by {image.photographer}
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
