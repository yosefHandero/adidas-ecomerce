import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/auth/server';
import { db } from '@/db/drizzle';
import { orders, orderItems } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/orders - Get user's orders
 */
export async function GET(request: NextRequest) {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt));

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        return { ...order, items };
      })
    );

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error: any) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

/**
 * POST /api/orders - Create new order
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.model;

    const body = await request.json();
    const {
      items,
      shippingAddress,
      billingAddress,
      customerEmail,
      customerName,
      subtotalCents,
      taxCents = 0,
      shippingCents = 0,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    if (!customerEmail || !customerName) {
      return NextResponse.json(
        { error: 'Customer email and name are required' },
        { status: 400 }
      );
    }

    const totalCents = subtotalCents + taxCents + shippingCents;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        userId: user?.id || null,
        orderNumber,
        status: 'pending',
        totalCents,
        subtotalCents,
        taxCents,
        shippingCents,
        shippingAddress: shippingAddress || null,
        billingAddress: billingAddress || null,
        customerEmail,
        customerName,
      })
      .returning();

    // Create order items
    await db.insert(orderItems).values(
      items.map((item: any) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.name,
        variantName: item.variantName || null,
        quantity: item.quantity,
        priceCents: item.priceCents,
      }))
    );

    // Clear cart if user is authenticated
    if (user) {
      try {
        const cart = await pb.collection('carts').getFirstListItem(`user="${user.id}"`);
        await pb.collection('carts').update(cart.id, { items: [] });
      } catch {
        // Cart doesn't exist, ignore
      }
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
