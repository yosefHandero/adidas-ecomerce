import { db } from "@/db/drizzle";
import { products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function Home() {
  const items = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(desc(products.createdAt));

  if (items.length === 0) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Adidas Products</h1>
        <div className="text-center py-12">
          <p className="text-gray-600">No products available at the moment.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Adidas Products</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((p) => (
          <li key={p.id}>
            <Link
              href={`/products/${p.id}`}
              className="block border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all bg-white"
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name || "Product image"}
                  className="w-full aspect-square object-cover rounded-lg mb-3"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No image</span>
                </div>
              )}
              <div className="font-semibold text-gray-900 mb-1">{p.name}</div>
              <div className="text-sm text-gray-600 mb-2">{p.brand}</div>
              <div className="font-semibold text-lg text-gray-900">
                ${(p.priceCents / 100).toFixed(2)}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
