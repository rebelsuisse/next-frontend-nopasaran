// src/lib/api.ts
import { StrapiApiCollectionResponse, Incident } from "@/types";
import qs from 'qs';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
const STANDARD_SORT = ['incident_date:desc', 'createdAt:desc'];

interface SearchFilters {
  categories: string[];
  parties: string[];
  years: string[];
}

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
  page: number = 1,
  pageSize: number = 10
) {
  const queryObject = {
    locale,
    sort: ['incident_date:desc', 'createdAt:desc'], // (Notre tri standard)
    
    // On demande explicitement les images
    populate: {
      sujet: {
        populate: {
          picture: true // <--- Photo du sujet
        }
      },
      evidence_image: true, // <--- Images de preuve
    },
    
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
    sort: STANDARD_SORT,
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
      pageSize: 5000,
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
      pageSize: 5000, 
    },
  };
  
  const query = qs.stringify(queryObject, { encodeValuesOnly: true });
  
  return fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?${query}`);
}

export async function getCategoryStats(locale: string): Promise<string[]> {
  let allIncidents: any[] = [];
  let currentPage = 1;
  let pageCount = 1;

  do {
    const queryObject = {
      locale,
      fields: ['category'], 
      pagination: { page: currentPage, pageSize: 100 },
    };
    const query = qs.stringify(queryObject, { encodeValuesOnly: true });
    
    // Cache 1h ---
    const response = await fetchApi<StrapiApiCollectionResponse<{ category: string }>>(
      `the-wall-of-shames?${query}`,
      { next: { revalidate: 3600 } }
    );

    allIncidents = [...allIncidents, ...response.data];
    pageCount = response.meta.pagination.pageCount;
    currentPage++;
  } while (currentPage <= pageCount);
  
  const counts: Record<string, number> = {};
  allIncidents.forEach((incident: any) => {
    const cat = incident.category; 
    if (cat) counts[cat] = (counts[cat] || 0) + 1;
  });

  return Object.entries(counts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([category]) => category);
}

export async function getPartyStats(locale: string): Promise<string[]> {
  let allIncidents: any[] = [];
  let currentPage = 1;
  let pageCount = 1;

  // On garde la boucle pour être exhaustif
  do {
    const queryObject = {
      locale,
      fields: ['id'], 
      populate: { sujet: { fields: ['affiliation'] } },
      pagination: { page: currentPage, pageSize: 100 },
    };
    const query = qs.stringify(queryObject, { encodeValuesOnly: true });

    // Au lieu de cache: 'no-store', on met un cache long (3600s = 1 heure)
    // Vercel ne refera ce calcul lourd qu'une fois par heure.
    const response = await fetchApi<StrapiApiCollectionResponse<any>>(
      `the-wall-of-shames?${query}`,
      { next: { revalidate: 3600 } } 
    );

    allIncidents = [...allIncidents, ...response.data];
    pageCount = response.meta.pagination.pageCount;
    currentPage++;

  } while (currentPage <= pageCount);

  const counts: Record<string, number> = {};
  allIncidents.forEach((incident: any) => {
    const affiliation = incident.sujet?.affiliation; 
    if (affiliation) counts[affiliation] = (counts[affiliation] || 0) + 1;
  });

  return Object.entries(counts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([party]) => party);
}

export async function getYearStats(locale: string): Promise<string[]> {
  let allIncidents: any[] = [];
  let currentPage = 1;
  let pageCount = 1;

  do {
    const queryObject = {
      locale,
      fields: ['incident_date'],
      pagination: { page: currentPage, pageSize: 100 },
    };
    const query = qs.stringify(queryObject, { encodeValuesOnly: true });
    
    // Cache 1h ---
    const response = await fetchApi<StrapiApiCollectionResponse<{ incident_date: string }>>(
      `the-wall-of-shames?${query}`,
      { next: { revalidate: 3600 } }
    );

    allIncidents = [...allIncidents, ...response.data];
    pageCount = response.meta.pagination.pageCount;
    currentPage++;
  } while (currentPage <= pageCount);
  
  const yearsSet = new Set<string>();
  allIncidents.forEach((incident: any) => {
    if (incident.incident_date) {
      const year = new Date(incident.incident_date).getFullYear().toString();
      yearsSet.add(year);
    }
  });

  return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
}

export async function getAdjacentSlugs(
  currentSlug: string,
  locale: string,
  context: 'default' | 'search',
  searchParams?: any
): Promise<{ prev: string | null; next: string | null }> {
  
  let queryObject: any;

  // 1. DÉFINITION DU TRI ET DES FILTRES
  if (context === 'search') {
    // --- CONTEXTE RECHERCHE (Filtres appliqués) ---
    const filters: any = { $and: [] };
    if (searchParams.year) filters.$and.push({ incident_date: { $gte: `${searchParams.year}-01-01`, $lte: `${searchParams.year}-12-31` } });
    if (searchParams.category) filters.$and.push({ category: { $eq: searchParams.category } });
    if (searchParams.canton) filters.$and.push({ sujet: { canton: { $eq: searchParams.canton } } });
    if (searchParams.affiliation) filters.$and.push({ sujet: { affiliation: { $eq: searchParams.affiliation } } });
    if (searchParams.query) {
      filters.$and.push({
        $or: [
          { title: { $containsi: searchParams.query } },
          { description: { $containsi: searchParams.query } },
          { sujet: { name: { $containsi: searchParams.query } } },
        ],
      });
    }

    queryObject = {
      locale,
      filters: filters.$and.length > 0 ? filters : undefined,
      // Tri identique à l'affichage : Date, puis date de création pour départager les ex aequo
      sort: STANDARD_SORT,
      fields: ['slug'],
      pagination: { pageSize: 5000 }, // On récupère tout
    };

  } else {
    // --- CONTEXTE DÉFAUT (Chronologique pur) ---
    // C'est ici que ça change : on récupère TOUT au lieu de faire < ou >
    queryObject = {
      locale,
      // Tri IMPORTANT : Doit être exactement le même que sur la Homepage
      sort: STANDARD_SORT, // On utilise la constante 
      fields: ['slug'],
      pagination: { pageSize: 5000 }, 
    };
  }

  // 2. EXÉCUTION DE LA REQUÊTE
  const query = qs.stringify(queryObject, { encodeValuesOnly: true });
  
  // En mode recherche on ne cache pas, en mode défaut on peut cacher un peu (60s)
  const fetchOptions = context === 'search' ? { cache: 'no-store' } as RequestInit : undefined;

  const response = await fetchApi<StrapiApiCollectionResponse<{ slug: string }>>(
    `the-wall-of-shames?${query}`, 
    fetchOptions
  );

  // 3. RECHERCHE DES VOISINS DANS LA LISTE
  const slugs = response.data.map(i => i.slug);
  const currentIndex = slugs.indexOf(currentSlug);

  if (currentIndex === -1) return { prev: null, next: null };

  // Rappel : la liste est triée du plus récent (0) au plus ancien (N)
  // Prev (Gauche) = Index - 1 (Plus récent)
  // Next (Droite) = Index + 1 (Plus ancien)
  
  return {
    prev: slugs[currentIndex - 1] || null,
    next: slugs[currentIndex + 1] || null,
  };
}

export async function getSearchFilters(locale: string): Promise<SearchFilters> {
  // 1. On prépare une requête UNIQUE pour tout récupérer
  // On demande 5000 items (grâce à la config Strapi modifiée)
  const queryObject = {
    locale,
    fields: ['category', 'incident_date', 'createdAt'], // On prend juste ce qu'il faut
    populate: {
      sujet: {
        fields: ['affiliation']
      }
    },
    sort: ['createdAt:desc'],
    pagination: {
      limit: 5000, // On utilise 'limit' au lieu de pageSize pour être sûr avec la nouvelle config
    },
  };

  const query = qs.stringify(queryObject, { encodeValuesOnly: true });

  // 2. Appel API avec Cache (1 heure)
  const response = await fetchApi<StrapiApiCollectionResponse<any>>(
    `the-wall-of-shames?${query}`,
    { next: { revalidate: 3600 } }
  );

  const incidents = response.data;

  // 3. Calcul des statistiques en mémoire (Javascript est super rapide pour ça)
  const catCounts: Record<string, number> = {};
  const partyCounts: Record<string, number> = {};
  const yearsSet = new Set<string>();

  incidents.forEach((incident: any) => {
    // Catégories
    if (incident.category) {
      catCounts[incident.category] = (catCounts[incident.category] || 0) + 1;
    }
    
    // Partis
    const affiliation = incident.sujet?.affiliation;
    if (affiliation) {
      partyCounts[affiliation] = (partyCounts[affiliation] || 0) + 1;
    }

    // Années
    if (incident.incident_date) {
      const year = new Date(incident.incident_date).getFullYear().toString();
      yearsSet.add(year);
    }
  });

  // 4. Tri et Formatage
  const categories = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key);

  const parties = Object.entries(partyCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => key);

  const years = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));

  return { categories, parties, years };
}
