import { db } from './db/drizzle';
import { products } from './db/schema';
import { desc } from 'drizzle-orm';

export default async function Home() {
  const items = await db.select().from(products).orderBy(desc(products.createdAt));

  return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Adidas Products</h1>
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((p) => (
              <li key={p.id} className="border rounded-2xl p-4">
                <div className="font-medium">{p.name}</div>
                <div className="text-sm opacity-70">{p.brand}</div>
                <div className="mt-2 font-semibold">${(p.priceCents / 100).toFixed(2)}</div>
                {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="mt-3 rounded-xl" />
                ) : null}
              </li>
          ))}
        </ul>
      </main>
  );
}
