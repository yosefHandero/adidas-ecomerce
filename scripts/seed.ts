import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products, categories, variants } from '../src/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
    // Create categories
    const [runningCategory] = await db
        .insert(categories)
        .values({
            name: 'Running',
            slug: 'running',
            description: 'Performance running shoes',
        })
        .returning();

    const [lifestyleCategory] = await db
        .insert(categories)
        .values({
            name: 'Lifestyle',
            slug: 'lifestyle',
            description: 'Casual everyday shoes',
        })
        .returning();

    // Create products
    const [ultraboost] = await db
        .insert(products)
        .values({
            name: 'Adidas Ultraboost 22',
            slug: 'adidas-ultraboost-22',
            brand: 'Adidas',
            description: 'Premium running shoes with responsive cushioning',
            priceCents: 18000,
            categoryId: runningCategory.id,
            stock: 50,
            imageUrl: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?q=80&w=1059&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        })
        .returning();

    const [samba] = await db
        .insert(products)
        .values({
            name: 'Adidas Samba Classic',
            slug: 'adidas-samba-classic',
            brand: 'Adidas',
            description: 'Iconic classic sneakers',
            priceCents: 9500,
            categoryId: lifestyleCategory.id,
            stock: 30,
            imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop',
        })
        .returning();

    const [gazelle] = await db
        .insert(products)
        .values({
            name: 'Adidas Gazelle',
            slug: 'adidas-gazelle',
            brand: 'Adidas',
            description: 'Timeless retro sneakers',
            priceCents: 10000,
            categoryId: lifestyleCategory.id,
            stock: 25,
            imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1000&auto=format&fit=crop',
        })
        .returning();

    const [forum] = await db
        .insert(products)
        .values({
            name: 'Adidas Forum Low',
            slug: 'adidas-forum-low',
            brand: 'Adidas',
            description: 'Basketball-inspired lifestyle shoes',
            priceCents: 11000,
            categoryId: lifestyleCategory.id,
            stock: 20,
            imageUrl: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=1000&auto=format&fit=crop',
        })
        .returning();

    // Add size variants for Ultraboost
    await db.insert(variants).values([
        { productId: ultraboost.id, name: 'Size', value: '8', stock: 10 },
        { productId: ultraboost.id, name: 'Size', value: '9', stock: 15 },
        { productId: ultraboost.id, name: 'Size', value: '10', stock: 12 },
        { productId: ultraboost.id, name: 'Size', value: '11', stock: 8 },
    ]);

    // Add size variants for Samba
    await db.insert(variants).values([
        { productId: samba.id, name: 'Size', value: '7', stock: 5 },
        { productId: samba.id, name: 'Size', value: '8', stock: 10 },
        { productId: samba.id, name: 'Size', value: '9', stock: 8 },
        { productId: samba.id, name: 'Size', value: '10', stock: 7 },
    ]);

    console.log('✅ Seeded Adidas products, categories, and variants');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
