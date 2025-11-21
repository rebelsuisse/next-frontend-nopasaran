// src/app/[lang]/layout.tsx

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from 'next-intl/server';
import { ReactNode } from "react";
import type { Metadata } from "next";

// On définit une interface claire pour les props.
interface LangLayoutParams {
  children: ReactNode;
  // ON DÉCLARE LA VÉRITÉ À TYPESCRIPT : params peut être l'un OU l'autre.
  params: { lang: string } | Promise<{ lang: string }>;
}

// generateMetadata : on utilise la même logique robuste
export async function generateMetadata({ params }: LangLayoutParams): Promise<Metadata> {
  // On attend la résolution, que ce soit une promesse ou non.
  const resolvedParams = await params;
  const t = await getTranslations({ locale: resolvedParams.lang, namespace: 'Metadata' });

  return {
    title: "No pasaran - The Wall of Shame",
    description: t('siteDescription'),
    alternates: {
      canonical: './', 
    },
  };
}

// Le layout : on utilise la même interface LangLayoutParams
export default async function LangLayout({ children, params }: LangLayoutParams) {
  
  // ON ATTEND LA RÉSOLUTION. C'est la clé pour le runtime.
  const resolvedParams = await params;

  // Le reste de la logique est maintenant sûr et correct.
  const tHeader = await getTranslations('Header');
  const tMetadata = await getTranslations('Metadata');

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
    <html lang={resolvedParams.lang}>
      {/*
        By changing the body to a flex container with a column direction and
        making the main content grow, the footer will be pushed to the bottom.
      */}
      <body className="flex flex-col min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        
        <Header lang={resolvedParams.lang} t={tHeader} />
        {/* The 'flex-grow' class allows this element to take up any available space */}
        <main className="flex-grow">
          {children}
        </main>
        <Footer lang={resolvedParams.lang} />
      </body>
    </html>
  );
}