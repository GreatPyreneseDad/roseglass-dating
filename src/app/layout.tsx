import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rose Glass — See clearly. Show up honestly.",
  description:
    "Rose Glass translates dating communication — what someone means beneath what they wrote. Then it helps you respond as yourself, not a performance.",
  openGraph: {
    title: "Rose Glass — See clearly. Show up honestly.",
    description:
      "Understand what they're really saying. Respond as yourself. Translation, not judgment.",
    url: "https://roseglass.online",
    siteName: "Rose Glass",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rose Glass — Dating Translation",
    description: "See what they're really saying. Show up as yourself.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
