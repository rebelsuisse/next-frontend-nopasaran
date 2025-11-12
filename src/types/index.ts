 export interface Sujet {
   id: number;
   attributes: {
     first_name: string;
     last_name: string;
     display_name: string;
     type: 'Personne' | 'Organisation';
     canton: string;
     role: string;
     picture: {
       data: {
         id: number;
         attributes: {
           url: string;
           formats: any; // Vous pouvez affiner ce type plus tard
         };
       };
     };
   };
 }

 export interface Incident {
   id: number;
   attributes: {
     title: string;
     slug: string;
     incident_date: string; // Les dates arrivent souvent en format ISO string
     category: string;
     description: string; // C'est du HTML/Markdown
     incident_location: string;
     consequence: string;
     sujet: {
       data: Sujet; // Relation !
     };
     // Ajoutez ici les autres champs comme evidence_image, sources, etc.
   };
 }

 // Type générique pour la réponse de l'API Strapi
 export interface StrapiApiResponse<T> {
   data: T;
   meta: {
     pagination: {
       page: number;
       pageSize: number;
       pageCount: number;
       total: number;
     };
   };
 }
