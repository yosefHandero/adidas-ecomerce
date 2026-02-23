"use client";

import { useState, useRef, useEffect } from "react";
import {
  UserItem,
  OutfitPreferences,
  OCCASIONS,
  FITS,
  WEATHERS,
  BUDGETS,
} from "@/lib/types";
import { CLOTHING } from "@/lib/clothingCatalog";
import { ColorPicker } from "@/components/ColorPicker";

export type MannequinModel = "man" | "woman";

interface OutfitInputPanelProps {
  userItems: UserItem[];
  preferences: OutfitPreferences;
  model: MannequinModel;
  enabledClothes: Record<string, boolean>;
  onEnabledClothesChange: (next: Record<string, boolean>) => void;
  globalTint?: string;
  onGlobalTintChange?: (hex: string | undefined) => void;
  tintByItemId?: Record<string, string>;
  onTintByItemIdChange?: (next: Record<string, string>) => void;
  unmatchedItems?: string[];
  onApplyOutfitText: (text: string) => void;
  isApplyingOutfit?: boolean;
  onModelChange: (model: MannequinModel) => void;
  onItemsChange: (items: UserItem[]) => void;
  onPreferencesChange: (preferences: OutfitPreferences) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function OutfitInputPanel({
  userItems,
  preferences,
  model,
  enabledClothes,
  onEnabledClothesChange,
  globalTint,
  onGlobalTintChange,
  unmatchedItems = [],
  onApplyOutfitText,
  isApplyingOutfit = false,
  onModelChange,
  onItemsChange,
  onPreferencesChange,
  onGenerate,
  isGenerating,
}: OutfitInputPanelProps) {
  const [newItemDescription, setNewItemDescription] = useState("");
  const [outfitText, setOutfitText] = useState("");
  const [openDropdown, setOpenDropdown] = useState<"occasion" | "fit" | "weather" | "budget" | null>(null);
  const occasionRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const weatherRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const ref = openDropdown === "occasion" ? occasionRef : openDropdown === "fit" ? fitRef : openDropdown === "weather" ? weatherRef : openDropdown === "budget" ? budgetRef : null;
      if (ref?.current && !ref.current.contains(target)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const handleAddItem = () => {
    const trimmed = newItemDescription.trim();
    if (!trimmed) return;

    // Prevent adding duplicate items
    if (
      userItems.some(
        (item) => item.description.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      return;
    }

    const newItem: UserItem = {
      id: Date.now().toString(),
      description: trimmed,
    };

    onItemsChange([...userItems, newItem]);
    setNewItemDescription("");

    // Trigger item added feedback
    if (typeof window !== "undefined") {
      setTimeout(() => {
        const event = new CustomEvent("itemAdded", {
          detail: { item: newItem },
        });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  const handleRemoveItem = (id: string) => {
    onItemsChange(userItems.filter((item) => item.id !== id));
  };

  return (
    <div className="h-full min-h-[600px] flex flex-col premium-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 overflow-y-auto">
      <div className="mb-6 pb-4 border-b border-[var(--border)]">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text)] flex items-center mb-4">
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--primary)] mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Build Your Outfit
        </h2>
        {/* Model selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-muted)]">Model</span>
          <div className="inline-flex p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => onModelChange("man")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                model === "man"
                  ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Man
            </button>
            <button
              type="button"
              onClick={() => onModelChange("woman")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                model === "woman"
                  ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Woman
            </button>
          </div>
        </div>
      </div>

      {/* Outfit text → Apply to mannequin */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] border border-[var(--border)] shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Quick outfit
        </h3>
        <p className="text-[10px] text-[var(--text-muted)] mb-2">e.g. green jacket, yellow pants with hat</p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={outfitText}
            onChange={(e) => setOutfitText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onApplyOutfitText(outfitText)}
            placeholder="green jacket, yellow pants, hat"
            className="premium-input flex-1 min-w-0 px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm"
          />
          <button
            type="button"
            onClick={() => onApplyOutfitText(outfitText)}
            disabled={!outfitText.trim() || isApplyingOutfit}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primary-hover)] transition-all shrink-0"
          >
            {isApplyingOutfit ? "Applying…" : "Apply"}
          </button>
        </div>
        {unmatchedItems.length > 0 && (
          <p className="text-[10px] text-[var(--text-muted)]">
            Unmatched: {unmatchedItems.join(", ")}
          </p>
        )}
      </div>

      {/* Clothing toggles */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Clothing
          </h3>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() =>
                onEnabledClothesChange(
                  Object.fromEntries(CLOTHING.map((c) => [c.id, false])),
                )
              }
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--primary)]/40 transition-all"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const all: Record<string, boolean> = {};
                CLOTHING.forEach((c) => { all[c.id] = true; });
                onEnabledClothesChange(all);
              }}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)]/25 transition-all"
            >
              Enable all
            </button>
          </div>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mb-3">Toggle 3D pieces on the mannequin</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CLOTHING.map((item) => {
            const on = enabledClothes[item.id] ?? false;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onEnabledClothesChange({
                    ...enabledClothes,
                    [item.id]: !on,
                  });
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  on
                    ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 shadow-sm"
                    : "bg-[var(--surface)]/80 border-[var(--border)] hover:border-[var(--text-muted)]/50"
                }`}
              >
                <span
                  className={`relative w-8 h-4 rounded-full flex-shrink-0 transition-colors ${
                    on ? "bg-[var(--primary)]" : "bg-[var(--text-muted)]/40"
                  }`}
                  aria-hidden
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                      on ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </span>
                <span className="text-xs font-medium text-[var(--text)] truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
        {onGlobalTintChange && (
          <div className="mt-3">
            <ColorPicker
              value={globalTint}
              onChange={onGlobalTintChange}
              label="Tint (shirt, jacket, pants, etc.)"
              size="md"
            />
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="mb-6">
        <div className="space-y-2.5 mb-4">
          {userItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">
                  {item.description}
                </p>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="ml-3 text-[var(--text-muted)] hover:text-[var(--error)] text-xl font-light w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--error)]/10 transition-all flex-shrink-0"
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
              placeholder="Describe an item (e.g., 'Black leather jacket')"
              className="premium-input w-full px-4 py-3 pl-10 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] placeholder:text-[var(--text-muted)] text-sm"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </div>
          <button
            onClick={handleAddItem}
            disabled={!newItemDescription.trim()}
            className="w-full px-5 py-3 bg-[var(--primary)] text-[var(--on-primary)] rounded-xl hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-md hover:shadow-lg transition-all disabled:hover:shadow-md"
          >
            Add
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-5 mb-6">
        <div ref={occasionRef} className="relative">
          <label className="flex items-center text-sm font-semibold text-[var(--text)] mb-2.5">
            <svg
              className="w-4 h-4 text-[var(--text-muted)] mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Occasion
          </label>
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === "occasion" ? null : "occasion")}
            className="premium-input w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] text-sm text-left flex items-center justify-between"
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "occasion"}
          >
            {preferences.occasion}
            <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
            {openDropdown === "occasion" && (
              <ul
                className="absolute z-20 mt-1 w-full py-1 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] shadow-lg"
                role="listbox"
              >
                {OCCASIONS.map((occ) => (
                  <li
                    key={occ}
                    role="option"
                    aria-selected={preferences.occasion === occ}
                    onClick={() => {
                      onPreferencesChange({ ...preferences, occasion: occ });
                      setOpenDropdown(null);
                    }}
                    className={`px-4 py-3 text-sm cursor-pointer border-b border-[var(--border)] last:border-b-0 first:rounded-t-xl last:rounded-b-xl ${
                      preferences.occasion === occ
                        ? "bg-[var(--surface)] text-[var(--text)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                    }`}
                  >
                    {occ}
                  </li>
                ))}
              </ul>
            )}
        </div>

        <div>
          <label className="flex items-center text-sm font-semibold text-[var(--text)] mb-3">
            <svg
              className="w-4 h-4 text-[var(--text-muted)] mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Vibe
          </label>
          <div className="flex gap-2.5">
            {/* Minimal Card */}
            <button
              type="button"
              onClick={() =>
                onPreferencesChange({
                  ...preferences,
                  vibe: 15,
                })
              }
              className={`relative flex-1 p-3 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                preferences.vibe < 33
                  ? "border-[var(--primary)] bg-[rgba(46,204,113,0.10)] shadow-md"
                  : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)]/50 hover:shadow-sm"
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    preferences.vibe < 33 ? "bg-[var(--primary)]/20" : "bg-[var(--surface)]"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      preferences.vibe < 33 ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    preferences.vibe < 33 ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  Minimal
                </span>
              </div>
              {preferences.vibe < 33 && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--primary)] rounded-full"></div>
              )}
            </button>

            {/* Balanced Card */}
            <button
              type="button"
              onClick={() =>
                onPreferencesChange({
                  ...preferences,
                  vibe: 50,
                })
              }
              className={`relative flex-1 p-3 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                preferences.vibe >= 33 && preferences.vibe < 67
                  ? "border-[var(--primary)] bg-[rgba(46,204,113,0.10)] shadow-md"
                  : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)]/50 hover:shadow-sm"
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    preferences.vibe >= 33 && preferences.vibe < 67
                      ? "bg-[var(--primary)]/20"
                      : "bg-[var(--surface)]"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      preferences.vibe >= 33 && preferences.vibe < 67
                        ? "text-[var(--primary)]"
                        : "text-[var(--text-muted)]"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    preferences.vibe >= 33 && preferences.vibe < 67
                      ? "text-[var(--primary)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  Balanced
                </span>
              </div>
              {preferences.vibe >= 33 && preferences.vibe < 67 && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--primary)] rounded-full"></div>
              )}
            </button>

            {/* Bold Card */}
            <button
              type="button"
              onClick={() =>
                onPreferencesChange({
                  ...preferences,
                  vibe: 85,
                })
              }
              className={`relative flex-1 p-3 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                preferences.vibe >= 67
                  ? "border-[var(--accent)] bg-[rgba(244,196,48,0.10)] shadow-md"
                  : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--accent)]/50 hover:shadow-sm"
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    preferences.vibe >= 67 ? "bg-[var(--accent)]/20" : "bg-[var(--surface)]"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      preferences.vibe >= 67
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-muted)]"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    preferences.vibe >= 67
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  Bold
                </span>
              </div>
              {preferences.vibe >= 67 && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--accent)] rounded-full"></div>
              )}
            </button>
          </div>
        </div>

        <div ref={fitRef} className="relative">
          <label className="flex items-center text-sm font-semibold text-[var(--text)] mb-2.5">
            <svg
              className="w-4 h-4 text-[var(--text-muted)] mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Fit
          </label>
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === "fit" ? null : "fit")}
            className="premium-input w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] text-sm text-left flex items-center justify-between"
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "fit"}
          >
            {preferences.fit}
            <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openDropdown === "fit" && (
            <ul
              className="absolute z-20 mt-1 w-full py-1 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] shadow-lg"
              role="listbox"
            >
              {FITS.map((fit) => (
                <li
                  key={fit}
                  role="option"
                  aria-selected={preferences.fit === fit}
                  onClick={() => {
                    onPreferencesChange({ ...preferences, fit });
                    setOpenDropdown(null);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer border-b border-[var(--border)] last:border-b-0 first:rounded-t-xl last:rounded-b-xl ${
                    preferences.fit === fit
                      ? "bg-[var(--surface)] text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  }`}
                >
                  {fit}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div ref={weatherRef} className="relative">
          <label className="flex items-center text-sm font-semibold text-[var(--text)] mb-2.5">
            <svg
              className="w-4 h-4 text-[var(--text-muted)] mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 009.78 2.096A4.001 4.001 0 0015.5 15H7a4 4 0 01-4-4z"
              />
            </svg>
            Weather
          </label>
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === "weather" ? null : "weather")}
            className="premium-input w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] text-sm text-left flex items-center justify-between"
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "weather"}
          >
            {preferences.weather}
            <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openDropdown === "weather" && (
            <ul
              className="absolute z-20 mt-1 w-full py-1 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] shadow-lg"
              role="listbox"
            >
              {WEATHERS.map((weather) => (
                <li
                  key={weather}
                  role="option"
                  aria-selected={preferences.weather === weather}
                  onClick={() => {
                    onPreferencesChange({ ...preferences, weather });
                    setOpenDropdown(null);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer border-b border-[var(--border)] last:border-b-0 first:rounded-t-xl last:rounded-b-xl ${
                    preferences.weather === weather
                      ? "bg-[var(--surface)] text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  }`}
                >
                  {weather}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div ref={budgetRef} className="relative">
          <label className="flex items-center text-sm font-semibold text-[var(--text)] mb-2.5">
            <svg
              className="w-4 h-4 text-[var(--text-muted)] mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Budget
          </label>
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === "budget" ? null : "budget")}
            className="premium-input w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] text-sm text-left flex items-center justify-between"
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "budget"}
          >
            {preferences.budget === "$" ? "Budget-Friendly" : preferences.budget === "$$" ? "Mid-Range" : "Premium"}
            <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openDropdown === "budget" && (
            <ul
              className="absolute z-20 mt-1 w-full py-1 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] shadow-lg"
              role="listbox"
            >
              {BUDGETS.map((budget) => (
                <li
                  key={budget}
                  role="option"
                  aria-selected={preferences.budget === budget}
                  onClick={() => {
                    onPreferencesChange({ ...preferences, budget });
                    setOpenDropdown(null);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer border-b border-[var(--border)] last:border-b-0 first:rounded-t-xl last:rounded-b-xl ${
                    preferences.budget === budget
                      ? "bg-[var(--surface)] text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  }`}
                >
                  {budget === "$" ? "Budget-Friendly" : budget === "$$" ? "Mid-Range" : "Premium"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Premium Generate Button */}
      <button
        onClick={onGenerate}
        disabled={userItems.length === 0 || isGenerating}
        className="premium-button w-full py-4 bg-[var(--primary)] text-[var(--on-primary)] font-semibold rounded-xl hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:hover:shadow-lg relative overflow-hidden group"
        type="button"
        aria-label={isGenerating ? "Generating outfit..." : "Generate outfit"}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isGenerating ? (
            <>
              <svg
                className="w-5 h-5 button-spinner"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.582m-15.356-2a8.001 8.001 0 0015.357 2m0 0H15"
                />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Build My Outfit
            </>
          )}
        </span>
        {!isGenerating && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--text)]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        )}
      </button>
    </div>
  );
}
