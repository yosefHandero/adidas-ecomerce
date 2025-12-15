# Premium Empty State Implementation Guide

## Overview

The mannequin empty state has been transformed into a premium, guided, interactive hero experience that teaches users how to use OutfitBuilder.

## Features Implemented

### ✅ 1. Intentional Empty State Copy
- **Primary**: "Start with one item"
- **Secondary**: Changes dynamically on hover
  - Default: "Describe a shoe, shirt, jacket — or upload a photo. I'll style the rest."
  - On hover: "I'll build the rest of your look"
- **Tertiary**: "Works with any brand."
- **Inactivity Hint**: "Tip: Upload a photo for best results." (appears after 6s)

### ✅ 2. Subtle Idle Animation
- **Breathing**: Torso scales 1-2% (4s cycle)
- **Weight Shift**: Slow lateral sway (6s cycle)
- **Glow Pulse**: Soft radial glow behind silhouette (3s cycle)
- All animations respect `prefers-reduced-motion`

### ✅ 3. Hover "Awakening" Moment
- Mannequin opacity increases slightly (0.95 → 1.0)
- Short "walk 1-2 steps" animation (1.2s)
- Smooth ease-in-out transitions
- Secondary text changes dynamically

### ✅ 4. Body-Zone Hint Glows
- Cycling highlights: Feet → Legs → Torso (every 4.5s)
- Subtle opacity (0.05 → 0.15 when active)
- Blur effect for premium feel
- Active zone becomes stronger on hover/focus

### ✅ 5. Ghost Outfit Preview
- Blueprint-style translucent shapes
- Shows top, bottom, and shoes zones
- Low opacity (20%) to not distract
- Disappears when items are added

### ✅ 6. Canvas Depth
- Soft radial gradient centered behind mannequin
- Subtle noise texture (1-2% opacity)
- Mild vignette toward edges
- Minimalist, premium feel

### ✅ 7. Soft CTA Anchor
- "Add your first item →" appears after 700ms
- Fades in smoothly
- Positioned bottom-center
- Disappears when items are added

### ✅ 8. Accessibility
- AA contrast compliance
- Keyboard navigation support (tabIndex, focus states)
- Reduced motion support (disables animations)
- Screen reader friendly (aria-label)

### ✅ 9. Premium Polish
- **Mirror Mode**: Mannequin subtly rotates following cursor (max 3°)
- **Item Added Feedback**: Zone glow + scale pop when item added
- **Inactivity Hint**: Appears after 6s, disappears on interaction
- **Mobile Support**: Touch events trigger hover states

### ✅ 10. Groq API Support
- Added Groq API integration
- Fast inference with Llama 3.1 70B
- Falls back gracefully to other providers

## Customization Guide

### Adjusting Animation Timings

Edit `src/app/globals.css`:

```css
/* Breathing animation speed */
@keyframes breathing {
  0%, 100% { transform: scaleY(1) scaleX(1); }
  50% { transform: scaleY(1.015) scaleX(1.01); } /* Adjust 1.015 for more/less breathing */
}
.mannequin-idle-premium {
  animation: 
    breathing 4s ease-in-out infinite, /* Change 4s to adjust speed */
    weightShift 6s ease-in-out infinite;  /* Change 6s to adjust sway speed */
}
```

### Adjusting Opacities

```css
/* Zone glow intensity */
.zone-glow {
  opacity: 0.15; /* Change to 0.1 for subtler, 0.2 for stronger */
}

/* Ghost outfit opacity */
/* In GhostOutfitOverlay.tsx, change: */
opacity: 0.20; /* Change to 0.1 for subtler, 0.3 for more visible */
```

### Adjusting Inactivity Hint Timing

Edit `src/components/MannequinStage.tsx`:

```typescript
inactivityTimerRef.current = setTimeout(() => {
  setShowInactivityHint(true);
}, 6000); // Change 6000 to adjust delay (milliseconds)
```

### Adjusting CTA Delay

Edit `src/components/EmptyStateOverlay.tsx`:

```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    setShowCTA(true);
  }, 700); // Change 700 to adjust delay (milliseconds)
  return () => clearTimeout(timer);
}, []);
```

### Adjusting Zone Cycling Speed

Edit `src/components/ZoneHighlights.tsx`:

```typescript
const interval = setInterval(() => {
  currentIndex = (currentIndex + 1) % zones.length;
  setCyclingZone(zones[currentIndex]);
}, 4500); // Change 4500 to adjust cycle speed (milliseconds)
```

### Adjusting Mirror Mode Sensitivity

Edit `src/components/MannequinStage.tsx`:

```typescript
const rotation = isEmpty && !reducedMotion
  ? ((mousePosition.x - 50) / 50) * 3  // Change 3 to adjust max rotation (degrees)
  : 0;
```

## Component Structure

```
src/components/
├── MannequinStage.tsx        # Main container with state management
├── EmptyStateOverlay.tsx     # Copy and CTA
├── ZoneHighlights.tsx        # Cycling zone glows
├── GhostOutfitOverlay.tsx    # Blueprint preview
└── ItemChip.tsx             # Interactive item chips
```

## State Machine

The component uses these states:
- `isEmpty`: No items added
- `isHovered`: User hovering over stage
- `reducedMotion`: User prefers reduced motion
- `showInactivityHint`: Show hint after 6s
- `activeZone`: Currently highlighted zone
- `itemAddedZone`: Zone that just received an item

## Mobile Support

- Touch events trigger hover states
- Tap on mannequin stage shows "awakening" animation
- All animations work on mobile
- Reduced motion respected on mobile devices

## Testing Checklist

- [x] Empty state shows all copy correctly
- [x] Idle animations run smoothly
- [x] Hover triggers awakening animation
- [x] Zone glows cycle correctly
- [x] Ghost outfit appears in empty state
- [x] CTA appears after delay
- [x] Inactivity hint appears after 6s
- [x] Item added feedback works
- [x] Mirror mode follows cursor
- [x] Reduced motion disables animations
- [x] Mobile touch events work
- [x] Keyboard navigation works
- [x] Groq API integration works

## Environment Variables

Add to `.env.local`:

```env
OPENAI_API_KEY="your-openai-key"  # Default - recommended
# OR
ANTHROPIC_API_KEY="your-anthropic-key"
# OR
GROQ_API_KEY="your-groq-key"

# Optional
AI_PROVIDER="openai"  # openai, anthropic, or groq
```

## Performance Notes

- All animations use CSS transforms (GPU accelerated)
- Event listeners are properly cleaned up
- No heavy dependencies added
- Smooth 60fps animations
- Minimal re-renders

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS animations with fallbacks
- Touch event support for mobile
- Reduced motion media query support

