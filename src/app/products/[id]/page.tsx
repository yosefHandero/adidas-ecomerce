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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          {p.imageUrl ? (
            <img
              src={p.imageUrl}
              alt={p.name || "Product image"}
              className="w-full rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900">{p.name}</h1>
            <p className="text-sm text-gray-600 mb-4 uppercase tracking-wide">
              {p.brand}
            </p>
            <p className="text-3xl font-semibold mb-6 text-gray-900">
              ${(p.priceCents / 100).toFixed(2)}
            </p>
          </div>

          {p.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed">{p.description}</p>
            </div>
          )}

          {productVariants.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Available Options
              </h2>
              <div className="flex flex-wrap gap-2">
                {productVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className="border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white"
                  >
                    <span className="font-medium text-gray-900">
                      {variant.name}:
                    </span>{" "}
                    <span className="text-gray-700">{variant.value}</span>
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

          <div className="border-t border-gray-200 pt-6">
            <AddToCartButton
              productId={p.id}
              name={p.name}
              priceCents={p.priceCents}
              imageUrl={p.imageUrl || undefined}
              variants={productVariants}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
