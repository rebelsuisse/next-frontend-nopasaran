// src/app/layout.tsx
import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nopasaran.ch'),
  title: "No pasaran - The Wall of Shame",
  description: "Un projet citoyen pour la transparence politique en Suisse.",

  icons: {
    // L'icône principale (haute résolution pour Google)
    icon: '/icon.png', 
    // L'icône pour raccourci (le vieux favicon.ico si vous l'avez)
    shortcut: '/favicon.ico',
    // L'icône pour iPhone/iPad (Apple Touch Icon)
    apple: '/icon.png', // Vous pouvez utiliser la même si elle est carrée
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
