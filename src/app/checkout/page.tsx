"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/stores/cart/useCart";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const getTotal = useCart((s) => s.getTotal);
  const clearCart = useCart((s) => s.clearCart);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    shippingAddress: "",
    billingAddress: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const user = authClient.getCurrentUser();

  // Pre-fill if user is logged in
  useEffect(() => {
    if (user) {
      setFormData({
        customerName: user.name || "",
        customerEmail: user.email || "",
        shippingAddress: "",
        billingAddress: "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link href="/cart">
            <Button>Go to Cart</Button>
          </Link>
        </div>
      </main>
    );
  }

  const subtotal = getTotal();
  const tax = Math.round(subtotal * 0.1);
  const shipping = subtotal > 5000 ? 0 : 1000;
  const total = subtotal + tax + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            variantName: item.variantName,
            quantity: item.quantity,
            priceCents: item.priceCents,
          })),
          ...formData,
          subtotalCents: subtotal,
          taxCents: tax,
          shippingCents: shipping,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create order");
      }

      const { order } = await response.json();
      clearCart();
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              Shipping Information
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Full Name *
                </label>
                <input
                  id="customerName"
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  required
                  autoComplete="name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="customerEmail"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email *
                </label>
                <input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, customerEmail: e.target.value })
                  }
                  required
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="shippingAddress"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Shipping Address *
                </label>
                <textarea
                  id="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingAddress: e.target.value,
                    })
                  }
                  required
                  rows={4}
                  autoComplete="street-address"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>

              <div>
                <label
                  htmlFor="billingAddress"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Billing Address
                </label>
                <textarea
                  id="billingAddress"
                  value={formData.billingAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, billingAddress: e.target.value })
                  }
                  rows={4}
                  autoComplete="billing street-address"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
                  placeholder="Leave blank to use shipping address"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="border border-gray-200 rounded-xl p-6 sticky top-24 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              Order Summary
            </h2>
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm text-gray-700"
                >
                  <span>
                    {item.name} {item.variantName && `(${item.variantName})`} ×{" "}
                    {item.quantity}
                  </span>
                  <span className="font-medium">
                    ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
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
                <span>${(total / 100).toFixed(2)}</span>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </div>
      </form>
    </main>
  );
}
