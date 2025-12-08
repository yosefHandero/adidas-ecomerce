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

  if (items.length === 0) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Order Details</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No items found for this order.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Order Confirmation</h1>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
        <p className="text-green-800 font-medium text-lg">
          Thank you for your order! Your order number is{" "}
          <span className="font-bold">{o.orderNumber}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Order Details
          </h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              <span className="font-medium text-gray-900">Status:</span>{" "}
              <span className="capitalize">{o.status}</span>
            </p>
            <p className="text-gray-700">
              <span className="font-medium text-gray-900">Date:</span>{" "}
              {new Date(o.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-gray-700">
              <span className="font-medium text-gray-900">Email:</span>{" "}
              {o.customerEmail}
            </p>
          </div>
        </div>

        {o.shippingAddress && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Shipping Address
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {o.shippingAddress}
            </p>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          Order Items
        </h2>
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {item.productName}
                </p>
                {item.variantName && (
                  <p className="text-sm text-gray-600 mb-1">
                    {item.variantName}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Quantity: {item.quantity}
                </p>
              </div>
              <p className="font-semibold text-gray-900 text-lg">
                ${((item.priceCents * item.quantity) / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6 space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>${(o.subtotalCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Tax</span>
            <span>${(o.taxCents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Shipping</span>
            <span>
              {o.shippingCents === 0
                ? "Free"
                : `$${(o.shippingCents / 100).toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-3 text-gray-900">
            <span>Total</span>
            <span>${(o.totalCents / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
