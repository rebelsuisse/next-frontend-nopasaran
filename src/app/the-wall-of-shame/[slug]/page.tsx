// src/app/the-wall-of-shame/[slug]/page.tsx

import { getIncidentBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';

// On définit le type des props que la page va recevoir
interface IncidentPageProps {
  // params est un objet qui contient une clé 'slug' de type string
  params: { slug: string };
}

// On utilise 'any' temporairement pour les props pour simplifier et se concentrer sur le problème
export default async function IncidentPage({ params }: any) {
  
  // ÉTAPE CLÉ : On résout la promesse 'params' explicitement
  const resolvedParams = await params;

  // Maintenant, on est sûr que resolvedParams est un objet simple
  // et on peut lire sa propriété .slug en toute sécurité.
  const response = await getIncidentBySlug(resolvedParams.slug);

  // Le reste du code ne change pas.
  if (!response.data || response.data.length === 0) {
    return notFound();
  }

  // Comme la réponse de l'API est un tableau, on prend le premier élément.
  const incident = response.data[0];

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">{incident.title}</h1>
      <p className="text-lg text-gray-600 mb-6">
        {new Date(incident.incident_date).toLocaleDateString('fr-CH')}
      </p>
      
      <div
        className="prose lg:prose-xl"
        dangerouslySetInnerHTML={{ __html: incident.description }}
      />
    </main>
  );
}