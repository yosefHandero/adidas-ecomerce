import Image from "next/image";
import { OutfitVariation } from "@/lib/types";
import type { SuggestionImage } from "@/hooks/useSuggestionImage";

interface VariationImageProps {
  suggestionImage: {
    image: SuggestionImage | null;
    loading: boolean;
    error: string | null;
  };
  imageLoadError: boolean;
  onImageError: () => void;
  alt: string;
}

function VariationImage({
  suggestionImage,
  imageLoadError,
  onImageError,
  alt,
}: VariationImageProps) {
  return (
    <div className="relative w-full aspect-[3/4] bg-[var(--surface-2)] rounded-xl overflow-hidden border border-[var(--border)]">
      {suggestionImage.loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mb-2"></div>
          <p className="text-xs text-[var(--text-muted)]">Loading image...</p>
        </div>
      ) : suggestionImage.error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface)] p-4 border border-[var(--error)]/30">
          <svg
            className="w-10 h-10 text-[var(--error)] mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs text-[var(--error)] text-center font-medium">
            Failed to load
          </p>
        </div>
      ) : suggestionImage.image && !imageLoadError ? (
        <Image
          src={suggestionImage.image.url}
          alt={alt}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 40vw"
          onError={onImageError}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface-2)]">
          <svg
            className="w-10 h-10 text-[var(--text-muted)] mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-[var(--text-muted)] text-center">No image available</p>
        </div>
      )}
    </div>
  );
}

interface VariationSelectorsProps {
  variations: OutfitVariation[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function VariationSelectors({
  variations,
  selectedIndex,
  onSelect,
}: VariationSelectorsProps) {
  return (
    <div className="pb-4 border-b border-[var(--border)]">
      <div className="flex flex-wrap gap-2">
        {variations.map((v, index) => (
          <button
            key={v.name}
            onClick={() => onSelect(index)}
            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
              selectedIndex === index
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-md"
                : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface)] border border-[var(--border)]"
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>
    </div>
  );
}

interface OutfitSuggestionProps {
  suggestion: string;
  /** Optional label (e.g. "Men", "Women") shown next to "Suggestion" */
  label?: string;
}

function OutfitSuggestion({ suggestion, label }: OutfitSuggestionProps) {
  const heading = label ? `Suggestion (${label})` : "Suggestion";
  return (
    <div>
      <div className="flex items-center mb-2">
        <svg
          className="w-4 h-4 text-[var(--primary)] mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <h3 className="text-base font-semibold text-[var(--text)]">{heading}</h3>
      </div>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed">{suggestion}</p>
    </div>
  );
}

interface StylingTipsProps {
  tips: string[];
  /** Optional label (e.g. "Men", "Women") shown next to "Tips" */
  label?: string;
}

function StylingTips({ tips, label }: StylingTipsProps) {
  if (!tips || tips.length === 0) return null;

  const heading = label ? `Tips (${label})` : "Tips";

  return (
    <div>
      <div className="flex items-center mb-2">
        <svg
          className="w-4 h-4 text-[var(--primary)] mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        <h3 className="text-base font-semibold text-[var(--text)]">{heading}</h3>
      </div>
      <ul className="space-y-1.5">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start text-sm text-[var(--text-muted)]">
            <span className="text-[var(--primary)] mr-2 mt-1 flex-shrink-0">•</span>
            <span className="leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ColorPaletteProps {
  colors: string[];
}

function ColorPalette({ colors }: ColorPaletteProps) {
  if (!colors || colors.length === 0) return null;

  return (
    <div>
      <div className="flex items-center mb-2">
        <svg
          className="w-4 h-4 text-[var(--accent)] mr-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <h3 className="text-base font-semibold text-[var(--text)]">Color palette</h3>
      </div>
      <div className="flex gap-2 flex-wrap">
        {colors.map((color, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-lg border-2 border-[var(--border)] shadow-sm hover:shadow-md hover:scale-110 transition-all cursor-pointer"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}

interface OutfitVariationCardProps {
  variation: OutfitVariation;
  variations: OutfitVariation[];
  selectedIndex: number;
  onSelectVariation: (index: number) => void;
  suggestionImages: {
    manImage: SuggestionImage | null;
    womanImage: SuggestionImage | null;
    loading: boolean;
    error: string | null;
  };
  manImageLoadError: boolean;
  womanImageLoadError: boolean;
  onManImageError: () => void;
  onWomanImageError: () => void;
}

export function OutfitVariationCard({
  variation,
  variations,
  selectedIndex,
  onSelectVariation,
  suggestionImages,
  manImageLoadError,
  womanImageLoadError,
  onManImageError,
  onWomanImageError,
}: OutfitVariationCardProps) {
  const manImageState = {
    image: suggestionImages.manImage,
    loading: suggestionImages.loading,
    error: suggestionImages.error,
  };
  const womanImageState = {
    image: suggestionImages.womanImage,
    loading: suggestionImages.loading,
    error: suggestionImages.error,
  };

  const manSuggestion = variation.suggestion_man ?? variation.suggestion;
  const womanSuggestion = variation.suggestion_woman ?? variation.suggestion;
  const manTips = variation.styling_tips_man ?? variation.styling_tips ?? [];
  const womanTips = variation.styling_tips_woman ?? variation.styling_tips ?? [];

  return (
    <div className="premium-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-4xl mx-auto">
      {/* Top: Variation selectors + Color palette */}
      <div className="mb-6">
        <VariationSelectors
          variations={variations}
          selectedIndex={selectedIndex}
          onSelect={onSelectVariation}
        />
        {variation.color_palette && variation.color_palette.length > 0 && (
          <div className="mt-4">
            <ColorPalette colors={variation.color_palette} />
          </div>
        )}
      </div>

      {/* Two columns: Man (image + description + tips) | Woman (image + description + tips) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* MAN: Image, then Suggestion, then Tips */}
        <div className="flex flex-col space-y-4">
          <VariationImage
            suggestionImage={manImageState}
            imageLoadError={manImageLoadError}
            onImageError={onManImageError}
            alt={`Outfit (men): ${variation.suggestion}`}
          />
          <div className="space-y-4">
            <OutfitSuggestion suggestion={manSuggestion} label="Men" />
            {manTips.length > 0 && <StylingTips tips={manTips} label="Men" />}
          </div>
        </div>

        {/* WOMAN: Image, then Suggestion, then Tips */}
        <div className="flex flex-col space-y-4">
          <VariationImage
            suggestionImage={womanImageState}
            imageLoadError={womanImageLoadError}
            onImageError={onWomanImageError}
            alt={`Outfit (women): ${variation.suggestion}`}
          />
          <div className="space-y-4">
            <OutfitSuggestion suggestion={womanSuggestion} label="Women" />
            {womanTips.length > 0 && <StylingTips tips={womanTips} label="Women" />}
          </div>
        </div>
      </div>
    </div>
  );
}
