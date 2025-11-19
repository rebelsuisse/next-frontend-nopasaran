// src/app/layout.tsx

import type { Metadata } from "next";
import { ReactNode } from "react";
// On a seulement besoin de l'import des styles globaux ici
import "./globals.css";

// Les métadonnées ici serviront de fallback si une page n'en définit pas
export const metadata: Metadata = {
  title: "No pasaran - The Wall of Shame",
  description: "Un registre des incidents liés à l'extrême droite en Suisse.",
};

// Le layout racine ne fait plus qu'une seule chose : rendre ses enfants.
// PAS de <html>, PAS de <body>, PAS de Provider.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
