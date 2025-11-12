export interface StrapiMedia {
  id: number;
  url: string;
  // Ajoutez d'autres champs si nécessaire (width, height, etc.)
}

export interface LinkComponent {
  id: number;
  label: string;
  url: string;
}

export interface Sujet {
  id: number;
  display_name: string;
  type: 'Personne' | 'Organisation';
  name: string | null;
  canton: string | null;
  picture: {
    data: StrapiMedia | null;
  };
}

export interface Incident {
  id: number;
  title: string;
  slug: string;
  incident_date: string;
  category: string;
  description: string;
  sujet: {
    data: Sujet | null;
  };
  sources: LinkComponent[];
  locale: string;
  // Crucial pour le sélecteur de langue
  localizations?: {
    data: Incident[];
  };
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
