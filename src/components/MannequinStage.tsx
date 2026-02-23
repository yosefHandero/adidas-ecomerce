"use client";

import { useRef, useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { OutfitItem, UserItem } from "@/lib/types";
import type { ResolvedItem, BodyZone } from "@/lib/types";
import { EmptyStateOverlay } from "./EmptyStateOverlay";
import { useMannequinInteractions } from "@/hooks/useMannequinInteractions";
import { useMissingModels } from "@/hooks/useMissingModels";
import {
  getOverlayColorPerZone,
  groupResolvedItemsByZone,
} from "@/lib/mannequinResolution";
import { ZONE_OVERLAY_BOXES } from "@/lib/constants";
import type { MannequinModel } from "./OutfitInputPanel";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Group } from "three";
import {
  CLOTHING,
  type ClothingItem,
  type ClothingTransform,
} from "@/lib/clothingCatalog";
import type { ResolvedWear } from "@/lib/clothingResolver";
import { applyTintToScene } from "@/lib/tintScene";

const OVERLAY_ZONES = ["head", "torso", "legs", "feet"] as const;

useGLTF.preload("/models/man_base.glb");
useGLTF.preload("/models/woman_base.glb");

type WearSlot = {
  id: string;
  url: string;
  transform: ClothingTransform;
  tintHex?: string;
};

/** Loads GLB imperatively; applies tint when provided; reports load failure. Only mount for items whose model exists (HEAD check). */
function SafeClothingPrimitive({
  slot,
  onLoadError,
}: {
  slot: WearSlot;
  onLoadError?: (id: string) => void;
}) {
  const [scene, setScene] = useState<Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    let cancelled = false;
    loader.load(
      slot.url,
      (gltf) => {
        if (cancelled) return;
        const clone = gltf.scene.clone();
        if (slot.tintHex) applyTintToScene(clone, slot.tintHex);
        setScene(clone);
      },
      undefined,
      () => {
        if (!cancelled) {
          console.warn(`[Mannequin] Failed to load: ${slot.url} (${slot.id})`);
          onLoadError?.(slot.id);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [slot.id, slot.url, slot.tintHex, onLoadError]);

  const { position, rotation, scale } = slot.transform;
  if (!scene) return null;
  return (
    <primitive
      object={scene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

function MannequinWithClothing({
  model,
  enabledClothes,
  activeWear,
  missingLabels,
  globalTint,
  tintByItemId,
  onLoadError,
}: {
  model: MannequinModel;
  enabledClothes: Record<string, boolean>;
  activeWear?: ResolvedWear[] | null;
  missingLabels: string[];
  globalTint?: string;
  tintByItemId?: Record<string, string>;
  onLoadError?: (id: string) => void;
}) {
  const bodyUrl =
    model === "man" ? "/models/man_base.glb" : "/models/woman_base.glb";
  const { scene: body } = useGLTF(bodyUrl);

  const wearSlots = useMemo((): WearSlot[] => {
    const missingSet = new Set(missingLabels);
    const getTint = (id: string, catalogItem: ClothingItem): string | undefined => {
      if (!catalogItem.supportsTint) return undefined;
      return tintByItemId?.[id] ?? globalTint ?? catalogItem.defaultTint;
    };

    if (activeWear && activeWear.length > 0) {
      return activeWear
        .filter((w) => !missingSet.has(CLOTHING.find((c) => c.id === w.id)?.label ?? ""))
        .map((w) => ({
          id: w.id,
          url: w.url,
          transform: w.transform,
          tintHex: w.tintHex,
        }));
    }

    return CLOTHING.filter((c) => enabledClothes[c.id])
      .filter((c) => !missingSet.has(c.label))
      .map((c) => ({
        id: c.id,
        url: c.url,
        transform: c.transform,
        tintHex: getTint(c.id, c),
      }));
  }, [activeWear, enabledClothes, missingLabels, globalTint, tintByItemId]);

  return (
    <group>
      <primitive object={body} position={[0, -1.2, 0]} scale={0.9} />
      {wearSlots.map((slot) => (
        <SafeClothingPrimitive
          key={slot.id}
          slot={slot}
          onLoadError={onLoadError}
        />
      ))}
    </group>
  );
}

interface MannequinStageProps {
  model: MannequinModel;
  enabledClothes: Record<string, boolean>;
  activeWear?: ResolvedWear[] | null;
  unmatchedItems?: string[];
  globalTint?: string;
  tintByItemId?: Record<string, string>;
  items: OutfitItem[];
  userItems: UserItem[];
  resolvedItems?: ResolvedItem[];
  hiddenItemIds?: Set<string>;
  onItemClick: (item: OutfitItem) => void;
  onToggleItemVisibility?: (itemId: string) => void;
  isGenerating?: boolean;
}

export function MannequinStage({
  model,
  enabledClothes,
  activeWear,
  unmatchedItems = [],
  globalTint,
  tintByItemId,
  items,
  userItems,
  resolvedItems = [],
  hiddenItemIds = new Set(),
  onItemClick,
  onToggleItemVisibility,
  isGenerating,
}: MannequinStageProps) {
  void onItemClick;
  void onToggleItemVisibility;
  const stageRef = useRef<HTMLDivElement>(null);
  const [hoveredItemId] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<BodyZone | null>(null);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const missingLabels = useMissingModels(CLOTHING);

  const handleLoadError = useCallback((id: string) => {
    setLoadErrors((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  useEffect(() => {
    setLoadErrors([]);
  }, [activeWear]);

  const displayMissing = useMemo(() => {
    const fromHead = missingLabels;
    const fromLoad = loadErrors.map(
      (id) => CLOTHING.find((c) => c.id === id)?.label ?? id,
    );
    const combined = [...new Set([...fromHead, ...fromLoad])];
    return combined.sort();
  }, [missingLabels, loadErrors]);

  const overlayColorsPerZone = useMemo(
    () => getOverlayColorPerZone(resolvedItems, hiddenItemIds),
    [resolvedItems, hiddenItemIds],
  );

  const itemsByZone = useMemo(
    () => groupResolvedItemsByZone(resolvedItems),
    [resolvedItems],
  );

  const isEmpty =
    items.length === 0 && userItems.length === 0 && resolvedItems.length === 0;

  const { showInactivityHint, handleInteraction } = useMannequinInteractions({
    isEmpty,
    stageRef,
  });

  return (
    <div
      ref={stageRef}
      className="relative h-full min-h-[720px] flex flex-col items-center justify-center premium-card rounded-2xl sm:rounded-3xl overflow-hidden mannequin-stage-preview"
    >
      <div className="absolute inset-0 mannequin-background" />

      <div
        className={`relative flex flex-col flex-1 w-full min-h-0 ${
          isGenerating ? "mannequin-generating" : ""
        }`}
      >
        <div
          className={`flex-1 flex items-center justify-center w-full min-h-0 px-4 py-6 ${
            isEmpty ? "max-h-[60vh]" : ""
          }`}
        >
          <div className="relative w-full h-full max-w-[560px] max-h-[70vh] aspect-[280/400]">
            {resolvedItems.length > 0 &&
              OVERLAY_ZONES.map((zone) => {
                const color = overlayColorsPerZone[zone];
                if (!color) return null;
                const box = ZONE_OVERLAY_BOXES[zone];
                const isHighlighted =
                  hoveredZone === zone ||
                  (hoveredItemId &&
                    resolvedItems.some(
                      (r) => r.id === hoveredItemId && r.zone === zone,
                    ));
                const countInZone = itemsByZone.get(zone)?.length ?? 0;

                return (
                  <div
                    key={zone}
                    className="absolute rounded-2xl pointer-events-none overflow-hidden"
                    style={{
                      zIndex: 1,
                      top: `${box.top}%`,
                      left: `${box.left}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      backgroundColor: color,
                      opacity: isHighlighted ? 0.35 : 0.26,
                      boxShadow:
                        "inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 2px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    {countInZone > 1 && (
                      <span
                        className="absolute top-0.5 right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[var(--text)]/75 text-white text-[10px] font-bold px-1 pointer-events-none"
                        aria-label={`${countInZone} items`}
                      >
                        +{countInZone}
                      </span>
                    )}
                  </div>
                );
              })}

            {resolvedItems.length > 0 &&
              OVERLAY_ZONES.map((zone) => {
                const box = ZONE_OVERLAY_BOXES[zone];
                return (
                  <div
                    key={`hit-${zone}`}
                    className="absolute cursor-pointer"
                    style={{
                      zIndex: 2,
                      top: `${box.top}%`,
                      left: `${box.left}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                    onMouseEnter={() => setHoveredZone(zone)}
                    onMouseLeave={() => setHoveredZone(null)}
                  />
                );
              })}

            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ zIndex: 3 }}
            >
              <Canvas camera={{ position: [0, 1.8, 6], fov: 45 }}>
                <ambientLight intensity={0.8} />
                <directionalLight position={[3, 5, 3]} intensity={1.2} />

                <Suspense fallback={null}>
                  <MannequinWithClothing
                    model={model}
                    enabledClothes={enabledClothes}
                    activeWear={activeWear}
                    missingLabels={missingLabels}
                    globalTint={globalTint}
                    tintByItemId={tintByItemId}
                    onLoadError={handleLoadError}
                  />
                </Suspense>

                <OrbitControls
                  enablePan={false}
                  enableDamping
                  dampingFactor={0.08}
                  rotateSpeed={0.7}
                  minDistance={4}
                  maxDistance={12}
                  minPolarAngle={Math.PI * 0.35}
                  maxPolarAngle={Math.PI * 0.65}
                />
              </Canvas>
            </div>

            {(displayMissing.length > 0 || unmatchedItems.length > 0) && (
              <div
                className="absolute bottom-2 left-2 right-2 z-10 rounded-xl bg-[var(--surface)]/95 border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-muted)] space-y-1 shadow-sm"
                style={{ zIndex: 4 }}
              >
                {displayMissing.length > 0 && (
                  <p>Missing model for: {displayMissing.join(", ")}</p>
                )}
                {unmatchedItems.length > 0 && (
                  <p>
                    Couldn&apos;t find model for: {unmatchedItems.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEmpty && (
        <div className="relative z-10 w-full shrink-0">
          <EmptyStateOverlay
            position="below"
            showInactivityHint={showInactivityHint}
            onInteraction={handleInteraction}
          />
        </div>
      )}
    </div>
  );
}
