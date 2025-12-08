import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { CartBadge } from "@/components/cart/CartBadge";
import { UserMenu } from "@/components/auth/UserMenu";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adidas E-Commerce",
  description: "Shop the latest Adidas products",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <header className="border-b border-gray-200 sticky top-0 bg-white z-50 shadow-sm">
            <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link
                href="/"
                className="text-2xl font-bold text-gray-900 hover:opacity-80 transition"
              >
                Adidas
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/cart" className="hover:opacity-80 transition">
                  <CartBadge />
                </Link>
                <UserMenu />
              </div>
            </nav>
          </header>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ErrorBoundary>
      </body>
    </html>
  );
}
