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
  
  // On s'assure que la description et les conséquences sont bien traitées
  // Le Rich Text peut être null
  const descriptionHtml = incident.description || '';
  const consequenceHtml = incident.consequence || '';
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <article className="bg-white p-6 md:p-8 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Colonne Principale - Contenu de l'incident */}
            <div className="w-full md:w-2/3">
              {/* Titre */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{incident.title}</h1>
              
              {/* Métadonnées de l'incident */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mb-6 border-b pb-4">
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
              <h2 className="text-2xl font-semibold mb-3">Description des faits</h2>
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />

              {/* Conséquences */}
              {consequenceHtml && (
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold mb-3">Conséquences</h2>
                  <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: consequenceHtml }}
                  />
                </div>
              )}

              {/* Images de Preuve (Evidence Images) */}
              {incident.evidence_image?.data && incident.evidence_image.data.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold mb-3">Preuves</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {incident.evidence_image.data.map(image => (
                      <div key={image.id} className="relative aspect-video">
                        <Image
                          src={image.url}
                          alt="Image de preuve pour l'incident"
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colonne Latérale - Informations sur le Sujet */}
            <aside className="w-full md:w-1/3">
              {sujet && (
                <div className="border rounded-lg p-6 sticky top-8 bg-gray-50">
                  <h2 className="text-xl font-semibold text-center mb-4">Sujet Impliqué</h2>
                  {sujet.picture?.data && (
                    <div className="relative w-32 h-32 mx-auto mb-4">
                       <Image
                        src={sujet.picture.data.url}
                        alt={`Photo de ${sujet.name}`}
                        fill
                        className="rounded-full object-cover border-4 border-white shadow-md"
                      />
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-center text-gray-800">{sujet.name}</h3>
                  <p className="text-center text-gray-600 mb-1">{incident.subject_role}</p>
                  <p className="text-center text-sm text-gray-500">{sujet.affiliation} - {sujet.canton}</p>
                </div>
              )}
            </aside>
          </div>

          {/* Section des Sources (à la fin) */}
          {incident.sources && incident.sources.length > 0 && (
            <div className="mt-10 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
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
                      className="text-blue-600 hover:underline"
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
    </div>
  );
}