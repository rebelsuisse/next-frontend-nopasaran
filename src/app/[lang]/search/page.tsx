// src/app/[lang]/search/page.tsx

import { searchIncidents, getCategoryStats } from '@/lib/api';
import SearchForm from '@/components/SearchForm';
import PaginationControls from '@/components/PaginationControls';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

interface SearchPageProps {
  params: { lang: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const page = Number(resolvedSearchParams.page) || 1;
  const query = resolvedSearchParams.q ? `&q=${resolvedSearchParams.q}` : '';

  // Construction de l'URL canonique
  // Exemple: /fr-CH/search?page=2&q=udc
  let canonicalUrl = `/${resolvedParams.lang}/search`;
  
  // On ajoute les params seulement s'ils sont pertinents pour l'indexation
  if (page > 1) {
    canonicalUrl += `?page=${page}`;
    if (query) canonicalUrl += query;
  } else if (query) {
    // Page 1 mais avec recherche
    canonicalUrl += `?q=${resolvedSearchParams.q}`; 
  }

  return {
    title: `Recherche | No pasaran`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

async function getPageTranslations(locale: string) {
  const t = await getTranslations({locale, namespace: 'SearchPage'});
  return {
      searchTitle: t('searchTitle'),
      searchFound: t('searchFound'),
      searchNotFound: t('searchNotFound'),
      searchPlaceholder: t('searchPlaceholder'),
      allYears: t('allYears'),
      allCategories: t('allCategories'),
      allCantons: t('allCantons'),
      searchButton: t('searchButton'),
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const resolvedParams = await params;
  const resolvedsearchParams = await searchParams;
  
  const { searchTitle, searchFound, searchNotFound, searchPlaceholder, allYears, allCategories, allCantons, searchButton } = await getPageTranslations(resolvedParams.lang);

  const searchFormLabels = {searchPlaceholder, allYears, allCategories, allCantons, searchButton};

  const currentPage = Number(resolvedsearchParams.page) || 1;

  // Appel parallèle pour la performance
  // On lance la recherche ET le calcul des catégories en même temps
  const [response, categories] = await Promise.all([
    searchIncidents(resolvedParams.lang, {
      year: resolvedsearchParams.year as string,
      category: resolvedsearchParams.category as string,
      canton: resolvedsearchParams.canton as string,
      query: resolvedsearchParams.query as string,
      page: currentPage,
      pageSize: 10,
    }),
    getCategoryStats(resolvedParams.lang) 
  ]);

  const incidents = response.data;
  const meta = response.meta;
  const total = meta.pagination.total;
  const pageCount = meta.pagination.pageCount;

  const cantons = ["CH", "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">{searchTitle}</h1>
      
      <SearchForm 
        categories={categories}
        cantons={cantons} 
        initialValues={resolvedsearchParams}
        labels={searchFormLabels}
      />
      {/* Affichage des résultats */}
      <div>
        <p className="text-gray-400 mb-4">{total} {searchFound}</p>
        
        {/* Le conteneur extérieur a maintenant le fond et les coins arrondis */}
        <div className="bg-gray-800 rounded-lg shadow-lg">
          {incidents && incidents.length > 0 ? (
            // On utilise une liste <ul> avec des séparateurs automatiques
            <ul className="divide-y divide-gray-700">
              {incidents.map(incident => (
                // Chaque élément est un <li> pour une meilleure sémantique
                <li key={incident.id}>
                  <Link
                    href={`/${resolvedParams.lang}/the-wall-of-shame/${incident.slug}`}
                    // On rend tout le bloc cliquable
                    className="block" 
                  >
                    {/* Le div intérieur n'a plus ni fond ni coins arrondis, juste du padding et un effet de survol */}
                    <div className="p-4 hover:bg-gray-700/50 transition-colors">

                      <div className="flex justify-between text-sm text-gray-400">
                        <span>
                          {incident.sujet?.name}<br/>
                          {incident.sujet?.affiliation} - {incident.sujet?.canton}
                        </span>
                        <span className="text-right">
                          {incident.category}<br/>
                          {new Date(incident.incident_date).toLocaleDateString(resolvedParams.lang)}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold mt-2"> {/* J'ai augmenté la marge mt-1 à mt-2 */}
                        {incident.title}
                      </h3>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            // On garde le message pour l'absence de résultats, mais avec un padding
            <div className="p-10 text-center text-gray-500">
              <p>{searchNotFound}</p>
            </div>
          )}
        </div>

        {/* Afficher les contrôles de pagination */}
        <div className="mt-8 flex justify-center">
          <PaginationControls
            currentPage={currentPage}
            pageCount={pageCount}
          />
        </div>

      </div>
    </div>
  );
}
