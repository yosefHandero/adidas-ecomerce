import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { products } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';

/**
 * GET /api/products - Get all products
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const conditions = [eq(products.isActive, true)];
    if (categoryId) {
      conditions.push(eq(products.categoryId, parseInt(categoryId)));
    }

    const baseQuery = db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt));

    const items = limit ? await baseQuery.limit(limit) : await baseQuery;

    return NextResponse.json({ products: items });
  } catch (error: any) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
