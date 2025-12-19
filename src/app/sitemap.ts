// src/app/sitemap.ts

import { MetadataRoute } from 'next';
import { getIncidentsForSitemapByLocale } from '@/lib/api';

// URL de base de votre site
const BASE_URL = 'https://www.nopasaran.ch';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const languages = ['fr-CH', 'de-CH', 'it-CH', 'en'];

  const staticPages = languages.flatMap(lang => [
    { url: `${BASE_URL}/${lang}`, lastModified: new Date() },
    { url: `${BASE_URL}/${lang}/manifesto`, lastModified: new Date() },
    { url: `${BASE_URL}/${lang}/search`, lastModified: new Date() },
  ]);

  const promises = languages.map(lang => getIncidentsForSitemapByLocale(lang));

  // On attend que TOUS les appels API soient terminés en parallèle
  const responsesByLocale = await Promise.all(promises);
  
  // On fusionne les résultats de tous les appels en une seule liste d'incidents
  const allIncidents = responsesByLocale.flatMap(response => response.data || []);

  // La logique pour transformer les incidents en URLs de sitemap est la même qu'avant
  const incidentPages = allIncidents.map(incident => {
    return {
      url: `${BASE_URL}/${incident.locale}/the-wall-of-shame/${incident.slug}`,
      lastModified: new Date(incident.updatedAt),
    };
  });

  // On combine les pages statiques et dynamiques
  return [...staticPages, ...incidentPages];
}
