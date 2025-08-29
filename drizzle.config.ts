import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: [
        './src/app/db/schema.ts',
        './src/app/lib/auth-schema.ts',
    ],
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: { url: process.env.DATABASE_URL! },
});
