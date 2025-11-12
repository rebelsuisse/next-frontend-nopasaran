 import { Incident, StrapiApiResponse } from "@/types";

 export async function getIncidents(): Promise<StrapiApiResponse<Incident[]>> {
   const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/the-wall-of-shames?populate=*`);

   if (!res.ok) {
     throw new Error('Failed to fetch incidents');
   }

   return res.json();
 }

 export async function getIncidentBySlug(slug: string): Promise<StrapiApiResponse<Incident[]>> {
    // L'API de Strapi permet de filtrer par n'importe quel champ
   const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/the-wall-of-shames?filters[slug][$eq]=${slug}&populate=*`);

   if (!res.ok) {
     throw new Error(`Failed to fetch incident: ${slug}`);
   }
   return res.json();
 }
