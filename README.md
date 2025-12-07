# Adidas E-Commerce

A modern e-commerce application built with Next.js 15, TypeScript, Drizzle ORM, and PocketBase.

## 🚀 Features

- ✅ Full authentication with PocketBase
- ✅ Product catalog with categories and variants
- ✅ Shopping cart with persistence
- ✅ Checkout flow
- ✅ Order management
- ✅ Responsive design
- ✅ Type-safe with TypeScript

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- PocketBase instance (local or hosted)

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/adidas_db"

# PocketBase
POCKETBASE_URL="http://127.0.0.1:8090"
NEXT_PUBLIC_POCKETBASE_URL="http://127.0.0.1:8090"
```

### 3. Set Up PocketBase

1. Download PocketBase from [pocketbase.io](https://pocketbase.io)
2. Run PocketBase: `./pocketbase serve`
3. Access admin UI at `http://127.0.0.1:8090/_/`
4. Create collections:
   - **users** (default collection)
   - **carts** (with `user` relation field)

### 4. Set Up Database

```bash
# Push schema to database
npm run db:push

# Seed sample data
npm run seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
src/
├── app/              # Next.js app router pages and API routes
├── components/       # React components
├── db/              # Drizzle schema and connection
├── lib/             # Utilities (PocketBase, auth)
└── stores/          # Zustand state management
```

## 🗄️ Database

This project uses:

- **Drizzle ORM** for type-safe database queries
- **PostgreSQL** as the database
- **PocketBase** for authentication and cart storage

### Database Commands

```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Run migrations
npm run db:push      # Push schema directly
npm run db:studio    # Open Drizzle Studio
```

## 🔐 Authentication

Authentication is handled by PocketBase:

- Sign up at `/auth/signup`
- Sign in at `/auth/login`
- User menu in header
- Protected API routes

## 🛒 Cart System

- LocalStorage persistence for guests
- PocketBase sync for authenticated users
- Real-time cart updates
- Quantity management

## 📚 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: PocketBase
- **State**: Zustand
- **Styling**: Tailwind CSS

## 📖 Documentation

See [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) for detailed migration and architecture documentation.

## 🚢 Deployment

### PocketBase

Deploy PocketBase to:

- Render
- Railway
- Fly.io
- Or self-host

Update `POCKETBASE_URL` and `NEXT_PUBLIC_POCKETBASE_URL` in production.

### Next.js

Deploy to:

- Vercel (recommended)
- Netlify
- Railway
- Or any Node.js hosting

## 📝 License

MIT
