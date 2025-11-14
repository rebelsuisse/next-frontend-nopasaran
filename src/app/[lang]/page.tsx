// src/app/[lang]/page.tsx

import { getIncidents } from '@/lib/api';
import Link from 'next/link';

interface HomePageProps {
  params: any;
}

export default async function HomePage({ params }: HomePageProps) {
  const resolvedParams = await params;
  const response = await getIncidents(resolvedParams.lang);
  const incidents = response.data;

  return (
    <div className="container mx-auto px-4 py-8 md:px-8">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          The Wall of Shame
        </h1>
        <p className="text-lg text-gray-400 mt-2">
          Registre des dérapages de l'extrême droite en Suisse.
        </p>
      </div>

      {/* Conteneur de la liste */}
      <div className="bg-gray-800 rounded-lg shadow-lg">
        {incidents && incidents.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Link
                  href={`/${resolvedParams.lang}/the-wall-of-shame/${incident.slug}`}
                  // On utilise flexbox pour un alignement robuste sur toutes les tailles d'écran
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
                >
                  {/* Titre (prend toute la place disponible) */}
                  <div className="flex-grow mb-2 sm:mb-0">
                    <p className="text-lg font-medium text-gray-100">{incident.title}</p>
                  </div>
                  
                  {/* Date (à droite, ne se réduit pas) */}
                  <div className="flex-shrink-0 text-sm text-gray-400">
                    {new Date(incident.incident_date).toLocaleDateString('fr-CH', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-500 p-10">
            <p>Aucun incident à afficher pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}