// src/app/layout.tsx

import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

// Métadonnées STATIQUES. Elles seront surchargées par le layout de langue.
// C'est une bonne pratique d'en avoir ici en cas de secours.
export const metadata: Metadata = {
  title: "No pasaran - The Wall of Shame",
  // On peut mettre une description générique ou même la laisser vide.
  description: "Un projet citoyen pour la transparence politique en Suisse.",
};

// Le layout racine ne fait que rendre ses enfants. C'est tout.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
