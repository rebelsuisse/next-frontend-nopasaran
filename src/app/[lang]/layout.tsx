// src/app/[lang]/layout.tsx

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from 'next-intl/server';
import { ReactNode } from "react";
import type { Metadata } from "next";

// On définit une interface claire pour les props.
interface LangLayoutParams {
  children: ReactNode;
  params: {
    lang: string;
  };
}

// 1. generateMetadata: on attend les params
export async function generateMetadata({ params }: LangLayoutParams): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params); // Méthode robuste
  const t = await getTranslations({ locale: resolvedParams.lang, namespace: 'Metadata' });

  return {
    title: "No pasaran - The Wall of Shame",
    description: t('siteDescription'),
  };
}

// 2. Le layout: on accepte un type plus large, puis on attend
export default async function LangLayout({ children, params }: { children: ReactNode; params: { lang: string } | Promise<{ lang: string }> }) {
  
  // LA LIGNE CLÉ QUI RÉSOUD LE PROBLÈME DE RUNTIME
  const resolvedParams = await params;

  // Le reste de la logique est maintenant sûr
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
      <body className="min-h-screen bg-gray-900 text-gray-200">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        
        <Header lang={resolvedParams.lang} t={tHeader} />
        <main>
          {children}
        </main>
        <Footer lang={resolvedParams.lang} />
      </body>
    </html>
  );
}