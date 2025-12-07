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

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Adidas Products</h1>
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((p) => (
          <li key={p.id}>
            <Link
              href={`/products/${p.id}`}
              className="block border rounded-2xl p-4 hover:shadow-lg transition-shadow"
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full aspect-square object-cover rounded-xl mb-3"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-200 rounded-xl mb-3 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-gray-600">{p.brand}</div>
              <div className="mt-2 font-semibold text-lg">
                ${(p.priceCents / 100).toFixed(2)}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
