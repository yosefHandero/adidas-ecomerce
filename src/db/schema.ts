import { pgTable, serial, text, integer, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);

// Categories
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Products
export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    brand: text('brand').notNull().default('Adidas'),
    description: text('description'),
    priceCents: integer('price_cents').notNull(),
    imageUrl: text('image_url'),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
    stock: integer('stock').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Product Variants (sizes, colors, etc.)
export const variants = pgTable('variants', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // e.g., "Size", "Color"
    value: text('value').notNull(), // e.g., "M", "Red"
    priceCents: integer('price_cents'), // Optional price override
    stock: integer('stock').notNull().default(0),
    sku: text('sku').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Carts (user-specific carts stored in PocketBase, but we keep Drizzle schema for reference)
export const carts = pgTable('carts', {
    id: serial('id').primaryKey(),
    userId: text('user_id'), // PocketBase user ID
    sessionId: text('session_id'), // For guest carts
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Cart Items
export const cartItems = pgTable('cart_items', {
    id: serial('id').primaryKey(),
    cartId: integer('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    variantId: integer('variant_id').references(() => variants.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull().default(1),
    priceCents: integer('price_cents').notNull(), // Snapshot price at time of add
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Orders
export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    userId: text('user_id'), // PocketBase user ID
    orderNumber: text('order_number').notNull().unique(),
    status: orderStatusEnum('status').notNull().default('pending'),
    totalCents: integer('total_cents').notNull(),
    subtotalCents: integer('subtotal_cents').notNull(),
    taxCents: integer('tax_cents').notNull().default(0),
    shippingCents: integer('shipping_cents').notNull().default(0),
    shippingAddress: text('shipping_address'),
    billingAddress: text('billing_address'),
    customerEmail: text('customer_email').notNull(),
    customerName: text('customer_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Order Items
export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
    variantId: integer('variant_id').references(() => variants.id, { onDelete: 'set null' }),
    productName: text('product_name').notNull(), // Snapshot
    variantName: text('variant_name'), // Snapshot
    quantity: integer('quantity').notNull(),
    priceCents: integer('price_cents').notNull(), // Snapshot price
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Reviews (optional)
export const reviews = pgTable('reviews', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    userId: text('user_id'), // PocketBase user ID
    rating: integer('rating').notNull(), // 1-5
    title: text('title'),
    comment: text('comment'),
    isVerified: boolean('is_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
    products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    variants: many(variants),
    cartItems: many(cartItems),
    orderItems: many(orderItems),
    reviews: many(reviews),
}));

export const variantsRelations = relations(variants, ({ one, many }) => ({
    product: one(products, {
        fields: [variants.productId],
        references: [products.id],
    }),
    cartItems: many(cartItems),
    orderItems: many(orderItems),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
    items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
    cart: one(carts, {
        fields: [cartItems.cartId],
        references: [carts.id],
    }),
    product: one(products, {
        fields: [cartItems.productId],
        references: [products.id],
    }),
    variant: one(variants, {
        fields: [cartItems.variantId],
        references: [variants.id],
    }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
    variant: one(variants, {
        fields: [orderItems.variantId],
        references: [variants.id],
    }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
    product: one(products, {
        fields: [reviews.productId],
        references: [products.id],
    }),
}));
