"use client";

import { useState, useEffect, useRef } from "react";
import { OutfitItem, UserItem } from "@/lib/types";
import { ItemChip } from "./ItemChip";
import { EmptyStateOverlay } from "./EmptyStateOverlay";
import { ZoneHighlights } from "./ZoneHighlights";
import { GhostOutfitOverlay } from "./GhostOutfitOverlay";

interface MannequinStageProps {
  items: OutfitItem[];
  userItems: UserItem[];
  onItemClick: (item: OutfitItem) => void;
  onImagePaste?: (imageUrl: string, zone: OutfitItem["body_zone"]) => void;
}

// Zone positions on mannequin (percentage-based)
const ZONE_POSITIONS: Record<
  OutfitItem["body_zone"],
  { x: number; y: number }
> = {
  head: { x: 50, y: 12 },
  torso: { x: 50, y: 38 },
  legs: { x: 50, y: 68 },
  feet: { x: 50, y: 92 },
  accessories: { x: 75, y: 28 },
};

export function MannequinStage({
  items,
  userItems,
  onItemClick,
  onImagePaste,
}: MannequinStageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showInactivityHint, setShowInactivityHint] = useState(false);
  const [activeZone, setActiveZone] = useState<OutfitItem["body_zone"] | null>(
    null
  );
  const [itemAddedZone, setItemAddedZone] = useState<
    OutfitItem["body_zone"] | null
  >(null);
  const [pastePosition, setPastePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for item added events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleItemAdded = (e: Event) => {
      const customEvent = e as CustomEvent;
      const item = customEvent.detail?.item;
      if (item) {
        // Determine zone from item description (simple heuristic)
        const desc = item.description.toLowerCase();
        if (
          desc.includes("shoe") ||
          desc.includes("boot") ||
          desc.includes("sneaker")
        ) {
          setItemAddedZone("feet");
        } else if (
          desc.includes("shirt") ||
          desc.includes("jacket") ||
          desc.includes("top") ||
          desc.includes("sweater")
        ) {
          setItemAddedZone("torso");
        } else if (
          desc.includes("pant") ||
          desc.includes("jean") ||
          desc.includes("trouser")
        ) {
          setItemAddedZone("legs");
        } else if (desc.includes("hat") || desc.includes("cap")) {
          setItemAddedZone("head");
        } else {
          setItemAddedZone("torso"); // default
        }

        setTimeout(() => setItemAddedZone(null), 600);
      }
    };

    window.addEventListener("itemAdded", handleItemAdded as EventListener);
    return () =>
      window.removeEventListener("itemAdded", handleItemAdded as EventListener);
  }, []);

  const isEmpty = items.length === 0 && userItems.length === 0;

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Inactivity hint timer
  useEffect(() => {
    if (!isEmpty) {
      setShowInactivityHint(false);
      return;
    }

    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityHint(true);
    }, 6000);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isEmpty]);

  // Handle mouse movement for mirror mode
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current || isEmpty) return;

    const rect = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });

    // Determine active zone based on mouse position
    if (y < 20) setActiveZone("head");
    else if (y < 50) setActiveZone("torso");
    else if (y < 80) setActiveZone("legs");
    else setActiveZone("feet");
  };

  // Determine zone from position
  const getZoneFromPosition = (y: number): OutfitItem["body_zone"] => {
    if (y < 20) return "head";
    if (y < 50) return "torso";
    if (y < 80) return "legs";
    return "feet";
  };

  // Handle paste event
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!onImagePaste) return;

    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();

        const file = item.getAsFile();
        if (!file) return;

        // Convert to data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageUrl = reader.result as string;

          // Determine zone from current mouse position or paste position
          const zone = pastePosition
            ? getZoneFromPosition(pastePosition.y)
            : activeZone || "torso";

          onImagePaste(imageUrl, zone);

          // Visual feedback
          setItemAddedZone(zone);
          setTimeout(() => setItemAddedZone(null), 600);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // Track paste position (where user clicks before pasting)
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPastePosition({ x, y });

    // Clear after a short delay
    setTimeout(() => setPastePosition(null), 2000);
  };

  const handleInteraction = () => {
    setShowInactivityHint(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  // Calculate rotation for mirror mode (subtle, max 5 degrees)
  // Note: Currently not applied to DOM, kept for potential future use
  // const rotation =
  //   isEmpty && !reducedMotion ? ((mousePosition.x - 50) / 50) * 3 : 0;

  // Group items by zone and assign positions with slight offsets
  const itemsByZone = items.reduce((acc, item) => {
    if (!acc[item.body_zone]) {
      acc[item.body_zone] = [];
    }
    acc[item.body_zone].push(item);
    return acc;
  }, {} as Record<OutfitItem["body_zone"], OutfitItem[]>);

  const getItemPosition = (item: OutfitItem, index: number, total: number) => {
    const base = ZONE_POSITIONS[item.body_zone];
    if (total === 1) return base;

    const offset = (index - (total - 1) / 2) * 8;
    return {
      x:
        base.x +
        (item.body_zone === "torso" || item.body_zone === "legs" ? offset : 0),
      y:
        base.y +
        (item.body_zone === "head" || item.body_zone === "feet" ? offset : 0),
    };
  };

  return (
    <div
      ref={stageRef}
      className="relative h-full min-h-[600px] flex items-center justify-center rounded-2xl shadow-lg overflow-hidden mannequin-canvas"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveZone(null);
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onPaste={handlePaste}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => {
        setTimeout(() => setIsHovered(false), 2000);
      }}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      role="img"
      aria-label="Mannequin for outfit visualization. Click to set paste location, then paste an image with Ctrl+V or Cmd+V"
    >
      {/* Premium Background */}
      <div className="absolute inset-0 mannequin-background" />

      {/* Zone Highlights */}
      <ZoneHighlights
        activeZone={activeZone || itemAddedZone}
        isEmpty={isEmpty}
        reducedMotion={reducedMotion}
      />

      {/* Item Added Feedback Glow */}
      {itemAddedZone && (
        <div
          className="absolute rounded-full item-added-feedback pointer-events-none"
          style={{
            left: `${ZONE_POSITIONS[itemAddedZone].x - 10}%`,
            top: `${ZONE_POSITIONS[itemAddedZone].y - 5}%`,
            width: "20%",
            height: "10%",
            background: `radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)`,
            filter: "blur(15px)",
            zIndex: 5,
          }}
        />
      )}

      {/* Ghost Outfit Overlay */}
      <GhostOutfitOverlay userItems={userItems} />

      {/* Simple Mannequin Image */}
      <div
        className={`relative mannequin-container ${
          isEmpty
            ? isHovered && !reducedMotion
              ? "mannequin-awakening"
              : "mannequin-idle-premium"
            : ""
        }`}
        style={{
          opacity: isHovered && isEmpty ? 1 : isEmpty ? 0.95 : 1,
          transition: reducedMotion
            ? "opacity 0.3s"
            : "opacity 0.4s ease-in-out",
        }}
      >
        <img
          src="/mannequin-simple.png"
          alt="Mannequin"
          className="mannequin-image mannequin-circular"
          style={{
            width: "240px",
            height: "240px",
            aspectRatio: "1 / 1",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Paste Hint */}
      {onImagePaste && isEmpty && (
        <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700 opacity-70 hover:opacity-100 transition-opacity pointer-events-none z-20 backdrop-blur-sm">
          <p className="font-medium">
            💡 Click mannequin, then paste (Ctrl+V / Cmd+V)
          </p>
        </div>
      )}

      {/* Pasted Images Overlay */}
      {userItems
        .filter((item) => item.imageUrl)
        .map((item) => {
          // Determine zone from description or default to torso
          let zone: OutfitItem["body_zone"] = "torso";
          const desc = item.description.toLowerCase();
          if (
            desc.includes("head") ||
            desc.includes("hat") ||
            desc.includes("cap")
          ) {
            zone = "head";
          } else if (
            desc.includes("leg") ||
            desc.includes("pant") ||
            desc.includes("jean")
          ) {
            zone = "legs";
          } else if (
            desc.includes("shoe") ||
            desc.includes("foot") ||
            desc.includes("sneaker")
          ) {
            zone = "feet";
          }

          const pos = ZONE_POSITIONS[zone];
          return (
            <div
              key={item.id}
              className="absolute rounded-lg border-2 border-blue-300 shadow-lg bg-white p-1 z-10"
              style={{
                left: `${pos.x - 8}%`,
                top: `${pos.y - 8}%`,
                width: "16%",
                maxWidth: "120px",
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.description}
                className="w-full h-auto rounded object-cover"
                style={{ maxHeight: "120px" }}
              />
            </div>
          );
        })}

      {/* Item Chips */}
      {Object.entries(itemsByZone).map(([, zoneItems]) =>
        zoneItems.map((item, index) => (
          <ItemChip
            key={`${item.item_type}-${
              item.body_zone
            }-${index}-${item.description.slice(0, 10)}`}
            item={item}
            position={getItemPosition(item, index, zoneItems.length)}
            onClick={() => onItemClick(item)}
          />
        ))
      )}

      {/* Empty State Overlay */}
      {isEmpty && (
        <EmptyStateOverlay
          isHovered={isHovered}
          showInactivityHint={showInactivityHint}
          onInteraction={handleInteraction}
        />
      )}
    </div>
  );
}
