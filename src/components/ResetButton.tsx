interface ResetButtonProps {
  onReset: () => void;
}

export function ResetButton({ onReset }: ResetButtonProps) {
  return (
    <button
      onClick={onReset}
      onTouchStart={onReset}
      className="fixed left-4 sm:left-6 lg:left-8 top-4 sm:top-6 lg:top-8 z-50 cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200 group"
      aria-label="Reset and start over"
      type="button"
    >
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg group-hover:drop-shadow-xl transition-all"
        >
          {/* O - uses --text */}
          <circle
            cx="20"
            cy="32"
            r="10"
            stroke="var(--text)"
            strokeWidth="3.5"
            fill="none"
          />
          {/* B - uses --primary (emerald) */}
          <path
            d="M 36 20 L 36 44 M 36 20 L 50 20 C 54 20 56 22 56 26 C 56 30 54 32 50 32 M 36 32 L 50 32 C 54 32 56 34 56 38 C 56 42 54 44 50 44 L 36 44"
            stroke="var(--primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        {/* Subtle emerald glow on hover */}
        <div className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 bg-[var(--primary)]/20"></div>
      </div>
    </button>
  );
}
