// src/app/[lang]/the-wall-of-shame/[slug]/page.tsx

import { getIncidentBySlug } from '@/lib/api';
import Image from 'next/image';
import { FaCalendar, FaTag, FaMapMarkerAlt, FaLink, FaShareAlt } from 'react-icons/fa';
import ShareButton from '@/components/ShareButton';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import MarkdownIt from 'markdown-it';

interface DetailPageProps {
  params: {
    slug: string;
    lang: string;
  }; 
}

export async function generateMetadata({ params }: DetailPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const response = await getIncidentBySlug(resolvedParams.slug, resolvedParams.lang);

  if (!response.data || response.data.length === 0) {
    return {
      title: "Incident non trouvé | The Wall of Shame",
    };
  }

  const incident = response.data[0];

  return {
    title: `${incident.title} | The Wall of Shame`,
    description: incident.description.substring(0, 160),
  };
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
  const { involvedSubject, descriptionTitle, consequencesTitle, evidenceTitle, sourcesTitle, shareLabel, copiedLabel } = await getPageTranslations(resolvedParams.lang);

  if (!response.data || response.data.length === 0) {
    return notFound();
  }

  const incident = response.data[0];
  const sujet = incident.sujet;
  const STRAPI_HOST = process.env.NEXT_PUBLIC_STRAPI_HOST;

  const subjectName = sujet?.name || 'Sujet non spécifié';
  let aboutObject;

  if (subjectName.toUpperCase().includes('SVP') || subjectName.toUpperCase().includes('UDC') || subjectName.toUpperCase().includes('PLR') || subjectName.toUpperCase().includes('FDP')) {
    aboutObject = {
      '@type': 'Organization',
      name: subjectName,
    };
  } else {
    aboutObject = {
      '@type': 'Person',
      name: subjectName,
    };
  }
  
  const imageUrls: string[] = [];
  if (sujet?.picture?.url) {
    imageUrls.push(`${STRAPI_HOST}${sujet.picture.url}`);
  }
  if (incident.evidence_image && incident.evidence_image.length > 0) {
    incident.evidence_image.forEach(image => {
      if (image?.url) {
        imageUrls.push(`${STRAPI_HOST}${image.url}`);
      }
    });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: incident.title,
    image: imageUrls,
    datePublished: incident.createdAt,
    dateModified: incident.updatedAt,
    author: {
      '@type': 'Organization',
      url: 'https://www.instagram.com/rebel_suisse/',
      name: 'Rebel Suisse',
    },
    publisher: {
      '@type': 'Organization',
      name: 'No pasaran - The Wall of Shame',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.nopasaran.ch/logo.png',
      },
    },
    description: incident.description.substring(0, 150),
    about: aboutObject,
  };

  const md = new MarkdownIt({
    html: true,       // Enable HTML tags in source
    breaks: true,     // Convert '\n' in paragraphs into <br>
    linkify: true     // Autoconvert URL-like text to links
  });

  const descriptionHtml = md.render(incident.description || '');
  const consequenceHtml = md.render(incident.consequence || '');

  const tParties = await getTranslations({ locale: resolvedParams.lang, namespace: 'Parties' });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto p-4 md:p-8">
        <article className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg text-gray-300">
          <div className="flex flex-col md:flex-row gap-8">

            <div className="w-full md:w-2/3">
              {/* Using text-gray-100 (or removing class to use global) for better contrast on dark bg */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">{incident.title}</h1>

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
                  text={`No pasarán: ${incident.title}`}
                  labels={{ share: shareLabel, copied: copiedLabel }}
                />
              </div>

              <h2 className="text-2xl font-semibold mb-3 text-gray-100">{descriptionTitle}</h2>
              <div
                className="prose prose-lg max-w-none prose-invert"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />

              {incident.evidence_image && incident.evidence_image.length > 0 && (
                <div className="my-8 space-y-4">
                  {incident.evidence_image.map(image => (
                    <a 
                      key={image.id}
                      href={`${STRAPI_HOST}${image.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Image
                        src={`${STRAPI_HOST}${image.url}`}
                        alt="Image de preuve pour l'incident"
                        width={image.width}
                        height={image.height}
                        className="rounded-lg object-contain w-full h-auto max-h-[70vh] cursor-pointer"
                      />
                    </a>
                  ))}
                </div>
              )}

              {consequenceHtml && (
                <div className="mt-8">
                  <h2 className="text-2xl font-semibold mb-3 text-gray-100">{consequencesTitle}</h2>
                  <div
                    className="prose prose-lg max-w-none prose-invert"
                    dangerouslySetInnerHTML={{ __html: consequenceHtml }}
                  />
                </div>
              )}
            </div>

            <aside className="w-full md:w-1/3">
              {sujet && (
              <div className="border border-gray-700 rounded-lg p-6 sticky top-8 bg-gray-900/50">
                {sujet.picture && (
                  <div className="relative w-32 h-32 mx-auto mb-6"> 
                      <Image
                      src={`${STRAPI_HOST}${sujet.picture.url}`}
                      alt={`Photo de ${sujet.name}`}
                      fill
                      className="rounded-full object-cover border-4 border-gray-700 shadow-md"
                    />
                  </div>
                )}
                <h3 className="text-2xl font-bold text-center text-gray-100">{sujet.name}</h3>
                <p className="text-center text-gray-300 mb-1">{incident.subject_role}</p>
                <p className="text-center text-sm text-gray-300">
                  {/* --- TRADUCTION ICI --- */}
                    {tParties.has(sujet.affiliation) 
                      ? tParties(sujet.affiliation) 
                      : sujet.affiliation} - {sujet.canton}</p>
              </div>
              )}
            </aside>
          </div>

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
                      className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
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
    </>
  );
}
