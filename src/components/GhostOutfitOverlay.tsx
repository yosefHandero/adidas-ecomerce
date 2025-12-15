"use client";

import { UserItem } from "@/lib/types";

interface GhostOutfitOverlayProps {
  userItems: UserItem[];
}

export function GhostOutfitOverlay({ userItems }: GhostOutfitOverlayProps) {
  if (userItems.length > 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Ghost Top/Torso */}
      <div
        className="absolute rounded-lg border-2 border-dashed border-gray-300 opacity-20"
        style={{
          left: "35%",
          top: "30%",
          width: "30%",
          height: "28%",
        }}
      />

      {/* Ghost Bottom/Legs */}
      <div
        className="absolute rounded-lg border-2 border-dashed border-gray-300 opacity-20"
        style={{
          left: "38%",
          top: "58%",
          width: "24%",
          height: "32%",
        }}
      />

      {/* Ghost Shoes/Feet */}
      <div
        className="absolute rounded-lg border-2 border-dashed border-gray-300 opacity-20"
        style={{
          left: "38%",
          top: "88%",
          width: "24%",
          height: "8%",
        }}
      />
    </div>
  );
}

