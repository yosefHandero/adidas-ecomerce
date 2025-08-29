import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    brand: text('brand').notNull().default('Adidas'),
    priceCents: integer('price_cents').notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
