"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/stores/cart/useCart";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

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

  if (items.length === 0) {
    router.push("/cart");
    return null;
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
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              required
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) =>
                setFormData({ ...formData, customerEmail: e.target.value })
              }
              required
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Shipping Address *
            </label>
            <textarea
              value={formData.shippingAddress}
              onChange={(e) =>
                setFormData({ ...formData, shippingAddress: e.target.value })
              }
              required
              rows={4}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Billing Address
            </label>
            <textarea
              value={formData.billingAddress}
              onChange={(e) =>
                setFormData({ ...formData, billingAddress: e.target.value })
              }
              rows={4}
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>
        </div>

        <div>
          <div className="border rounded-lg p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>
                    ${((item.priceCents * item.quantity) / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${(tax / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : `$${(shipping / 100).toFixed(2)}`}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
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
