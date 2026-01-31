"use client";

import { useRef } from "react";
import Image from "next/image";
import { OutfitItem, UserItem } from "@/lib/types";
import { ItemChip } from "./ItemChip";
import { EmptyStateOverlay } from "./EmptyStateOverlay";
import { useMannequinInteractions } from "@/hooks/useMannequinInteractions";
import {
  getItemPosition,
} from "@/lib/zoneUtils";
import type { MannequinModel } from "./OutfitInputPanel";

interface MannequinStageProps {
  model: MannequinModel;
  items: OutfitItem[];
  userItems: UserItem[];
  onItemClick: (item: OutfitItem) => void;
  isGenerating?: boolean;
}

export function MannequinStage({
  model,
  items,
  userItems,
  onItemClick,
  isGenerating,
}: MannequinStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const isEmpty = items.length === 0 && userItems.length === 0;

  const {
    showInactivityHint,
    handleInteraction,
  } = useMannequinInteractions({ isEmpty, stageRef });

  const mannequinSrc = model === "man" ? "/man_base.png" : "/woman_base.png";

  const itemsByZone = items.reduce((acc, item) => {
    if (!acc[item.body_zone]) {
      acc[item.body_zone] = [];
    }
    acc[item.body_zone].push(item);
    return acc;
  }, {} as Record<OutfitItem["body_zone"], OutfitItem[]>);

  return (
    <div
      ref={stageRef}
      className="relative h-full min-h-[600px] flex flex-col items-center justify-center premium-card rounded-2xl sm:rounded-3xl overflow-hidden mannequin-stage-preview"
    >
      <div className="absolute inset-0 mannequin-background" />

      <div
        className={`relative flex items-center justify-center flex-1 w-full min-h-0 ${
          isGenerating ? "mannequin-generating" : ""
        }`}
      >
        <Image
          src={mannequinSrc}
          alt={model === "man" ? "Man mannequin" : "Woman mannequin"}
          width={280}
          height={400}
          className="object-contain max-h-[70vh] w-auto drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
          priority
        />
      </div>

      {/* Item Chips (when we have generated items) */}
      {Object.entries(itemsByZone).map(([, zoneItems]) =>
        zoneItems.map((item, index) => (
          <ItemChip
            key={`${item.item_type}-${item.body_zone}-${index}-${item.description.slice(0, 10)}`}
            item={item}
            position={getItemPosition(item, index, zoneItems.length)}
            onClick={() => onItemClick(item)}
          />
        ))
      )}

      {/* Empty State: title + subtitle only */}
      {isEmpty && (
        <EmptyStateOverlay
          showInactivityHint={showInactivityHint}
          onInteraction={handleInteraction}
        />
      )}
    </div>
  );
}
