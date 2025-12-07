import { db } from "@/db/drizzle";
import { products, variants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/products/AddToCartButton";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id);

  if (isNaN(productId)) {
    notFound();
  }

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (product.length === 0 || !product[0].isActive) {
    notFound();
  }

  const productVariants = await db
    .select()
    .from(variants)
    .where(eq(variants.productId, productId));

  const p = product[0];

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.name}
              className="w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-200 rounded-2xl flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{p.name}</h1>
            <p className="text-sm text-gray-600 mb-4">{p.brand}</p>
            <p className="text-2xl font-semibold mb-6">
              ${(p.priceCents / 100).toFixed(2)}
            </p>
          </div>

          {p.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{p.description}</p>
            </div>
          )}

          {productVariants.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Variants</h2>
              <div className="flex flex-wrap gap-2">
                {productVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className="border rounded-lg px-4 py-2 text-sm"
                  >
                    <span className="font-medium">{variant.name}:</span>{" "}
                    <span>{variant.value}</span>
                    {variant.priceCents &&
                      variant.priceCents !== p.priceCents && (
                        <span className="ml-2 text-gray-600">
                          (+$
                          {((variant.priceCents - p.priceCents) / 100).toFixed(
                            2
                          )}
                          )
                        </span>
                      )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <AddToCartButton
            productId={p.id}
            name={p.name}
            priceCents={p.priceCents}
            imageUrl={p.imageUrl || undefined}
            variants={productVariants}
          />
        </div>
      </div>
    </main>
  );
}
