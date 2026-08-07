import type { Metadata } from "next";
import { Nunito, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hassan | Young Web Creator",
  description:
    "Personal portfolio and Young Creators Club for Hassan — a curious Class 5 student who loves learning, creating, and building amazing websites.",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Hassan | Young Web Creator",
    description:
      "A child-safe portfolio and inspiration platform encouraging kids to learn and create.",
    images: ["/og-preview.svg"],
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${outfit.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
