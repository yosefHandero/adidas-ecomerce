/**
 * Map color names (lowercase) to hex. Used for outfit text parsing and 3D tinting.
 */

const COLOR_TO_HEX: Record<string, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
  blue: "#3b82f6",
  black: "#171717",
  white: "#fafafa",
  gray: "#737373",
  grey: "#737373",
  brown: "#a16207",
  purple: "#a855f7",
  pink: "#ec4899",
  orange: "#f97316",
  navy: "#1e3a8a",
  beige: "#d4b896",
  olive: "#6b7280",
  tan: "#d2b48c",
  cream: "#fffdd0",
};

export function colorNameToHex(name: string): string | undefined {
  if (!name || typeof name !== "string") return undefined;
  return COLOR_TO_HEX[name.toLowerCase().trim()];
}

/** Preset hex colors for tint chips (green theme first). */
export const TINT_PRESETS: { name: string; hex: string }[] = [
  { name: "Green", hex: "#22c55e" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Black", hex: "#171717" },
  { name: "White", hex: "#fafafa" },
  { name: "Red", hex: "#ef4444" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Gray", hex: "#737373" },
];
