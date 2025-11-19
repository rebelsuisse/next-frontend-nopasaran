// src/app/[lang]/layout.tsx

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getTranslations } from 'next-intl/server';
import { ReactNode } from "react";

export default async function LangLayout({ children, params }: { children: ReactNode; params: { lang: string } }) {
  const resolvedParams = await Promise.resolve(params);

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
