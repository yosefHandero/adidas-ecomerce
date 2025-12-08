import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL is not set' },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    console.log('Running migration to add missing product columns...');

    // Add missing columns one by one
    const migrations = [
      { sql: 'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "slug" text', name: 'Add slug column' },
      { sql: 'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" text', name: 'Add description column' },
      { sql: 'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" integer', name: 'Add category_id column' },
      { sql: 'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stock" integer DEFAULT 0 NOT NULL', name: 'Add stock column' },
      { sql: 'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL', name: 'Add is_active column' },
      { sql: 'ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL', name: 'Add updated_at column' },
    ];

    const results: string[] = [];

    for (const migration of migrations) {
      try {
        await sql(migration.sql);
        results.push(`✓ ${migration.name}`);
        console.log(`✓ ${migration.name}`);
      } catch (error: any) {
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          results.push(`⊘ ${migration.name} (already exists)`);
          console.log(`⊘ ${migration.name} (already exists)`);
        } else {
          throw error;
        }
      }
    }

    // Add unique constraint for slug if it doesn't exist
    try {
      await sql('ALTER TABLE "products" ADD CONSTRAINT IF NOT EXISTS "products_slug_unique" UNIQUE("slug")');
      results.push('✓ Add slug unique constraint');
      console.log('✓ Add slug unique constraint');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        results.push('⊘ Slug unique constraint (already exists)');
        console.log('⊘ Slug unique constraint (already exists)');
      } else {
        // Try without IF NOT EXISTS for older PostgreSQL versions
        try {
          await sql('ALTER TABLE "products" ADD CONSTRAINT "products_slug_unique" UNIQUE("slug")');
          results.push('✓ Add slug unique constraint');
          console.log('✓ Add slug unique constraint');
        } catch (e: any) {
          results.push('⊘ Slug unique constraint (may already exist)');
          console.log('⊘ Slug unique constraint (may already exist)');
        }
      }
    }

    // Add foreign key for category_id if it doesn't exist
    try {
      // Check if constraint exists first
      const checkResult: any = await sql(`
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_category_id_categories_id_fk'
      `);
      
      if (!checkResult || (Array.isArray(checkResult) && checkResult.length === 0)) {
        await sql(`
          ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" 
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE set null
        `);
        results.push('✓ Add category_id foreign key');
        console.log('✓ Add category_id foreign key');
      } else {
        results.push('⊘ Category foreign key (already exists)');
        console.log('⊘ Category foreign key (already exists)');
      }
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        results.push('⊘ Category foreign key (already exists)');
        console.log('⊘ Category foreign key (already exists)');
      } else {
        results.push('⊘ Category foreign key (may already exist or categories table missing)');
        console.log('⊘ Category foreign key (may already exist or categories table missing)');
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully!',
      results,
    });
  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', message: error.message },
      { status: 500 }
    );
  }
}
