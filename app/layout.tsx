import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GBP Home Art & Decors | Luxury Home Décor",
  description: "Elegant, premium and thoughtfully curated home décor by GBP Home Art & Decors.",
  icons: { icon: "/gbp-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}