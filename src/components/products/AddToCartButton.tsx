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
      const finalPrice = variant?.priceCents ?? priceCents;

      await addItem({
        productId,
        variantId: selectedVariant,
        name,
        variantName: variant ? `${variant.name}: ${variant.value}` : undefined,
        priceCents: finalPrice,
        quantity,
        imageUrl,
      });

      // Reset quantity after successful add
      setQuantity(1);
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {productVariants && productVariants.length > 0 && (
        <div>
          <label
            htmlFor="variant-select"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select Variant
          </label>
          <select
            id="variant-select"
            value={selectedVariant || ""}
            onChange={(e) =>
              setSelectedVariant(
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
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
        <label className="text-sm font-medium text-gray-700">Quantity:</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition"
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
