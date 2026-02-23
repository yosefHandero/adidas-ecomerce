"use client";

interface EmptyStateOverlayProps {
  showInactivityHint?: boolean;
  onInteraction: () => void;
  isHovered?: boolean;
  /** When "below", renders under the 3D viewer instead of overlaying it */
  position?: "overlay" | "below";
}

export function EmptyStateOverlay({
  showInactivityHint = false,
  onInteraction,
  position = "overlay",
}: EmptyStateOverlayProps) {
  const content = (
    <>
      <h2 className="text-3xl font-bold text-[var(--text)] text-center px-4 mb-2">
        Start with one item
      </h2>
      <p className="text-base text-[var(--text-muted)] text-center px-4">
        I will build the rest of your look
      </p>
      {showInactivityHint && (
        <p className="text-sm text-[var(--text-muted)] text-center px-4 mt-3 animate-fade-in">
          Tip: Describe an item above to get started
        </p>
      )}
    </>
  );

  if (position === "below") {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 px-4 shrink-0 pointer-events-auto text-[var(--text)]"
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
        {content}
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-end pb-16"
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
      {content}
    </div>
  );
}
