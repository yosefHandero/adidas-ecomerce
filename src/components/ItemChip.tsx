"use client";

import { OutfitItem, ResolvedItem } from "@/lib/types";
import type { BodyZone } from "@/lib/types";
import { useState } from "react";

function getZoneStyle(zone: BodyZone): string {
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
}

const CHIP_TEXT_CLASS =
  "font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] px-0.5 py-0.5";

/** Legacy: AI outfit item (variation) */
interface LegacyChipProps {
  item: OutfitItem;
  position: { x: number; y: number };
  onClick: () => void;
  resolvedItem?: never;
  stacked?: never;
  badgeCount?: never;
  isHighlighted?: never;
  isVisible?: never;
  onToggleVisibility?: never;
  onHover?: never;
  onLeave?: never;
}

/** Resolved user item: overlay + visibility toggle + hover */
interface ResolvedChipProps {
  resolvedItem: ResolvedItem;
  position?: { x: number; y: number };
  stacked?: boolean;
  badgeCount?: number;
  isHighlighted?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  item?: never;
  onClick?: never;
}

type ItemChipProps = LegacyChipProps | ResolvedChipProps;

function isResolvedProps(props: ItemChipProps): props is ResolvedChipProps {
  return "resolvedItem" in props && props.resolvedItem != null;
}

export function ItemChip(props: ItemChipProps) {
  const [localHover, setLocalHover] = useState(false);

  if (isResolvedProps(props)) {
    const {
      resolvedItem,
      position,
      stacked = false,
      badgeCount,
      isHighlighted = false,
      isVisible = true,
      onToggleVisibility,
      onHover,
      onLeave,
    } = props;
    const zone = resolvedItem.zone;
    const highlighted = isHighlighted || localHover;

    const content = (
      <>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={CHIP_TEXT_CLASS} title={resolvedItem.label}>
            {resolvedItem.label}
          </span>
          {badgeCount != null && badgeCount > 1 && (
            <span className="rounded-full bg-[var(--text-muted)]/30 text-[10px] px-1.5 py-0.5 font-bold shrink-0">
              +{badgeCount}
            </span>
          )}
        </div>
        {(localHover || highlighted) && onToggleVisibility && (
          <span className="text-[10px] opacity-80 shrink-0">
            Click to {isVisible ? "hide" : "show"}
          </span>
        )}
        {localHover && (
          <div className="absolute top-full left-0 mt-1.5 w-48 p-2 bg-[var(--surface)] rounded-lg shadow-xl border border-[var(--border)] z-20">
            <p className="text-xs font-semibold text-[var(--text)] break-words">
              {resolvedItem.label}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Color: {resolvedItem.color}
            </p>
          </div>
        )}
      </>
    );

    const className = `item-chip cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium border-2 ${getZoneStyle(
      zone
    )} shadow-md transition-all ${
      highlighted
        ? "ring-2 ring-[var(--primary)] scale-[1.02]"
        : "hover:shadow-lg"
    } ${!isVisible ? "opacity-60 line-through" : ""} ${
      stacked ? "flex items-center gap-2 min-w-0 w-full" : ""
    }`;

    if (stacked) {
      return (
        <div
          className={`relative ${className}`}
          onMouseEnter={() => {
            setLocalHover(true);
            onHover?.();
          }}
          onMouseLeave={() => {
            setLocalHover(false);
            onLeave?.();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility?.();
          }}
        >
          {content}
        </div>
      );
    }

    return (
      <div
        className={`absolute ${className}`}
        style={{
          left: `${position?.x ?? 50}%`,
          top: `${position?.y ?? 50}%`,
          transform: "translate(-50%, -50%)",
        }}
        onMouseEnter={() => {
          setLocalHover(true);
          onHover?.();
        }}
        onMouseLeave={() => {
          setLocalHover(false);
          onLeave?.();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility?.();
        }}
      >
        {content}
      </div>
    );
  }

  const { item, position, onClick } = props;
  const isHovered = localHover;

  return (
    <div
      className={`absolute item-chip cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium border-2 ${getZoneStyle(
        item.body_zone
      )} shadow-md hover:shadow-lg`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseEnter={() => setLocalHover(true)}
      onMouseLeave={() => setLocalHover(false)}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`${CHIP_TEXT_CLASS} max-w-[120px]`}
          title={item.description}
        >
          {item.item_type}
        </span>
        {isHovered && (
          <span className="text-xs opacity-75 shrink-0">Click to swap</span>
        )}
      </div>
      {isHovered && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 p-2 bg-[var(--surface)] rounded-lg shadow-xl border border-[var(--border)] z-20">
          <p className="text-xs font-semibold text-[var(--text)] break-words">
            {item.description}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Color: {item.color}
          </p>
          {item.material && (
            <p className="text-xs text-[var(--text-muted)]">
              Material: {item.material}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
