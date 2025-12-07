import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { products, variants } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/products/[id] - Get single product
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);

    if (product.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get variants
    const productVariants = await db
      .select()
      .from(variants)
      .where(eq(variants.productId, productId));

    return NextResponse.json({
      product: {
        ...product[0],
        variants: productVariants,
      },
    });
  } catch (error: any) {
    console.error('Product fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
