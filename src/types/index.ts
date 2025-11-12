// Type pour une image ou un média provenant de l'API Strapi
// On ne définit que ce qui nous est utile (url)
export interface StrapiMedia {
  id: number;
  url: string;
  // Strapi fournit aussi d'autres infos comme width, height, formats, etc.
  // Vous pouvez les ajouter ici si vous en avez besoin.
}

// Type pour le composant "link"
export interface LinkComponent {
  id: number;
  label: string;
  url: string;
}

// Type pour un Sujet
export interface Sujet {
  id: number;
  name: string;
  canton: string | null; // Peut être nul si non défini
  // "picture" est une relation Media, elle est donc imbriquée dans un objet "data"
  picture: {
    data: StrapiMedia | null; // Peut être nul si aucune image n'est uploadée
  };
}

// Type pour un Incident (The Wall of Shame)
export interface Incident {
  id: number;
  title: string;
  slug: string;
  subject_role: string | null;
  incident_date: string; // Arrive en format ISO string : "YYYY-MM-DD"
  category: string;
  description: string; // Contient du HTML/Markdown
  incident_location: string;
  consequence: string | null;
  // "sujet" est une relation, donc imbriquée dans un objet "data"
  sujet: {
    data: Sujet | null; // Peut être nul si aucun sujet n'est lié
  };
  // "evidence_image" est un champ média multiple, donc c'est un tableau
  evidence_image: {
    data: StrapiMedia[] | null; // Peut être nul ou un tableau vide
  };
  // "sources" est un composant répétable, donc c'est un tableau de composants
  sources: LinkComponent[];
  locale: string; // Le champ de la langue
}

// Type générique pour l'enveloppe de la réponse de l'API Strapi
// Utile pour les réponses qui contiennent une seule entrée
export interface StrapiApiSingleResponse<T> {
  data: T | null;
  meta: {};
}

// Type générique pour l'enveloppe de la réponse de l'API Strapi
// Utile pour les réponses qui contiennent une liste d'entrées
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