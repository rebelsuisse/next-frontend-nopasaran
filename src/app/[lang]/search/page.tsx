// src/app/[lang]/search/page.tsx

import { searchIncidents } from '@/lib/api';
import SearchForm from '@/components/SearchForm';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

interface SearchPageProps {
  params: { lang: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function getPageTranslations(locale: string) {
  const t = await getTranslations({locale, namespace: 'SearchPage'});
  return {
      searchTitle: t('searchTitle'),
      searchFound: t('searchFound'),
      searchNotFound: t('searchNotFound'),
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const resolvedParams = await params;
  const resolvedsearchParams = await searchParams;
  // On utilise les params résolus
  const { searchTitle, searchFound, searchNotFound } = await getPageTranslations(resolvedParams.lang);

  // On récupère les résultats en fonction des paramètres de l'URL
  const response = await searchIncidents(resolvedParams.lang, {
    year: resolvedsearchParams.year as string,
    category: resolvedsearchParams.category as string,
    canton: resolvedsearchParams.canton as string,
    query: resolvedsearchParams.query as string,
  });
  const incidents = response.data;
  const total = response.meta.pagination.total;

  // On prépare les options pour les menus déroulants
  // C'est mieux de les hardcoder si elles ne changent pas souvent, c'est plus performant
  const categories = ["racism", "antisemitism", "sexism", "homophobia", "violence", "fraud", "transphobia", "islamophobia", "neonazism", "xenophobia", "conspiracism", "fascism", "validism", "traffic violation", "other offence", "lie", "other"];
  const cantons = ["CH", "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-white mb-6">{searchTitle}</h1>
      
      {/* Le formulaire de recherche (Composant Client) */}
      <SearchForm 
        categories={categories} 
        cantons={cantons} 
        initialValues={resolvedsearchParams} // On passe les valeurs initiales
      />
      {/* Affichage des résultats */}
      <div>
        <p className="text-gray-400 mb-4">{total} {searchFound}</p>
        
        <div className="space-y-4">
          {incidents && incidents.length > 0 ? (
            incidents.map(incident => (
              <Link
                key={incident.id}
                href={`/${resolvedParams.lang}/the-wall-of-shame/${incident.slug}`}
              >
                <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700">

                  {/* Ligne alignée gauche/droite */}
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>
                      {incident.sujet?.name} - {incident.sujet?.canton}
                    </span>
                    <span>
                      {incident.category} - {new Date(incident.incident_date).toLocaleDateString(resolvedParams.lang)}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-white mt-1">
                    {incident.title}
                  </h3>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500">{searchNotFound}</p>
          )}
        </div>
      </div>
    </div>
  );
}
