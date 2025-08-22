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
  title: "Steam Games Verification | vlayer POC",
  description: "Verify your Steam game ownership and view your library with playtime statistics. Built with vlayer's verifiable data layer.",
  keywords: "steam, gaming, verification, blockchain, vlayer, game library, playtime",
  authors: [{ name: "vlayer" }],
  creator: "vlayer",
  publisher: "vlayer",
  robots: "index, follow",
  openGraph: {
    title: "Steam Games Verification | vlayer POC",
    description: "Verify your Steam game ownership and view your library with playtime statistics. Built with vlayer's verifiable data layer.",
    type: "website",
    locale: "en_US",
    siteName: "Steam Games Verification",
  },
  twitter: {
    card: "summary_large_image",
    title: "Steam Games Verification | vlayer POC",
    description: "Verify your Steam game ownership and view your library with playtime statistics. Built with vlayer's verifiable data layer.",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#8b5cf6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
