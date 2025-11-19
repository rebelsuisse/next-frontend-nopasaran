// src/app/sitemap.ts

import { MetadataRoute } from 'next';
import { getAllIncidentsForSitemap } from '@/lib/api';

// URL de base de votre site
const BASE_URL = 'https://www.nopasaran.ch';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const languages = ['fr-CH', 'de-CH', 'it-CH', 'en'];

  // 1. Ajouter les pages statiques pour chaque langue
  const staticPages = languages.flatMap(lang => [
    {
      url: `${BASE_URL}/${lang}`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/${lang}/manifesto`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/${lang}/search`,
      lastModified: new Date(),
    },
  ]);

  // 2. Ajouter les pages dynamiques des incidents
  const response = await getAllIncidentsForSitemap();
  const incidents = response.data || [];

  const incidentPages = incidents.flatMap(incident => 
    languages.map(lang => ({
      url: `${BASE_URL}/${lang}/the-wall-of-shame/${incident.slug}`,
      lastModified: new Date(incident.updatedAt), // On utilise la date de mise à jour de l'incident
    }))
  );

  // 3. Combiner les deux listes
  return [...staticPages, ...incidentPages];
}
