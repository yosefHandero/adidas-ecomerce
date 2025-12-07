import { getServerPocketBase } from "@/lib/auth/server";
import { db } from "@/db/drizzle";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orderId = parseInt(id);

  if (isNaN(orderId)) {
    notFound();
  }

  const pb = await getServerPocketBase();
  const user = pb.authStore.model;

  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (order.length === 0) {
    notFound();
  }

  // Check authorization
  if (user && order[0].userId !== user.id) {
    notFound();
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const o = order[0];

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Order Confirmation</h1>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-green-800 font-medium">
          Thank you for your order! Your order number is{" "}
          <span className="font-bold">{o.orderNumber}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Order Details</h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Status:</span> {o.status}
            </p>
            <p>
              <span className="font-medium">Date:</span>{" "}
              {new Date(o.createdAt).toLocaleDateString()}
            </p>
            <p>
              <span className="font-medium">Email:</span> {o.customerEmail}
            </p>
          </div>
        </div>

        {o.shippingAddress && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Shipping Address</h2>
            <p className="text-sm whitespace-pre-line">{o.shippingAddress}</p>
          </div>
        )}
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{item.productName}</p>
                {item.variantName && (
                  <p className="text-sm text-gray-600">{item.variantName}</p>
                )}
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>
              </div>
              <p className="font-semibold">
                ${((item.priceCents * item.quantity) / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${(o.subtotalCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${(o.taxCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {o.shippingCents === 0
                ? "Free"
                : `$${(o.shippingCents / 100).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total</span>
            <span>${(o.totalCents / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
