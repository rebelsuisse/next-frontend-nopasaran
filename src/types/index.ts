export interface StrapiMedia {
  id: number;
  url: string;
  width: number;
  height: number;
  // Vous pouvez aussi ajouter d'autres champs que Strapi renvoie si vous en avez besoin
  // alternativeText: string | null;
  // caption: string | null;
}

export interface LinkComponent {
  id: number;
  label: string;
  url: string;
}

export interface Sujet {
  id: number;
  name: string;
  canton: string;
  affiliation: string;
  picture: StrapiMedia | null; 
}

export interface Incident {
  id: number;
  title: string;
  slug: string;
  subject_role: string | null;
  incident_date: string;
  incident_location: string;
  category: string;
  description: string;
  consequence: string | null;
  sujet: Sujet | null;
  evidence_image: StrapiMedia[] | null;
  sources: LinkComponent[];
  locale: string;
  localizations?: {
    data: Incident[];
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface StrapiApiCollectionResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiApiSingleResponse<T> {
  data: T | null;
  meta: {};
}
