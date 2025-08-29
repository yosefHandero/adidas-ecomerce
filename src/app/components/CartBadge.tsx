'use client';
import { useCart } from '../stores/useCart';

export function CartBadge() {
    const count = useCart((s) => s.count);
    return (
        <span className="rounded-full px-3 py-1 bg-black text-white text-sm">
      Cart: {count}
    </span>
    );
}
