// src/app/[lang]/search/page.tsx

import SearchForm from '@/components/SearchForm';
import PaginationControls from '@/components/PaginationControls';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { formatText } from '@/lib/format';
import { searchIncidents, getSearchFilters } from '@/lib/api';

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
    title: `Recherche | No pasarán`,
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
      resetButton: t('resetButton'),
  };
}

// Liste des cantons (abréviations)
const CANTONS_LIST = ["CH", "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"];

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const resolvedParams = await params;
  const resolvedsearchParams = await searchParams;
  
  const { searchTitle, searchFound, searchNotFound, searchPlaceholder, allYears, allCategories, allCantons, allParties, searchButton, resetButton } = await getPageTranslations(resolvedParams.lang);
  
  // 1. CHARGEMENT DES TRADUCTEURS
  const tParties = await getTranslations({ locale: resolvedParams.lang, namespace: 'Parties' });
  const tCats = await getTranslations({ locale: resolvedParams.lang, namespace: 'Categories' });
  
  const searchFormLabels = {searchPlaceholder, allYears, allCategories, allCantons, allParties, searchButton, resetButton};
  const currentPage = Number(resolvedsearchParams.page) || 1;

  const getStringParam = (param: string | string[] | undefined): string | undefined => {
    if (Array.isArray(param)) return param[0];
    return param;
  };

  // 2. RÉCUPÉRATION DES DONNÉES API
  // Note: j'ai renommé 'categories' en 'categoriesRaw' pour éviter la confusion
  const [response, filters] = await Promise.all([
    searchIncidents(resolvedParams.lang, {
       // ... (vos paramètres inchangés) ...
       year: getStringParam(resolvedsearchParams.year),
       category: getStringParam(resolvedsearchParams.category),
       canton: getStringParam(resolvedsearchParams.canton),
       query: getStringParam(resolvedsearchParams.query) || getStringParam(resolvedsearchParams.q),
       affiliation: getStringParam(resolvedsearchParams.affiliation),
       page: currentPage,
       pageSize: 10,
    }),
    getSearchFilters(resolvedParams.lang)
  ]);

  // On déstructure le résultat
  const { categories: categoriesRaw, parties: partiesList, years } = filters;

  // 3. FORMATAGE DES LISTES POUR LE FORMULAIRE (Objet {value, label})

  // Formatage des Partis
  const formattedParties = partiesList.map(partyKey => ({
    value: partyKey,
    label: tParties.has(partyKey) ? tParties(partyKey) : partyKey
  }));

  // Formatage des Catégories (NOUVEAU)
  const formattedCategories = categoriesRaw.map(catKey => ({
    value: catKey,
    label: tCats.has(catKey) ? tCats(catKey) : catKey
  }));

  // Formatage des Cantons (Pour uniformiser le type passé à SearchForm)
  const formattedCantons = CANTONS_LIST.map(canton => ({
    value: canton,
    label: canton // On garde l'abréviation comme label
  }));

  const incidents = response.data;
  const meta = response.meta;
  const total = meta.pagination.total;
  const pageCount = meta.pagination.pageCount;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">{searchTitle}</h1>
      
      <SearchForm 
        categories={formattedCategories} // On passe la liste d'objets traduits
        cantons={formattedCantons}       // On passe la liste d'objets
        parties={formattedParties}
        years={years}
        initialValues={resolvedsearchParams}
        labels={searchFormLabels}
      />

      <div>
        <p className="text-gray-300 mb-4">{total} {searchFound}</p>
        
        <div className="bg-gray-800 rounded-lg shadow-lg">
          {incidents && incidents.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {incidents.map(incident => (
                <li key={incident.id}>
                  <Link
                    href={{
                      pathname: `/${resolvedParams.lang}/the-wall-of-shame/${incident.slug}`,
                      query: { 
                        ctx: 'search', 
                        // On propage les filtres actuels pour que la page de détail puisse calculer le suivant
                        ...resolvedsearchParams 
                      }
                    }}
                    className="block" 
                  >
                    <div className="p-4 hover:bg-gray-700/50 transition-colors">
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>
                          {incident.sujet?.name}<br/>
                          {tParties.has(incident.sujet?.affiliation || '') 
                            ? tParties(incident.sujet?.affiliation || '') 
                            : incident.sujet?.affiliation} - {incident.sujet?.canton}
                        </span>
                        <span className="text-right">
                          {/* 4. AFFICHAGE TRADUIT DANS LES RÉSULTATS */}
                          <span>
                            {tCats.has(incident.category) ? tCats(incident.category) : incident.category}
                          </span>
                          <br/>
                          {new Date(incident.incident_date).toLocaleDateString(resolvedParams.lang)}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mt-2">
                        {formatText(incident.title)}
                      </h3>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-10 text-center text-gray-400">
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
