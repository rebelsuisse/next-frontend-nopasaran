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
  name: string;
  canton: string;
  affiliation: string;
  picture: {
    data: StrapiMedia | null;
  };
}

export interface Incident {
  id: number;
  title: string;
  slug: string;
  subject_role: string | null;
  incident_date: string;
  category: string;
  description: string;
  sujet: Sujet | null;
  evidence_image: {
      data: StrapiMedia[] | null;
  };
  sources: LinkComponent[];
  locale: string;
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
