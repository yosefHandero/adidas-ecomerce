import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { products } from '../src/app/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function main() {
    await db.insert(products).values([
        {
            name: 'Adidas Ultraboost 22',
            brand: 'Adidas',
            priceCents: 18000,
            imageUrl: 'https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?q=80&w=1059&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        },
        {
            name: 'Adidas Samba Classic',
            brand: 'Adidas',
            priceCents: 9500,
            imageUrl: 'https://images.adidas.com/samba-classic.jpg',
        },
        {
            name: 'Adidas Gazelle',
            brand: 'Adidas',
            priceCents: 10000,
            imageUrl: 'https://images.adidas.com/gazelle.jpg',
        },
        {
            name: 'Adidas Forum Low',
            brand: 'Adidas',
            priceCents: 11000,
            imageUrl: 'https://images.adidas.com/forum-low.jpg',
        },
    ]);

    console.log('✅ Seeded Adidas products');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
