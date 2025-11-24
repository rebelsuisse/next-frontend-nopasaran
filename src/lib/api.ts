// src/lib/api.ts
import { StrapiApiCollectionResponse, Incident } from "@/types";
import qs from 'qs';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

async function fetchApi<T>(query: string, customOptions: RequestInit = {}): Promise<T> {
  
  const fetchOptions: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // Valeur par défaut (60s) SI rien n'est fourni dans customOptions
    next: { revalidate: 60 },
    
    // On écrase les défauts avec les options personnalisées si elles existent
    ...customOptions,
  };


  try {
    // On exécute la requête
    const res = await fetch(`${STRAPI_URL}/api/${query}`, fetchOptions);

    // VÉRIFICATION CRUCIALE : On s'assure que la réponse est bien du JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Si ce n'est pas du JSON (c'est probablement une page d'erreur HTML),
      // on lit le texte pour le débogage et on lance une erreur claire.
      const responseText = await res.text();
      console.error("Strapi API did not return JSON. This is likely due to a 404 or 500 error on the Strapi server. Response body:", responseText);
      throw new Error(`Expected a JSON response from Strapi, but received '${contentType}'.`);
    }

    // Si la réponse n'est pas "ok" (ex: erreur 400, 403, 404), mais que c'est bien du JSON
    // (Strapi renvoie des erreurs formatées en JSON)
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Strapi API Error (JSON):", errorData.error);
      throw new Error(`Failed to fetch API: ${res.status} ${res.statusText}`);
    }

    // Si tout va bien, on retourne les données JSON
    return res.json();

  } catch (error) {
    // On attrape toutes les autres erreurs (réseau, etc.)
    console.error(`An error occurred in fetchApi for query "${query}":`, error);
    // On propage l'erreur pour que le build de Next.js échoue proprement
    throw error;
  }
}

// Récupère la liste des incidents, triés par date
export async function getIncidents(
  locale: string = 'fr-CH',
  // On ajoute les paramètres pour la pagination avec des valeurs par défaut
  page: number = 1,
  pageSize: number = 10
) {
  // On construit la requête avec qs pour la robustesse
  const queryObject = {
    locale,
    sort: ['incident_date:desc'],
    populate: 'sujet',
    pagination: {
      page: page,
      pageSize: pageSize,
    },
  };

  const query = qs.stringify(queryObject, { encodeValuesOnly: true });

  console.log("HomePage Query:", `the-wall-of-shames?${query}`);

  return fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?${query}`);
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
    year?: string;      // <--- ?
    category?: string;  // <--- ?
    canton?: string;    // <--- ?
    query?: string;     // <--- ?
    affiliation?: string; // <--- ?
    page?: number;
    pageSize?: number;
  }
) {

  const { page = 1, pageSize = 10 } = params;

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

 // Filtre par Parti (Affiliation)
  // On suppose que c'est dans la relation 'sujet' -> champ 'affiliation'
  if (params.affiliation) {
    filters.$and.push({
      sujet: {
        affiliation: { $eq: params.affiliation },
      },
    });
  }

  // On construit la query avec qs
  const queryObject = {
    locale,
    filters,
    sort: 'incident_date:desc',
    populate: 'sujet',
    pagination: {
      page: page,
      pageSize: pageSize,
    },
  };

  if (filters.$and.length === 0) {
    delete queryObject.filters;
  }
  
  const query = qs.stringify(queryObject, { encodeValuesOnly: true });
  console.log("Search Query with Pagination:", `the-wall-of-shames?${query}`);
  
  return fetchApi<StrapiApiCollectionResponse<Incident>>(
    `the-wall-of-shames?${query}`, 
    { 
      cache: 'no-store', // Dit à fetch de ne jamais stocker la réponse
      next: { revalidate: 0 } // Force la revalidation immédiate
    }
  );
}

export async function getAllIncidentsForSitemap() {
  const queryObject = {
    // On ne veut que les champs slug et updatedAt pour être ultra-rapide
    fields: ['slug', 'updatedAt', 'locale'],
    // On récupère un grand nombre d'éléments pour être sûr de tout avoir
    pagination: {
      pageSize: 1000,
    },
  };

  const query = qs.stringify(queryObject, { encodeValuesOnly: true });

  // On utilise le endpoint de base car on veut toutes les langues
  return fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?${query}`);
}

export async function getIncidentsForSitemapByLocale(locale: string) {
  const queryObject = {
    // On spécifie la langue demandée
    locale: locale,
    
    fields: ['slug', 'updatedAt', 'locale'],
    pagination: {
      pageSize: 1000, 
    },
  };
  
  const query = qs.stringify(queryObject, { encodeValuesOnly: true });
  
  return fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?${query}`);
}

export async function getCategoryStats(locale: string): Promise<string[]> {
  // 1. On récupère TOUS les incidents, mais SEULEMENT le champ category
  // Cela rend la requête très légère même s'il y a 1000 incidents
  const queryObject = {
    locale,
    fields: ['category'], 
    pagination: {
      pageSize: 5000, // On met une limite haute pour être sûr de tout avoir
    },
  };

  const query = qs.stringify(queryObject, { encodeValuesOnly: true });
  
  // On utilise fetchApi existant
  const response = await fetchApi<StrapiApiCollectionResponse<{ category: string }>>(`the-wall-of-shames?${query}`);
  
  // 2. On compte les occurrences de chaque catégorie
  const counts: Record<string, number> = {};

  response.data.forEach((incident: any) => {
    const cat = incident.category; 
    
    if (cat) {
      counts[cat] = (counts[cat] || 0) + 1;
    }
  });

  // 3. On transforme l'objet en tableau, on trie et on retourne les clés
  // Exemple: { "racism": 10, "fraud": 2 } -> [ ["racism", 10], ["fraud", 2] ]
  return Object.entries(counts)
    // Tri par nombre décroissant (b - a)
    .sort(([, countA], [, countB]) => countB - countA)
    // On ne garde que le nom de la catégorie
    .map(([category]) => category);
}

export async function getPartyStats(locale: string): Promise<string[]> {
  const queryObject = {
    locale,
    // On ne récupère que l'ID de l'incident pour être léger
    fields: ['id'], 
    // On doit "peupler" le sujet pour avoir son affiliation
    populate: {
      sujet: {
        fields: ['affiliation'] // On ne veut que ce champ
      }
    },
    pagination: {
      pageSize: 5000, // On veut tout scanner
    },
  };

  const query = qs.stringify(queryObject, { encodeValuesOnly: true });
  
  // On utilise 'any' ici pour simplifier le typage de la réponse imbriquée
  const response = await fetchApi<StrapiApiCollectionResponse<any>>(`the-wall-of-shames?${query}`);
  
  const counts: Record<string, number> = {};

  response.data.forEach((incident: any) => {
    // L'affiliation se trouve dans l'objet sujet
    // Attention à la structure Strapi : parfois c'est attributes.affiliation, parfois direct.
    // Avec votre config actuelle, ça devrait être direct :
    const affiliation = incident.sujet?.affiliation; 
    
    if (affiliation) { 
      counts[affiliation] = (counts[affiliation] || 0) + 1;
    }
  });

  // On trie par fréquence (les partis les plus cités en premier)
  return Object.entries(counts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([party]) => party);
}

export async function getYearStats(locale: string): Promise<string[]> {
  const queryObject = {
    locale,
    fields: ['incident_date'], // On ne récupère que la date
    pagination: {
      pageSize: 5000, // On veut tout scanner
    },
  };

  const query = qs.stringify(queryObject, { encodeValuesOnly: true });
  
  // On récupère les données
  const response = await fetchApi<StrapiApiCollectionResponse<{ incident_date: string }>>(`the-wall-of-shames?${query}`);
  
  // On extrait les années uniques
  const yearsSet = new Set<string>();

  response.data.forEach((incident: any) => {
    if (incident.incident_date) {
      const year = new Date(incident.incident_date).getFullYear().toString();
      yearsSet.add(year);
    }
  });

  // On convertit le Set en tableau et on trie du plus récent au plus ancien
  return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
}
