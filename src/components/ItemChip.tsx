"use client";

import { OutfitItem } from "@/lib/types";
import { useState } from "react";

interface ItemChipProps {
  item: OutfitItem;
  position: { x: number; y: number };
  onClick: () => void;
}

export function ItemChip({ item, position, onClick }: ItemChipProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getZoneColor = (zone: OutfitItem["body_zone"]) => {
    switch (zone) {
      case "head":
        return "bg-purple-100 border-purple-300 text-purple-800";
      case "torso":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "legs":
        return "bg-green-100 border-green-300 text-green-800";
      case "feet":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "accessories":
        return "bg-pink-100 border-pink-300 text-pink-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  return (
    <div
      className={`absolute item-chip cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium border-2 ${getZoneColor(
        item.body_zone
      )} shadow-md hover:shadow-lg`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold">{item.item_type}</span>
        {isHovered && (
          <span className="text-xs opacity-75">Click to swap</span>
        )}
      </div>
      {isHovered && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 p-2 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
          <p className="text-xs font-semibold text-gray-900">{item.description}</p>
          <p className="text-xs text-gray-600 mt-1">Color: {item.color}</p>
          {item.material && (
            <p className="text-xs text-gray-600">Material: {item.material}</p>
          )}
        </div>
      )}
    </div>
  );
}

