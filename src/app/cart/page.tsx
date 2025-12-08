"use client";

import { useCart } from "@/stores/cart/useCart";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const getTotal = useCart((s) => s.getTotal);
  const syncWithServer = useCart((s) => s.syncWithServer);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const sync = async () => {
      setIsSyncing(true);
      try {
        await syncWithServer();
      } finally {
        setIsSyncing(false);
      }
    };
    sync();
  }, [syncWithServer]);

  if (isSyncing) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </main>
    );
  }

  const total = getTotal();
  const subtotal = total;
  const tax = Math.round(total * 0.1); // 10% tax
  const shipping = total > 5000 ? 0 : 1000; // Free shipping over $50
  const finalTotal = subtotal + tax + shipping;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-xl p-6 flex gap-4 bg-white shadow-sm"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.name}
                  </h3>
                  {item.variantName && (
                    <p className="text-sm text-gray-600 mb-2">
                      {item.variantName}
                    </p>
                  )}
                  <p className="text-lg font-semibold text-gray-900">
                    ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-sm text-red-600 hover:text-red-700 hover:underline transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-6 h-fit bg-white shadow-sm sticky top-24">
          <h2 className="text-xl font-semibold mb-6 text-gray-900">
            Order Summary
          </h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>${(subtotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax</span>
              <span>${(tax / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Shipping</span>
              <span>
                {shipping === 0 ? "Free" : `$${(shipping / 100).toFixed(2)}`}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-lg text-gray-900">
              <span>Total</span>
              <span>${(finalTotal / 100).toFixed(2)}</span>
            </div>
          </div>
          <Link href="/checkout" className="block">
            <Button className="w-full" size="lg">
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
