// src/app/[lang]/the-wall-of-shame/[slug]/page.tsx

import { getIncidentBySlug } from '@/lib/api';
import Image from 'next/image';
import { FaCalendar, FaTag, FaMapMarkerAlt, FaLink, FaShareAlt } from 'react-icons/fa';
import ShareButton from '@/components/ShareButton';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

interface DetailPageProps {
  params: any; 
}

async function getPageTranslations(locale: string) {
  const t = await getTranslations({locale, namespace: 'IncidentPage'});
  return {
    involvedSubject: t('involvedSubject'),
    descriptionTitle: t('descriptionTitle'),
    consequencesTitle: t('consequencesTitle'),
    evidenceTitle: t('evidenceTitle'),
    sourcesTitle: t('sourcesTitle'),
    shareLabel: t('shareLabel'),
    copiedLabel: t('copiedLabel'),
  };
}

export default async function DetailPageOfAnIncident({ params }: DetailPageProps) {
  const resolvedParams = await params;
  const response = await getIncidentBySlug(resolvedParams.slug, resolvedParams.lang);
    
  // On utilise les params résolus
  const { involvedSubject, descriptionTitle, consequencesTitle, evidenceTitle, sourcesTitle, shareLabel, copiedLabel } = await getPageTranslations(resolvedParams.lang);

  //console.log("Données pour la page de détail:", JSON.stringify(response.data, null, 2));

  if (!response.data || response.data.length === 0) {
    return notFound();
  }

  const incident = response.data[0];
  const sujet = incident.sujet;
  const STRAPI_HOST = process.env.NEXT_PUBLIC_STRAPI_HOST;

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
                <span>{new Date(incident.incident_date).toLocaleDateString(resolvedParams.lang, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaTag />
                <span className="capitalize">{incident.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt />
                <span>{incident.incident_location}</span>
              </div>
              <ShareButton
                title={incident.title}
                text={`Découvrez cet incident : ${incident.title}`}
                labels={{ share: shareLabel, copied: copiedLabel }}
              />
            </div>

            {/* Description */}
            <h2 className="text-2xl font-semibold mb-3 text-white">{descriptionTitle}</h2>
            <div
              // On ajoute 'prose-invert' pour que le contenu ait du texte clair
              className="prose prose-lg max-w-none prose-invert"
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />

            {/* --- LES IMAGES DE PREUVE --- */}
            {incident.evidence_image && incident.evidence_image.length > 0 && (
              // On ajoute une marge verticale pour séparer de la description
              <div className="my-8 space-y-4">
                {/* On ne met plus de titre "Preuves" */}
                {incident.evidence_image.map(image => (
                  // Chaque image est maintenant un lien qui ouvre l'image en grand
                  <a 
                    key={image.id}
                    href={`${STRAPI_HOST}${image.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block" // Fait en sorte que le lien prenne toute la largeur de l'image
                  >
                    <Image
                      src={`${STRAPI_HOST}${image.url}`}
                      alt="Image de preuve pour l'incident"
                      // On utilise width et height pour respecter le ratio
                      width={image.width}
                      height={image.height}
                      // 'layout="responsive"' est implicite mais ce style le garantit
                      className="rounded-lg object-contain w-full h-auto max-h-[70vh] cursor-pointer"
                    />
                  </a>
                ))}
              </div>
            )}

            {/* Conséquences */}
            {consequenceHtml && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-3 text-white">{consequencesTitle}</h2>
                <div
                  className="prose prose-lg max-w-none prose-invert"
                  dangerouslySetInnerHTML={{ __html: consequenceHtml }}
                />
              </div>
            )}

            {/* ... reste de la colonne principale ... */}
          </div>

          {/* Colonne Latérale */}
          <aside className="w-full md:w-1/3">
            {sujet && (
            <div className="border border-gray-700 rounded-lg p-6 sticky top-8 bg-gray-900">
              {/* Le titre "Sujet Impliqué" a été enlevé. */}
              
              {sujet.picture && (
                // J'ai augmenté la marge en dessous de l'image pour compenser
                <div className="relative w-32 h-32 mx-auto mb-6"> 
                    <Image
                    src={`${STRAPI_HOST}${sujet.picture.url}`}
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
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-300">
              <FaLink />
              {sourcesTitle}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
              {incident.sources.map(source => (
                <li key={source.id}>
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:text-blue-400 hover:underline transition-colors"
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