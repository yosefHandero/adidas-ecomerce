import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OutfitBuilder - AI Outfit Recommendations",
  description: "Get personalized outfit recommendations powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // #region agent log
  if (typeof window !== "undefined") {
    fetch("http://127.0.0.1:7242/ingest/127737af-b2fa-4ac9-ba95-eecc060c2b51", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "src/app/layout.tsx:20",
        message: "RootLayout rendering",
        data: {
          hasWindow: true,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H1",
      }),
    }).catch(() => {});
  }
  // #endregion
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
