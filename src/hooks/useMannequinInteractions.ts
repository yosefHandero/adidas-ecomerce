import { useState, useEffect, useRef } from "react";

interface UseMannequinInteractionsOptions {
  isEmpty: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
}

export function useMannequinInteractions({
  isEmpty,
  stageRef,
}: UseMannequinInteractionsOptions) {
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showInactivityHint, setShowInactivityHint] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) =>
      setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Inactivity hint timer
  useEffect(() => {
    if (!isEmpty) {
      setShowInactivityHint(false);
      return;
    }

    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityHint(true);
    }, 6000);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isEmpty]);

  useEffect(() => {
    if (!isHovered) {
      setMousePosition(null);
    }
  }, [isHovered]);

  const getPositionFromEvent = (e: MouseEvent | DragEvent): { x: number; y: number } | null => {
    if (!stageRef.current) return null;
    const rect = stageRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const position = getPositionFromEvent(e.nativeEvent);
    if (position) {
      setMousePosition(position);
    }
  };

  const handleInteraction = () => {
    setShowInactivityHint(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  const rotation = isEmpty && !reducedMotion && mousePosition
    ? ((mousePosition.x - 50) / 50) * 3
    : 0;

  return {
    isHovered,
    setIsHovered,
    reducedMotion,
    showInactivityHint,
    mousePosition,
    rotation,
    handleMouseMove,
    handleInteraction,
  };
}
