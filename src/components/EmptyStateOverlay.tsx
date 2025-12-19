"use client";

interface EmptyStateOverlayProps {
  showInactivityHint: boolean;
  onInteraction: () => void;
}

export function EmptyStateOverlay({
  showInactivityHint,
  onInteraction,
}: EmptyStateOverlayProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      onClick={onInteraction}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onInteraction();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Empty state - click to interact"
    >
      {/* Primary Message - positioned below the mannequin (centered horizontally, below center vertically) */}
      <h2
        className="text-3xl font-bold text-gray-900 text-center px-4 absolute left-1/2 transform -translate-x-1/2"
        style={{ top: "calc(50% + 160px)" }}
      >
        Start with one item
      </h2>

      {/* Inactivity hint */}
      {showInactivityHint && (
        <p
          className="text-sm text-gray-600 text-center px-4 absolute left-1/2 transform -translate-x-1/2"
          style={{ top: "calc(50% + 200px)" }}
        >
          Tip: Drag & drop or paste an image for best results
        </p>
      )}
    </div>
  );
}
