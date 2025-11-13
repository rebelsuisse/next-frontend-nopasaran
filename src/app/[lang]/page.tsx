// src/app/[lang]/page.tsx

import { getIncidents } from '@/lib/api';
import Link from 'next/link';

// On utilise 'any' temporairement pour les props pour éviter les erreurs de type
interface HomePageProps {
  params: any; // On met 'any' pour que le 'await' fonctionne sans que TS ne se plaigne
}

export default async function HomePage({ params }: HomePageProps) {
  
  // ÉTAPE CLÉ : On résout la promesse 'params' explicitement
  const resolvedParams = await params;
  
  // On utilise le paramètre résolu pour l'appel API
  const response = await getIncidents(resolvedParams.lang);

  // --- LIGNE DE DÉBOGAGE (gardez-la pour l'instant) ---
  console.log("Réponse BRUTE de l'API:", JSON.stringify(response, null, 2));
  // ---------------------------------------------------

  const incidents = response.data;

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">The Wall of Shame</h1>
      </div>

      <div className="overflow-x-auto">
        <div className="w-full">
          <div className="hidden md:grid grid-cols-5 gap-4 border-b pb-2 mb-4 font-bold text-gray-600">
            {/* ... en-têtes de tableau ... */}
          </div>

          <div className="space-y-2">
            {incidents && incidents.length > 0 ? (
              incidents.map((incident) => (
                <Link
                  // On utilise aussi les params résolus ici pour les liens
                  href={`/${resolvedParams.lang}/the-wall-of-shame/${incident.slug}`}
                  key={incident.id}
                  className="grid grid-cols-5 gap-4 items-center p-3 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  {/* ... contenu de la ligne du tableau ... */}
                  <div className="col-span-1 text-sm text-gray-600">
                    {new Date(incident.incident_date).toLocaleDateString('fr-CH', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </div>
                  <div className="col-span-2 font-semibold"> {/* font-semibold est plus visible que font-medium */}
                    {incident.sujet?.name ?? <span className="text-gray-400">Non spécifié</span>}
                  </div>
                  <div className="col-span-2 text-gray-400">
                    {incident.title}
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center text-gray-500 py-10">
                <p>Aucun incident à afficher pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}