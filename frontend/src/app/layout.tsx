import type { Metadata } from "next";
import { Outfit, Prata } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "./providers/QueryProvider";
import { ToastProvider } from "./providers/ToastProvider";
import ScrollToTop from "@/components/layout/ScrollToTop";

const outfit = Outfit({ subsets: ["latin"] });
const prata = Prata({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Phone Home Kenya - Your Electronics Hub",
  description: "Shop the latest phones, laptops, tablets, and audio devices in Kenya",
  keywords: ["electronics", "phones", "laptops", "tablets", "audio", "Kenya", "Nairobi", "Price in Kenya", "Price in Nairobi"],
  authors: [{ name: "Phone Home Kenya" }],
  openGraph: {
    title: "Phone Home Kenya",
    description: "Shop the latest electronics in Kenya",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <QueryProvider>
          <ScrollToTop />
          {children}
          <ToastProvider />
        </QueryProvider>
      </body>
    </html>
  );
}
