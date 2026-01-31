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
        return "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)]";
      case "torso":
        return "bg-[var(--primary)]/20 border-[var(--primary)]/60 text-[var(--text)]";
      case "legs":
        return "bg-[var(--success)]/20 border-[var(--success)]/60 text-[var(--text)]";
      case "feet":
        return "bg-[var(--accent)]/15 border-[var(--accent)]/50 text-[var(--text)]";
      case "accessories":
        return "bg-[var(--surface-2)] border-[var(--primary)]/50 text-[var(--text)]";
      default:
        return "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)]";
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
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 p-2 bg-[var(--surface)] rounded-lg shadow-xl border border-[var(--border)] z-20">
          <p className="text-xs font-semibold text-[var(--text)]">{item.description}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Color: {item.color}</p>
          {item.material && (
            <p className="text-xs text-[var(--text-muted)]">Material: {item.material}</p>
          )}
        </div>
      )}
    </div>
  );
}
