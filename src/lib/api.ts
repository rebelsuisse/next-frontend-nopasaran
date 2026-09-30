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

// Taille de page maximale côté Strapi : doit rester égale à `rest.maxLimit`
// dans config/api.ts du backend. Au-delà, Strapi tronque la réponse SANS
// erreur -- une requête pageSize: 5000 renverrait silencieusement 100 lignes.
// Tout ce qui a besoin de l'ensemble des incidents passe donc par
// fetchAllPages() plutôt que par une page géante.
export const MAX_PAGE_SIZE = 100;

// Parcourt toutes les pages d'une collection, MAX_PAGE_SIZE lignes à la fois.
// Séquentiel exprès : le rate limit Cloudflare compte les requêtes par IP, et
// les rendus serveur de Vercel partagent quelques IP.
async function fetchAllPages<T>(
  collection: string,
  queryObject: Record<string, unknown>,
  customOptions: RequestInit = {}
): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const query = qs.stringify(
      { ...queryObject, pagination: { page, pageSize: MAX_PAGE_SIZE } },
      { encodeValuesOnly: true }
    );
    const response = await fetchApi<StrapiApiCollectionResponse<T>>(`${collection}?${query}`, customOptions);
    items.push(...response.data);
    pageCount = response.meta.pagination.pageCount;
    page++;
  } while (page <= pageCount);

  return items;
}

interface SearchCriteria {
  year?: string;
  category?: string;
  canton?: string;
  query?: string;
  affiliation?: string;
}

// Filtres de la recherche, partagés par searchIncidents() et
// getAdjacentSlugs() : la navigation précédent/suivant d'un résultat doit
// parcourir exactement la même liste que la page de recherche.
function buildSearchConditions(criteria: SearchCriteria): object[] {
  const conditions: object[] = [];

  // Filtre par année (sur le champ incident_date)
  if (criteria.year) {
    conditions.push({
      incident_date: { $gte: `${criteria.year}-01-01`, $lte: `${criteria.year}-12-31` },
    });
  }
  if (criteria.category) {
    conditions.push({ category: { $eq: criteria.category } });
  }
  // Canton et parti vivent dans la relation 'sujet'
  if (criteria.canton) {
    conditions.push({ sujet: { canton: { $eq: criteria.canton } } });
  }
  if (criteria.affiliation) {
    conditions.push({ sujet: { affiliation: { $eq: criteria.affiliation } } });
  }
  // Filtre par texte (sur le titre, la description ou le nom du sujet)
  if (criteria.query) {
    conditions.push({
      $or: [
        { title: { $containsi: criteria.query } },
        { description: { $containsi: criteria.query } },
        { sujet: { name: { $containsi: criteria.query } } },
      ],
    });
  }

  return conditions;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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

// Populate shared by the queries that need the images of an incident.
const INCIDENT_IMAGES_POPULATE = {
  sujet: { populate: { picture: true } },
  evidence_image: true,
};

/**
 * Latest incidents in the order they were added to the site.
 *
 * Unlike getIncidents() (sorted by incident date, as on the home page), this
 * surfaces historical incidents added today: an incident from 2015 added this
 * morning comes first. `createdAt` is used rather than `publishedAt` because
 * Strapi bumps `publishedAt` on every republish, which would resurface edited
 * incidents as new.
 */
export async function getLatestAddedIncidents(locale: string, limit: number) {
  const query = qs.stringify(
    {
      locale,
      sort: ['createdAt:desc'],
      populate: INCIDENT_IMAGES_POPULATE,
      pagination: { page: 1, pageSize: limit },
    },
    { encodeValuesOnly: true }
  );

  return fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?${query}`);
}

// One incident in one locale, by its Strapi document id; null if not found.
export async function getIncidentByDocumentId(
  documentId: string,
  locale: string
): Promise<Incident | null> {
  const query = qs.stringify(
    {
      locale,
      filters: { documentId: { $eq: documentId } },
      populate: INCIDENT_IMAGES_POPULATE,
    },
    { encodeValuesOnly: true }
  );
  const response = await fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?${query}`);
  return response.data[0] ?? null;
}

/**
 * Incidents that may be published on social networks: added (`createdAt`)
 * since `createdSince`, and last published (`publishedAt`) before
 * `publishedBefore`. Oldest publication first.
 *
 * Filtering on `publishedAt` gives the review delay: republishing a fix
 * restarts it. Filtering on `createdAt` keeps the back catalogue out, since a
 * republished old incident keeps its original `createdAt`.
 */
export async function getSocialCandidates(
  locale: string,
  createdSince: Date,
  publishedBefore: Date
): Promise<Incident[]> {
  const incidents: Incident[] = [];
  let page = 1;
  let pageCount = 1;

  do {
    const query = qs.stringify(
      {
        locale,
        filters: {
          createdAt: { $gte: createdSince.toISOString() },
          publishedAt: { $lte: publishedBefore.toISOString() },
        },
        sort: ['publishedAt:asc'],
        populate: INCIDENT_IMAGES_POPULATE,
        pagination: { page, pageSize: 100 },
      },
      { encodeValuesOnly: true }
    );

    const response = await fetchApi<StrapiApiCollectionResponse<Incident>>(
      `the-wall-of-shames?${query}`,
      { cache: 'no-store', next: { revalidate: 0 } }
    );

    incidents.push(...response.data);
    pageCount = response.meta.pagination.pageCount;
    page++;
  } while (page <= pageCount);

  return incidents;
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

/**
 * Cherche dans quelle langue un slug existe, en excluant celle déjà essayée.
 *
 * Un slug d'incident n'existe que dans SA langue. Google a hérité d'un stock
 * d'URLs croisées (/it-CH/<slug-en>, /fr-CH/<slug-it>, ...) : un ancien sitemap
 * les publiait, et les URLs sans préfixe de langue ont longtemps été redirigées
 * vers un préfixe deviné. Plutôt que de renvoyer 404 sur ces URLs, on retrouve
 * la bonne langue pour rediriger dessus.
 *
 * Strapi ne supporte pas `locale=all` sur cette collection (il renvoie 0
 * résultat), d'où les requêtes par langue, lancées en parallèle. Cette fonction
 * n'est appelée que lorsqu'un slug est déjà introuvable : le chemin normal ne
 * paie donc rien.
 */
export async function findLocaleForSlug(
  slug: string,
  excludeLocale: string
): Promise<string | null> {
  const candidates = ['fr-CH', 'de-CH', 'it-CH', 'en'].filter(
    locale => locale !== excludeLocale
  );

  const found = await Promise.all(
    candidates.map(async locale => {
      try {
        const query = qs.stringify(
          { locale, filters: { slug: { $eq: slug } }, fields: ['slug'] },
          { encodeValuesOnly: true }
        );
        const res = await fetchApi<StrapiApiCollectionResponse<Incident>>(
          `the-wall-of-shames?${query}`
        );
        return res.data && res.data.length > 0 ? locale : null;
      } catch {
        // Une langue qui échoue ne doit pas empêcher les autres de répondre.
        return null;
      }
    })
  );

  return found.find(Boolean) ?? null;
}

// Récupère un incident au hasard (astuce en 2 étapes)
// `locale` était interpolée telle quelle dans la query string : un « & » dans
// la valeur permettait d'ajouter des paramètres arbitraires à la requête
// Strapi. On passe par qs, comme partout ailleurs dans ce fichier, qui encode
// les valeurs. L'appelant doit malgré tout valider la locale (resolveLocale).
export async function getRandomIncident(locale: string = 'fr-CH') {
  // 1. Obtenir le nombre total d'incidents
  const countQuery = qs.stringify(
    { locale, pagination: { pageSize: 1 } },
    { encodeValuesOnly: true }
  );
  const countResponse = await fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?${countQuery}`);
  const total = countResponse.meta.pagination.total;

  // 2. Choisir un index au hasard et récupérer un seul incident
  const randomIndex = Math.floor(Math.random() * total);
  const randomQuery = qs.stringify(
    { locale, pagination: { start: randomIndex, limit: 1 } },
    { encodeValuesOnly: true }
  );
  return fetchApi<StrapiApiCollectionResponse<Incident>>(`the-wall-of-shames?${randomQuery}`);
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

  const conditions = buildSearchConditions(params);

  // On construit la query avec qs
  const queryObject = {
    locale,
    filters: conditions.length > 0 ? { $and: conditions } : undefined,
    sort: STANDARD_SORT,
    populate: 'sujet',
    pagination: {
      page: page,
      pageSize: pageSize,
    },
  };

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

export async function getIncidentsForSitemapByLocale(locale: string) {
  // On ne veut que les champs slug et updatedAt pour être ultra-rapide
  return fetchAllPages<Pick<Incident, 'slug' | 'updatedAt' | 'locale'>>('the-wall-of-shames', {
    locale,
    fields: ['slug', 'updatedAt', 'locale'],
    sort: ['id:asc'],
  });
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

// Voisins d'un incident dans l'ordre d'affichage (STANDARD_SORT : du plus
// récent au plus ancien). Deux requêtes bornées d'une ligne chacune au lieu
// de télécharger tous les slugs : « le plus proche plus récent » et « le plus
// proche plus ancien », comparés sur le couple (incident_date, createdAt)
// comme le tri de la page.
export async function getAdjacentSlugs(
  current: Pick<Incident, 'slug' | 'incident_date' | 'createdAt'>,
  locale: string,
  context: 'default' | 'search',
  searchParams: Record<string, string | string[] | undefined> = {}
): Promise<{ prev: string | null; next: string | null }> {
  if (!current.incident_date || !current.createdAt) return { prev: null, next: null };

  // En recherche, mêmes filtres que la page de recherche (qui accepte aussi « q »)
  const conditions = context === 'search'
    ? buildSearchConditions({
        year: firstParam(searchParams.year),
        category: firstParam(searchParams.category),
        canton: firstParam(searchParams.canton),
        query: firstParam(searchParams.query) || firstParam(searchParams.q),
        affiliation: firstParam(searchParams.affiliation),
      })
    : [];

  const date = current.incident_date;
  const created = current.createdAt;
  const newer = { $or: [
    { incident_date: { $gt: date } },
    { $and: [{ incident_date: { $eq: date } }, { createdAt: { $gt: created } }] },
  ] };
  const older = { $or: [
    { incident_date: { $lt: date } },
    { $and: [{ incident_date: { $eq: date } }, { createdAt: { $lt: created } }] },
  ] };

  // En mode recherche on ne cache pas, en mode défaut on garde le cache de 60s
  const fetchOptions: RequestInit = context === 'search'
    ? { cache: 'no-store', next: { revalidate: 0 } }
    : {};

  const closest = async (bound: object, sort: string[]) => {
    const query = qs.stringify({
      locale,
      // L'exclusion du slug courant évite qu'un écart de précision sur
      // createdAt fasse de l'incident son propre voisin.
      filters: { $and: [...conditions, bound, { slug: { $ne: current.slug } }] },
      sort,
      fields: ['slug'],
      pagination: { page: 1, pageSize: 1 },
    }, { encodeValuesOnly: true });

    const response = await fetchApi<StrapiApiCollectionResponse<{ slug: string }>>(
      `the-wall-of-shames?${query}`,
      fetchOptions
    );
    return response.data[0]?.slug ?? null;
  };

  // Prev (gauche) = le plus proche plus récent ; Next (droite) = le plus proche plus ancien
  const [prev, next] = await Promise.all([
    closest(newer, ['incident_date:asc', 'createdAt:asc']),
    closest(older, STANDARD_SORT),
  ]);

  return { prev, next };
}

export async function getSearchFilters(locale: string): Promise<SearchFilters> {
  // 1. On récupère tous les incidents de la langue, page par page (cache 1 heure)
  type FilterRow = { category?: string; incident_date?: string; sujet?: { affiliation?: string } | null };
  const incidents = await fetchAllPages<FilterRow>('the-wall-of-shames', {
    locale,
    fields: ['category', 'incident_date', 'createdAt'], // On prend juste ce qu'il faut
    populate: {
      sujet: {
        fields: ['affiliation']
      }
    },
    sort: ['createdAt:desc'],
  }, { next: { revalidate: 3600 } });

  // 3. Calcul des statistiques en mémoire (Javascript est super rapide pour ça)
  const catCounts: Record<string, number> = {};
  const partyCounts: Record<string, number> = {};
  const yearsSet = new Set<string>();

  incidents.forEach((incident) => {
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
