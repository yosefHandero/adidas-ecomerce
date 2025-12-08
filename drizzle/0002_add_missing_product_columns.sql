-- Add missing columns to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "slug" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" integer;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stock" integer DEFAULT 0 NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

-- Add unique constraint for slug
ALTER TABLE "products" ADD CONSTRAINT IF NOT EXISTS "products_slug_unique" UNIQUE("slug");

-- Add foreign key for category_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_category_id_categories_id_fk'
    ) THEN
        ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" 
        FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE set null;
    END IF;
END $$;
