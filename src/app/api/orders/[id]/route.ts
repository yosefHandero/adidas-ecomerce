import { NextRequest, NextResponse } from 'next/server';
import { getServerPocketBase } from '@/lib/auth/server';
import { db } from '@/db/drizzle';
import { orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/orders/[id] - Get single order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pb = await getServerPocketBase();
    const user = pb.authStore.model;

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (order.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user owns this order (or is admin)
    if (user && order[0].userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get order items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    return NextResponse.json({
      order: {
        ...order[0],
        items,
      },
    });
  } catch (error: any) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
