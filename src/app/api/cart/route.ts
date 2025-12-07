import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/auth/server';
import { db } from '@/db/drizzle';
import { products, variants } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/cart - Get user's cart
 */
export async function GET(request: NextRequest) {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.model;

    if (!user) {
      // Return empty cart for guests
      return NextResponse.json({ items: [] });
    }

    // Get cart from PocketBase
    const cart = await pb.collection('carts').getFirstListItem(`user="${user.id}"`, {
      expand: 'items.product,items.variant',
    });

    // Transform to frontend format
    const items = (cart.expand?.items || []).map((item: any) => ({
      id: item.id,
      productId: item.product,
      variantId: item.variant || undefined,
      name: item.expand?.product?.name || '',
      variantName: item.expand?.variant ? `${item.expand.variant.name}: ${item.expand.variant.value}` : undefined,
      priceCents: item.priceCents,
      quantity: item.quantity,
      imageUrl: item.expand?.product?.imageUrl || undefined,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    // If cart doesn't exist, return empty
    if (error.status === 404) {
      return NextResponse.json({ items: [] });
    }
    console.error('Cart fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

/**
 * POST /api/cart - Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get product to get price
    const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (product.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let priceCents = product[0].priceCents;
    if (variantId) {
      const variant = await db.select().from(variants).where(eq(variants.id, variantId)).limit(1);
      if (variant.length > 0 && variant[0].priceCents) {
        priceCents = variant[0].priceCents;
      }
    }

    // Get or create cart
    let cart;
    try {
      cart = await pb.collection('carts').getFirstListItem(`user="${user.id}"`);
    } catch {
      cart = await pb.collection('carts').create({
        user: user.id,
        items: [],
      });
    }

    // Check if item already exists
    const existingItem = cart.items?.find(
      (item: any) => item.product === productId && item.variant === variantId
    );

    if (existingItem) {
      // Update quantity
      const updatedItems = cart.items.map((item: any) =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      await pb.collection('carts').update(cart.id, { items: updatedItems });
    } else {
      // Add new item
      const newItem = {
        product: productId,
        variant: variantId || null,
        quantity,
        priceCents,
      };
      await pb.collection('carts').update(cart.id, {
        items: [...(cart.items || []), newItem],
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cart add error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add item to cart' }, { status: 500 });
  }
}

/**
 * DELETE /api/cart - Remove item from cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const cart = await pb.collection('carts').getFirstListItem(`user="${user.id}"`);
    const updatedItems = cart.items.filter((item: any) => item.id !== itemId);

    await pb.collection('carts').update(cart.id, { items: updatedItems });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cart remove error:', error);
    return NextResponse.json({ error: 'Failed to remove item from cart' }, { status: 500 });
  }
}

/**
 * PATCH /api/cart - Update item quantity
 */
export async function PATCH(request: NextRequest) {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || quantity === undefined) {
      return NextResponse.json({ error: 'Item ID and quantity are required' }, { status: 400 });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      return DELETE(request);
    }

    const cart = await pb.collection('carts').getFirstListItem(`user="${user.id}"`);
    const updatedItems = cart.items.map((item: any) =>
      item.id === itemId ? { ...item, quantity } : item
    );

    await pb.collection('carts').update(cart.id, { items: updatedItems });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cart update error:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}
