// src/app/[lang]/search/page.tsx

import { searchIncidents, getCategoryStats, getPartyStats, getYearStats } from '@/lib/api';
import SearchForm from '@/components/SearchForm';
import PaginationControls from '@/components/PaginationControls';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  params: { lang: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const page = Number(resolvedSearchParams.page) || 1;
  // CORRECTION : On utilise 'query' car c'est le nom du champ dans votre SearchForm
  const q = resolvedSearchParams.query || resolvedSearchParams.q; 
  const queryStr = q ? `&query=${q}` : '';

  let canonicalUrl = `/${resolvedParams.lang}/search`;
  
  if (page > 1) {
    canonicalUrl += `?page=${page}`;
    if (queryStr) canonicalUrl += queryStr;
  } else if (queryStr) {
    canonicalUrl += `?query=${q}`; 
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
      allParties: t('allParties'),
      searchButton: t('searchButton'),
  };
}


export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const resolvedParams = await params;
  const resolvedsearchParams = await searchParams;
  
  const { searchTitle, searchFound, searchNotFound, searchPlaceholder, allYears, allCategories, allCantons, allParties, searchButton } = await getPageTranslations(resolvedParams.lang);
  const tParties = await getTranslations({ locale: resolvedParams.lang, namespace: 'Parties' });
  
  const searchFormLabels = {searchPlaceholder, allYears, allCategories, allCantons, allParties, searchButton};
  const currentPage = Number(resolvedsearchParams.page) || 1;

  const getStringParam = (param: string | string[] | undefined): string | undefined => {
    if (Array.isArray(param)) return param[0];
    return param;
  };

  // 3. On ajoute getPartyStats dans le Promise.all
  // Cela permet de charger les incidents, les catégories et les partis en parallèle (rapide)
  const [response, categories, partiesList, years] = await Promise.all([
    searchIncidents(resolvedParams.lang, {
      year: getStringParam(resolvedsearchParams.year),
      category: getStringParam(resolvedsearchParams.category),
      canton: getStringParam(resolvedsearchParams.canton),
      query: getStringParam(resolvedsearchParams.query) || getStringParam(resolvedsearchParams.q),
      affiliation: getStringParam(resolvedsearchParams.affiliation),
      page: currentPage,
      pageSize: 10,
    }),
    getCategoryStats(resolvedParams.lang),
    getPartyStats(resolvedParams.lang),
    getYearStats(resolvedParams.lang)
  ]);

  // 4. On formate la liste dynamique pour l'affichage (Value + Label traduit)
  const formattedParties = partiesList.map(partyKey => ({
    value: partyKey,
    label: tParties.has(partyKey) ? tParties(partyKey) : partyKey
  }));

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
        parties={formattedParties}
        years={years}
        initialValues={resolvedsearchParams}
        labels={searchFormLabels}
      />

      <div>
        <p className="text-gray-400 mb-4">{total} {searchFound}</p>
        
        <div className="bg-gray-800 rounded-lg shadow-lg">
          {incidents && incidents.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {incidents.map(incident => (
                <li key={incident.id}>
                  <Link
                    href={`/${resolvedParams.lang}/the-wall-of-shame/${incident.slug}`}
                    className="block" 
                  >
                    <div className="p-4 hover:bg-gray-700/50 transition-colors">
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>
                          {incident.sujet?.name}<br/>
                          {/* On ajoute "|| ''" pour garantir à TypeScript que c'est une string */}
                          {tParties.has(incident.sujet?.affiliation || '') 
                            ? tParties(incident.sujet?.affiliation || '') 
                            : incident.sujet?.affiliation} - {incident.sujet?.canton}
                        </span>
                        <span className="text-right">
                          {incident.category}<br/>
                          {new Date(incident.incident_date).toLocaleDateString(resolvedParams.lang)}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mt-2">
                        {incident.title}
                      </h3>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center text-gray-500">
              <p>{searchNotFound}</p>
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
    </div>
  );
}