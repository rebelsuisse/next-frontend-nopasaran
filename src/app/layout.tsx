// src/app/layout.tsx
import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nopasaran.ch'),
  title: {
    default: "No pasaran - The Wall of Shame",
    template: "%s | No pasaran" // Permet d'avoir "Titre Page | No pasaran" automatiquement
  },
  description: "Record of far-right extremist incidents in Switzerland",

  robots: {
    index: true,
    follow: true,
    nocache: false, // On autorise le cache Google
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1, // Pas de limite de durée
      'max-image-preview': 'large', // Affiche une grande image dans Google Discover (Important !)
      'max-snippet': -1, // Pas de limite de caractères pour la description
    },
  },

  // Validation Google Search Console
  // code ci-dessous west celui donné par la Search Console
  verification: {
    google: 'zWLhyW2CSI08YzaprTyP9XfgOvClqBLNcT_Abj6JpuM',
    // yandex: 'yandex-verification-code',
    // other: { me: ['my-email', 'my-link'] },
  },

  // Open Graph (Pour Facebook, LinkedIn, Discord...)
  openGraph: {
    title: 'No pasaran - The Wall of Shame',
    description: 'Record of far-right extremist incidents in Switzerland',
    url: 'https://www.nopasaran.ch',
    siteName: 'No pasaran',
    type: 'website',
    images: [
      {
        url: '/icon.png',  // TODO change image
        width: 1200,
        height: 630,
        alt: 'Logo No pasaran',
      },
    ],
  },

  // Twitter Card (Pour X / Twitter)
  twitter: {
    card: 'summary_large_image',
    title: 'No pasaran - The Wall of Shame',
    description: 'Record of far-right extremist incidents in Switzerland',
    // images: ['/logo.png'], // Next.js utilisera l'image OG par défaut si absente ici
  },

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
