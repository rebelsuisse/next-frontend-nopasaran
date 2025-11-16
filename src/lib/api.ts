// src/lib/api.ts
import { StrapiApiCollectionResponse, Incident } from "@/types";
import qs from 'qs';

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
export async function getIncidents(locale: string = 'fr-CH') {
  const query = `the-wall-of-shames?locale=${locale}&sort=incident_date:desc&populate=sujet`;
  return fetchApi<StrapiApiCollectionResponse<Incident>>(query);
}

// Récupère un incident par son slug
export async function getIncidentBySlug(slug: string, locale: string = 'fr-CH') {
  // On définit notre 'populate' sous forme d'objet JavaScript
  const queryObject = {
    locale,
    filters: {
      slug: {
        $eq: slug,
      },
    },
    populate: {
      sujet: {
        populate: {
          picture: true, // On demande juste les infos de base de l'image
        },
      },
      sources: true,
      evidence_image: true, // On demande juste les infos de base
      localizations: true,
    },
  };

  // La librairie 'qs' va transformer cet objet en une chaîne d'URL parfaite
  const query = qs.stringify(queryObject, {
    encodeValuesOnly: true, // Pour une meilleure gestion des caractères spéciaux
  });

  console.log("Query envoyée à l'API:", `the-wall-of-shames?${query}`);

  return fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?${query}`);
}

// Récupère un incident au hasard (astuce en 2 étapes)
export async function getRandomIncident(locale: string = 'fr-CH') {
  // 1. Obtenir le nombre total d'incidents
  const countResponse = await fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?locale=${locale}&pagination[pageSize]=1`);
  const total = countResponse.meta.pagination.total;

  // 2. Choisir un index au hasard et récupérer un seul incident
  const randomIndex = Math.floor(Math.random() * total);
  const randomQuery = `the-wall-of-shames?locale=${locale}&pagination[start]=${randomIndex}&pagination[limit]=1`;
  return fetchApi<StrapiApiCollectionResponse<Incident>>(randomQuery);
}

export async function searchIncidents(
  locale: string,
  params: {
    year?: string;
    category?: string;
    canton?: string;
    query?: string;
  }
) {
  const filters: any = {
    $and: [],
  };

  // Filtre par année (sur le champ incident_date)
  if (params.year) {
    filters.$and.push({
      incident_date: {
        $gte: `${params.year}-01-01`,
        $lte: `${params.year}-12-31`,
      },
    });
  }

  // Filtre par catégorie
  if (params.category) {
    filters.$and.push({
      category: { $eq: params.category },
    });
  }

  // Filtre par canton (dans la relation sujet)
  if (params.canton) {
    filters.$and.push({
      sujet: {
        canton: { $eq: params.canton },
      },
    });
  }

  // Filtre par texte (sur le titre, la description ou le nom du sujet)
  if (params.query) {
    filters.$and.push({
      $or: [
        { title: { $containsi: params.query } },
        { description: { $containsi: params.query } },
        { sujet: { name: { $containsi: params.query } } },
      ],
    });
  }

  // On construit la query avec qs
  const queryObject = {
    locale,
    filters,
    sort: 'incident_date:desc',
    populate: 'sujet',
  };

  // Si aucun filtre n'est appliqué, on ne met pas un filtre '$and' vide
  if (filters.$and.length === 0) {
    delete queryObject.filters;
  }
  
  const query = qs.stringify(queryObject, { encodeValuesOnly: true });
  console.log("Search Query:", `the-wall-of-shames?${query}`);
  
  return fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?${query}`);
}
