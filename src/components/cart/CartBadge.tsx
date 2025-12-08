"use client";

import { useCart } from "@/stores/cart/useCart";
import Link from "next/link";

export function CartBadge() {
  const itemCount = useCart((s) => s.getItemCount());

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-2 rounded-full px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
    >
      <span>Cart</span>
      {itemCount > 0 && (
        <span className="bg-white text-black rounded-full px-2 py-0.5 text-xs font-bold min-w-[1.5rem] text-center">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
