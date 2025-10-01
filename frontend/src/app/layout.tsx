import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";

// Removed next/font (Geist) to avoid network fetch during dev/build.

export const metadata: Metadata = {
  title: "SignalRunner — Discovery-First Lead Platform",
  description: "Paste a URL → receive verified, prioritized leads with evidence-based drafts in ≤10 minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SSR diagnostics: log each render of the root layout
  // This helps identify if server-side rendering crashes before route code runs
  // eslint-disable-next-line no-console
  console.log('[layout] render', { env: process.env.NODE_ENV })
  return (
    <html lang="en">
      <head />
      <body className="antialiased font-sans">
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
