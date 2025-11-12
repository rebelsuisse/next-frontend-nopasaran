// src/lib/api.ts
import { StrapiApiCollectionResponse, Incident } from "@/types";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

// Fonction de base pour gérer les appels fetch
async function fetchApi<T>(query: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api/${query}`, {
    // On met en cache pendant 60 secondes pour de meilleures performances
    next: { revalidate: 60 }
  });

  if (!res.ok) {
    const error = await res.json();
    console.error("Strapi API Error:", error.error);
    throw new Error(`Failed to fetch API: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Récupère la liste des incidents, triés par date
export async function getIncidents(locale: string = 'fr') {
  const query = `the-wall-of-shames?locale=${locale}&sort=incident_date:desc&populate=sujet`;
  return fetchApi<StrapiApiCollectionResponse<Incident>>(query);
}

// Récupère un incident par son slug
export async function getIncidentBySlug(slug: string, locale: string = 'fr') {
  // On peuple toutes les relations pour la page de détail
  const query = `the-wall-of-shames?locale=${locale}&filters[slug][$eq]=${slug}&populate=sujet.picture,sources,evidence_image,localizations`;
  return fetchApi<StrapiApiCollectionResponse<Incident>>(query);
}

// Recherche des incidents
export async function searchIncidents(searchTerm: string, locale: string = 'fr') {
  const query = `the-wall-of-shames?locale=${locale}&filters[$or][0][title][$contains]=${searchTerm}&filters[$or][1][description][$contains]=${searchTerm}&populate=sujet`;
  return fetchApi<StrapiApiCollectionResponse<Incident>>(query);
}

// Récupère un incident au hasard (astuce en 2 étapes)
export async function getRandomIncident(locale: string = 'fr') {
  // 1. Obtenir le nombre total d'incidents
  const countResponse = await fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?locale=${locale}&pagination[pageSize]=1`);
  const total = countResponse.meta.pagination.total;

  // 2. Choisir un index au hasard et récupérer un seul incident
  const randomIndex = Math.floor(Math.random() * total);
  const randomQuery = `the-wall-of-shames?locale=${locale}&pagination[start]=${randomIndex}&pagination[limit]=1`;
  return fetchApi<StrapiApiCollectionResponse<Incident>>(randomQuery);
}
