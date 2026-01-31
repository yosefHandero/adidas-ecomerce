export function AppHeader() {
  return (
    <header className="mb-8 sm:mb-10 lg:mb-12 text-center">
      <div className="inline-block mb-3">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-3">
          <span className="text-[var(--text)]">O</span>utfit
          <span className="text-[var(--primary)]">B</span>uilder
        </h1>
        <div className="h-1 w-24 mx-auto rounded-full bg-[var(--primary)]/60"></div>
      </div>
      <p className="text-base sm:text-lg text-[var(--text-muted)] font-medium mt-4">
        AI-powered outfit recommendations
      </p>
    </header>
  );
}
