import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCP Security Gateway",
  description: "Security & observability infrastructure for AI agents",
};

function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex gap-6">
      <Link href="/" className="text-white font-semibold hover:text-gray-300">
        Overview
      </Link>
      <Link href="/simulator" className="text-white font-semibold hover:text-gray-300">
        Attack Simulator
      </Link>
      <Link href="/policies" className="text-white font-semibold hover:text-gray-300">
        Policy Manager
      </Link>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}