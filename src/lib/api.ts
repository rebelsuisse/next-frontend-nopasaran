import { Incident, StrapiApiSingleResponse } from "@/types";

export async function getIncidents(): Promise<StrapiApiSingleResponse<Incident[]>> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/the-wall-of-shames?populate=*`);

    if (!res.ok) {
        // On récupère le corps de la réponse d'erreur
        const errorDetails = await res.json(); 
        console.error("Strapi API Error:", errorDetails.error);

        // On peut même construire un message d'erreur plus détaillé
        throw new Error(`Failed to fetch incidents: ${res.status} ${res.statusText} - ${errorDetails.error.message}`);
    }

    return res.json();
}

export async function getIncidentBySlug(slug: string): Promise<StrapiApiSingleResponse<Incident[]>> {
// L'API de Strapi permet de filtrer par n'importe quel champ
    const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/the-wall-of-shames?filters[slug][$eq]=${slug}&populate=*`);

    if (!res.ok) {
        throw new Error(`Failed to fetch incident: ${slug}`);
    }
    return res.json();
}
