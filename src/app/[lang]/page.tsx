// src/app/[lang]/page.tsx

import { getIncidents } from '@/lib/api';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import PaginationControls from '@/components/PaginationControls';
import ShareButton from '@/components/ShareButton';
import { Metadata } from 'next';
import RandomButton from '@/components/RandomButton';

interface HomePageProps {
  params: { lang: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params, searchParams }: HomePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations({ locale: resolvedParams.lang, namespace: 'HomePage' });
  
  const tMeta = await getTranslations({ locale: resolvedParams.lang, namespace: 'Metadata' });

  // Logique de pagination pour l'URL Canonique
  const page = Number(resolvedSearchParams.page) || 1;
  
  // Si on est page 1, l'URL canonique est propre (/fr-CH). 
  // Sinon, on ajoute ?page=X (/fr-CH?page=2)
  const canonicalUrl = page > 1 
    ? `/${resolvedParams.lang}?page=${page}` 
    : `/${resolvedParams.lang}`;

  return {
    title: "No pasarán - The Wall of Shame",
    description: tMeta('siteDescription'), 
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

async function getPageTranslations(locale: string) {
  const t = await getTranslations({locale, namespace: 'HomePage'});
  return {
      title: t('title'),
      noIncidents: t('noIncidents'),
      shareTitle: t('shareTitle'),
      shareText: t('shareText'),
      shareLabel: t('shareLabel'),
      copiedLabel: t('copiedLabel'),
      randomButton: t('randomButton'), 
  };
}

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const pageSize = 20;
  const response = await getIncidents(resolvedParams.lang, currentPage, pageSize);
  const incidents = response.data;
  const meta = response.meta;
  const pageCount = meta.pagination.pageCount;

  // On utilise les params résolus
  const { title, noIncidents, shareTitle, shareText, shareLabel, copiedLabel, randomButton } = await getPageTranslations(resolvedParams.lang);

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      {/* 4. Update the header to be a flex container */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-8">
        {/* Left side: Title and description */}
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            The Wall of Shame
          </h1>
          <p className="text-lg text-gray-300 mt-2">
            {title}
          </p>
        </div>

        {/* Zone des boutons (Droite) */}
        <div className="flex flex-shrink-0 gap-3 pt-2 sm:pt-0">
          
          {/* BOUTON RANDOM */}
          <RandomButton 
            label={randomButton} 
            lang={resolvedParams.lang} 
          />

          {/* BOUTON SHARE EXISTANT */}
          <ShareButton
            title={shareTitle}
            text={shareText}
            labels={{ share: shareLabel, copied: copiedLabel }}
          />
        </div>
      </div>

      {/* Conteneur de la liste */}
      <div className="bg-gray-800 rounded-lg shadow-lg">
        {incidents && incidents.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Link
                  href={`/${resolvedParams.lang}/the-wall-of-shame/${incident.slug}`}
                  // On utilise flexbox pour un alignement robuste sur toutes les tailles d'écran
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
                >
                  {/* Titre (prend toute la place disponible) */}
                  <div className="flex-grow mb-2 sm:mb-0">
                    <p className="text-lg font-medium">{incident.title}</p>
                  </div>
                  
                  {/* Date (à droite, ne se réduit pas) */}
                  <div className="flex-shrink-0 text-sm text-gray-300">
                    {new Date(incident.incident_date).toLocaleDateString(resolvedParams.lang, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-500 p-10">
            <p>{noIncidents}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <PaginationControls
          currentPage={currentPage}
          pageCount={pageCount}
        />
      </div>

    </div>
  );
}