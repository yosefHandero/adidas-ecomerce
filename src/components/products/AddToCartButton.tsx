"use client";

import { useState } from "react";
import { useCart } from "@/stores/cart/useCart";
import { Button } from "@/components/ui/Button";
interface Variant {
  id: number;
  name: string;
  value: string;
  priceCents: number | null;
}

interface AddToCartButtonProps {
  productId: number;
  name: string;
  priceCents: number;
  imageUrl?: string;
  variants?: Variant[];
}

export function AddToCartButton({
  productId,
  name,
  priceCents,
  imageUrl,
  variants: productVariants,
}: AddToCartButtonProps) {
  const [selectedVariant, setSelectedVariant] = useState<number | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const variant = productVariants?.find((v) => v.id === selectedVariant);
      const finalPrice = variant?.priceCents || priceCents;

      addItem({
        productId,
        variantId: selectedVariant,
        name,
        variantName: variant ? `${variant.name}: ${variant.value}` : undefined,
        priceCents: finalPrice,
        quantity,
        imageUrl,
      });

      // Sync with server if authenticated
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            variantId: selectedVariant,
            quantity,
          }),
        });
      } catch (error) {
        console.error("Failed to sync cart with server:", error);
      }

      // Reset quantity
      setQuantity(1);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {productVariants && productVariants.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Variant
          </label>
          <select
            value={selectedVariant || ""}
            onChange={(e) =>
              setSelectedVariant(
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">Default</option>
            {productVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name}: {variant.value}
                {variant.priceCents && variant.priceCents !== priceCents
                  ? ` (+$${((variant.priceCents - priceCents) / 100).toFixed(
                      2
                    )})`
                  : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Quantity:</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
          >
            -
          </button>
          <span className="w-12 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="w-full"
        size="lg"
      >
        {isAdding ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  );
}
