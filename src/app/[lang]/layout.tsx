// src/app/[lang]/layout.tsx

import { ReactNode } from "react";
import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import { Analytics } from "@vercel/analytics/react"; 
import Header from "@/components/Header";
import Footer from "@/components/Footer";
// 1. On déplace l'import CSS ici
import "../globals.css"; 

interface LangLayoutParams {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: LangLayoutParams): Promise<Metadata> {
  const resolvedParams = await params;
  const t = await getTranslations({ locale: resolvedParams.lang, namespace: 'Metadata' });

  return {
    // 2. On intègre les métadonnées qui étaient dans le fichier racine
    metadataBase: new URL('https://www.nopasaran.ch'),
    title: {
      default: "No pasaran - The Wall of Shame",
      template: "%s"
    },
    description: t('siteDescription'),
    
    // Configuration Robots
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Validation Google Search Console
    verification: {
      google: 'zWLhyW2CSI08YzaprTyP9XfgOvClqBLNcT_Abj6JpuM', // Votre code
    },

    // Open Graph
    openGraph: {
      title: 'No pasaran - The Wall of Shame',
      description: 'Record of far-right extremist incidents in Switzerland',
      url: 'https://www.nopasaran.ch',
      siteName: 'No pasaran',
      images: [
        {
          url: 'https://www.nopasaran.ch/icon.png',
          width: 1200,
          height: 630,
          alt: 'Logo No pasaran',
        },
      ],
      type: 'website',
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: 'No pasaran - The Wall of Shame',
      description: 'Record of far-right extremist incidents in Switzerland',
      images: ['https://www.nopasaran.ch/icon.png'],
    },

    // Icônes
    icons: {
      icon: '/icon.png',
      shortcut: '/favicon.ico',
      apple: '/icon.png',
    },
  };
}

export async function generateStaticParams() {
  return [
    { lang: 'fr-CH' },
    { lang: 'de-CH' }
  ];
}

export default async function LangLayout({ children, params }: LangLayoutParams) {
  const resolvedParams = await params;
  const tHeader = await getTranslations({ locale: resolvedParams.lang, namespace: 'Header' });
  const tMetadata = await getTranslations({ locale: resolvedParams.lang, namespace: 'Metadata' });

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'No pasaran - The Wall of Shame',
    url: 'https://www.nopasaran.ch',
    publisher: {
      '@type': 'Organization',
      name: 'Rebel Suisse',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.nopasaran.ch/logo.png',
      },
    },
    description: tMetadata('siteDescription'),
  };

  return (
    <html lang={resolvedParams.lang} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        
        <Header lang={resolvedParams.lang} t={tHeader} />
        <main className="flex-grow">
          {children}
        </main>
        <Footer lang={resolvedParams.lang} />
        <Analytics /> 
      </body>
    </html>
  );
}