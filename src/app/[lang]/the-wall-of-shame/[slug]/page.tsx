// src/app/[lang]/the-wall-of-shame/[slug]/page.tsx

import { getIncidentBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { FaCalendar, FaTag, FaMapMarkerAlt, FaLink } from 'react-icons/fa';

interface DetailPageProps {
  params: any; 
}

export default async function DetailPageOfAnIncident({ params }: DetailPageProps) {
  const resolvedParams = await params;
  const response = await getIncidentBySlug(resolvedParams.slug, resolvedParams.lang);

  if (!response.data || response.data.length === 0) {
    return notFound();
  }

  const incident = response.data[0];
  const sujet = incident.sujet;
  
  const descriptionHtml = incident.description || '';
  const consequenceHtml = incident.consequence || '';
  
  return (
    // On enlève le div extérieur avec le fond clair.
    // La page héritera maintenant du fond sombre du layout.
    <div className="container mx-auto p-4 md:p-8">
      {/* L'article a maintenant un fond sombre et du texte clair */}
      <article className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg text-gray-300">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Colonne Principale */}
          <div className="w-full md:w-2/3">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{incident.title}</h1>
            
            {/* Métadonnées */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400 mb-6 border-b border-gray-700 pb-4">
              <div className="flex items-center gap-2">
                <FaCalendar />
                <span>{new Date(incident.incident_date).toLocaleDateString('fr-CH', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaTag />
                <span className="capitalize">{incident.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt />
                <span>{incident.incident_location}</span>
              </div>
            </div>

            {/* Description */}
            <h2 className="text-2xl font-semibold mb-3 text-white">Description des faits</h2>
            <div
              // On ajoute 'prose-invert' pour que le contenu ait du texte clair
              className="prose prose-lg max-w-none prose-invert"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />

            {/* Conséquences */}
            {consequenceHtml && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-3 text-white">Conséquences</h2>
                <div
                  className="prose prose-lg max-w-none prose-invert"
                  dangerouslySetInnerHTML={{ __html: consequenceHtml }}
                />
              </div>
            )}

            {/* ... reste de la colonne principale ... */}
          </div>

          {/* Colonne Latérale */}
          <aside className="w-full md:w-1//3">
            {sujet && (
              // La carte du sujet a maintenant un fond plus sombre
              <div className="border border-gray-700 rounded-lg p-6 sticky top-8 bg-gray-900">
                <h2 className="text-xl font-semibold text-center mb-4 text-white">Sujet Impliqué</h2>
                {sujet.picture?.data && (
                  <div className="relative w-32 h-32 mx-auto mb-4">
                     <Image
                      src={sujet.picture.data.url}
                      alt={`Photo de ${sujet.name}`}
                      fill
                      className="rounded-full object-cover border-4 border-gray-700 shadow-md"
                    />
                  </div>
                )}
                <h3 className="text-2xl font-bold text-center text-white">{sujet.name}</h3>
                <p className="text-center text-gray-400 mb-1">{incident.subject_role}</p>
                <p className="text-center text-sm text-gray-500">{sujet.affiliation} - {sujet.canton}</p>
              </div>
            )}
          </aside>
        </div>

        {/* Section des Sources */}
        {incident.sources && incident.sources.length > 0 && (
          <div className="mt-10 border-t border-gray-700 pt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <FaLink />
              Sources
            </h2>
            <ul className="list-disc list-inside space-y-2">
              {incident.sources.map(source => (
                <li key={source.id}>
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:underline" // Lien plus clair pour fond sombre
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
}