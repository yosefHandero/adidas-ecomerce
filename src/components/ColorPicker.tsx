"use client";

import { useRef } from "react";
import { TINT_PRESETS } from "@/lib/colorMap";

export interface ColorPickerProps {
  /** Current color (hex). Undefined = no selection. */
  value?: string;
  /** Called when user selects a swatch or picks a custom color. Pass undefined to clear. */
  onChange: (hex: string | undefined) => void;
  /** Optional label above the row. */
  label?: string;
  /** Preset swatches (defaults to TINT_PRESETS). */
  presets?: { name: string; hex: string }[];
  /** Size of swatches and + button: "sm" | "md". */
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses = {
  sm: { swatch: "w-5 h-5", plus: "w-5 h-5 text-[10px]" },
  md: { swatch: "w-7 h-7", plus: "w-7 h-7 text-xs" },
};

export function ColorPicker({
  value,
  onChange,
  label,
  presets = TINT_PRESETS,
  size = "md",
  className = "",
}: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { swatch: swatchSize, plus: plusSize } = sizeClasses[size];

  const handlePlusClick = () => {
    inputRef.current?.click();
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    if (hex) onChange(hex);
  };

  return (
    <div className={className}>
      {label && (
        <p className="text-[10px] text-[var(--text-muted)] mb-2">{label}</p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map(({ name, hex }) => (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(value === hex ? undefined : hex)}
            className={`${swatchSize} rounded-lg border-2 transition-all shrink-0 ${
              value === hex
                ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
                : "border-[var(--border)] hover:border-[var(--text-muted)]/50"
            }`}
            style={{ backgroundColor: hex }}
            title={name}
            aria-label={`Color ${name}`}
            aria-pressed={value === hex}
          />
        ))}
        <button
          type="button"
          onClick={handlePlusClick}
          className={`${plusSize} rounded-full border-2 border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] flex items-center justify-center shrink-0 transition-all bg-[var(--surface)]`}
          title="Custom color"
          aria-label="Pick custom color"
        >
          +
        </button>
        <input
          ref={inputRef}
          type="color"
          value={value ?? "#22c55e"}
          onChange={handleNativeChange}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>
    </div>
  );
}
