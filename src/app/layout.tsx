import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nopasaran.ch - The Wall of Shame",
  description: "Un registre des incidents liés à l'extrême droite en Suisse.",
};

// Ce layout est simple. Il ne reçoit que 'children'.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // On met 'fr' en dur pour l'instant, ou on pourrait le laisser vide.
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
