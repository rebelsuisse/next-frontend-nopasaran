// src/app/[lang]/layout.tsx

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from 'next-intl/server';
import { ReactNode } from "react";

interface LangLayoutProps {
  children: ReactNode;
  params: {
    lang: string;
  };
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const resolvedParams = await Promise.resolve(params);
  const t = await getTranslations('Header');
  const tMetadata = await getTranslations('Metadata');

  // On définit l'objet JSON-LD pour le schéma du site web
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'No pasaran - The Wall of Shame',
    url: 'https://www.nopasaran.ch', // URL principale de votre site
    publisher: {
      '@type': 'Organization',
      name: 'Rebel Suisse', // Le nom de l'organisation qui publie
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.nopasaran.ch/logo.png',
      },
    },
    description: tMetadata('siteDescription'),
  };

  return (
    // Le layout racine DOIT contenir les balises <html> et <body>
    <html lang={resolvedParams.lang}>
      {/* C'est une bonne pratique de mettre les styles de fond sur le body */}
      <body className="min-h-screen bg-gray-900 text-gray-200">

        {/* On injecte le script JSON-LD juste après l'ouverture du body */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        
        {/* Votre structure existante est préservée */}
        <Header lang={resolvedParams.lang} t={t} />
        {/* La balise <main> n'a plus besoin des classes de style, car elles sont sur <body> */}
        <main>
          {children}
        </main>
        <Footer lang={resolvedParams.lang} />
      </body>
    </html>
  );
}
