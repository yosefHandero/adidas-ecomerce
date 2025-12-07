"use client";

import { useCart } from "@/stores/cart/useCart";

export function CartBadge() {
  const itemCount = useCart((s) => s.getItemCount());

  return (
    <span className="rounded-full px-3 py-1 bg-black text-white text-sm font-medium">
      Cart: {itemCount}
    </span>
  );
}
