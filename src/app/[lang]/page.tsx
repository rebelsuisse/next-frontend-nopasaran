// src/app/[lang]/page.tsx

import { getIncidents } from '@/lib/api';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import PaginationControls from '@/components/PaginationControls';
import ShareButton from '@/components/ShareButton';
import { Metadata } from 'next';
import RandomButton from '@/components/RandomButton';
import { FaBullhorn } from 'react-icons/fa';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import { FaFire } from 'react-icons/fa';

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
      reportButton: t('reportButton'),
      latestIncidents: t('latestIncidents'),
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
  const { title, noIncidents, shareTitle, shareText, shareLabel, copiedLabel, randomButton, reportButton, latestIncidents } = await getPageTranslations(resolvedParams.lang);

  const tCats = await getTranslations({ locale: resolvedParams.lang, namespace: 'Categories' });
  const tParties = await getTranslations({ locale: resolvedParams.lang, namespace: 'Parties' });

  const featuredIncidents = incidents ? incidents.slice(0, 10) : [];

  // CRÉATION DU DICTIONNAIRE DE TRADUCTION
  // On crée un objet simple : { "racism": "Racisme", "fraud": "Fraude", ... }
  // On ne traduit que celles dont on a besoin pour le carrousel
  const carouselTranslations: Record<string, string> = {};
  featuredIncidents.forEach(incident => {
    // Traduction de la Catégorie
    if (incident.category) {
        carouselTranslations[incident.category] = tCats.has(incident.category) 
            ? tCats(incident.category) 
            : incident.category;
    }
    // Traduction du Parti (Affiliation)
    if (incident.sujet?.affiliation) {
        const aff = incident.sujet.affiliation;
        carouselTranslations[aff] = tParties.has(aff) 
            ? tParties(aff) 
            : aff;
    }
  });

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
          
          {/* 1. RANDOM : On passe la taille Large */}
          <RandomButton 
            label={randomButton} 
            lang={resolvedParams.lang}
            size="large" 
          />

          <Link
            href={`/${resolvedParams.lang}/contact`}
            // AJOUTEZ 'leading-6' (ou leading-normal) pour garantir la hauteur du texte
            className="flex items-center gap-2 px-5 py-2.5 text-base leading-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full transition-colors shadow-md"
            title={reportButton}
          >
            <FaBullhorn size={20} /> 
            <span className="hidden sm:inline">{reportButton}</span>
          </Link>

          {/* 3. PARTAGER : On passe la taille Large */}
          <ShareButton
            title={shareTitle}
            text={shareText}
            labels={{ share: shareLabel, copied: copiedLabel }}
            size="large"
          />
        </div>
      </div>

      {/* CARROUSEL */}
      {featuredIncidents.length > 0 && currentPage === 1 && (
        <section className="mb-16"> {/* J'ai mis une section pour espacer */}
          
          {/* LE TITRE AJOUTÉ */}
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-2 px-2">
            <FaFire className="text-orange-500" />
            {latestIncidents}
          </h2>

          <FeaturedCarousel 
             incidents={featuredIncidents} 
             lang={resolvedParams.lang} 
             // On passe le dictionnaire complet
             translations={carouselTranslations} 
          />
        </section>
      )}

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