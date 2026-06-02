import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "STL Yard Games — Yard Game Rentals in St. Peters, MO",
  description:
    "Rent premium yard games for your next party, corporate event, graduation, or family gathering in the St. Louis area. Cornhole, Giant Jenga, Connect Four, PutterBall, and more.",
  keywords:
    "yard game rentals, St. Peters MO, cornhole rental, giant jenga rental, STL yard games, party game rentals St. Louis",
  openGraph: {
    title: "STL Yard Games — Yard Game Rentals",
    description:
      "Premium yard game rentals for any occasion in the St. Louis area.",
    url: "https://stlyardgames.com",
    siteName: "STL Yard Games",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" style={{ colorScheme: "light" }}>
      <body className={`${inter.className} min-h-full flex flex-col bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
