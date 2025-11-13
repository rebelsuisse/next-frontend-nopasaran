import { getIncidentBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import Image from 'next/image';

interface IncidentProps {
  params: any; // On met 'any' pour que le 'await' fonctionne sans que TS ne se plaigne
}

export default async function DetailPageOfAnEvent({ params }: IncidentProps) {
  console.log("IncidentPage...");
  // ÉTAPE CLÉ : On résout la promesse 'params' explicitement
  const resolvedParams = await params;

  // On utilise les paramètres résolus (lang et slug) pour l'appel API
  const response = await getIncidentBySlug(resolvedParams.slug, resolvedParams.lang);
  console.log(`Réponse de l'API pour slug='${resolvedParams.slug}' et locale='${resolvedParams.lang}':`, JSON.stringify(response, null, 2));
  
  if (!response.data || response.data.length === 0) {
    return notFound();
  }

  const incident = response.data[0];
  const sujet = incident.sujet;

  return (
    <div className="container mx-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold mb-2">{incident.title}</h1>
          <p className="text-lg text-gray-500 mb-6">
            {new Date(incident.incident_date).toLocaleDateString('fr-CH')}
          </p>
          <div
            className="prose lg:prose-xl"
            dangerouslySetInnerHTML={{ __html: incident.description }}
          />
        </div>
        <aside>
          {sujet && (
            <div className="border rounded-lg p-4">
              {sujet.picture?.data && (
                <Image
                  src={sujet.picture.data.url}
                  alt={`Photo de ${sujet.name}`}
                  width={200}
                  height={200}
                  className="rounded-full mx-auto mb-4"
                />
              )}
              <h3 className="text-2xl font-bold text-center">{sujet.name}</h3>
              <p className="text-center text-gray-600">{sujet.canton}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}