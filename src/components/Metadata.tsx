// src/components/Metadata.tsx

import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

// Ce composant ne retourne rien de visible, il affecte le <head>
export async function generatePageMetadata({ lang }: { lang: string }): Promise<Metadata> {
  const t = await getTranslations({ locale: lang, namespace: 'Metadata' });
  return {
    description: t('siteDescription'),
  };
}

export async function WebsiteSchema({ lang }: { lang: string }) {
  const t = await getTranslations({ locale: lang, namespace: 'Metadata' });

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
    description: t('siteDescription'),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
    />
  );
}