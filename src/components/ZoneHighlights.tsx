"use client";

import { useEffect, useState } from "react";
import { OutfitItem } from "@/lib/types";

interface ZoneHighlightsProps {
  activeZone: OutfitItem["body_zone"] | null;
  isEmpty: boolean;
  reducedMotion: boolean;
}

const ZONE_POSITIONS: Record<
  OutfitItem["body_zone"],
  { x: number; y: number; width: number; height: number }
> = {
  head: { x: 50, y: 12, width: 15, height: 8 },
  torso: { x: 50, y: 38, width: 20, height: 25 },
  legs: { x: 50, y: 68, width: 18, height: 25 },
  feet: { x: 50, y: 92, width: 20, height: 6 },
  accessories: { x: 75, y: 28, width: 10, height: 10 },
};

export function ZoneHighlights({
  activeZone,
  isEmpty,
  reducedMotion,
}: ZoneHighlightsProps) {
  const [cyclingZone, setCyclingZone] =
    useState<OutfitItem["body_zone"]>("feet");

  useEffect(() => {
    if (!isEmpty || reducedMotion || activeZone) {
      // Clear any existing interval when not needed
      return;
    }

    const zones: OutfitItem["body_zone"][] = ["feet", "legs", "torso"];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % zones.length;
      setCyclingZone(zones[currentIndex]);
    }, 4500);

    return () => {
      clearInterval(interval);
    };
  }, [isEmpty, reducedMotion, activeZone]);

  if (!isEmpty) return null;

  const zonesToShow: OutfitItem["body_zone"][] = ["feet", "legs", "torso"];
  const highlightedZone = activeZone || cyclingZone;

  return (
    <>
      {zonesToShow.map((zone) => {
        const pos = ZONE_POSITIONS[zone];
        const isActive = zone === highlightedZone;
        const opacity = isActive ? 0.15 : 0.05;

        return (
          <div
            key={zone}
            className="absolute rounded-full transition-all duration-1000 ease-in-out zone-glow"
            style={{
              left: `${pos.x - pos.width / 2}%`,
              top: `${pos.y - pos.height / 2}%`,
              width: `${pos.width}%`,
              height: `${pos.height}%`,
              opacity,
              background: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)`,
              filter: isActive ? "blur(20px)" : "blur(15px)",
              transform: `scale(${isActive ? 1.2 : 1})`,
            }}
          />
        );
      })}
    </>
  );
}
