// src/app/page.tsx
import { getIncidents } from '@/lib/api';
import Link from 'next/link';
// import RandomIncidentButton from '@/components/RandomIncidentButton';

export default async function HomePage() {
  const response = await getIncidents(); // On prendra la langue par défaut (français)
  const incidents = response.data;

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Les Derniers Incidents</h1>
        {/* <RandomIncidentButton /> */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incidents && incidents.map((incident) => (
          <Link href={`/the-wall-of-shame/${incident.slug}`} key={incident.id}>
            <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-2">{incident.title}</h2>
              <p className="text-gray-600">
                {new Date(incident.incident_date).toLocaleDateString('fr-CH')}
              </p>
              <p className="mt-2 font-medium">{incident.sujet?.data?.display_name ?? 'Sujet non défini'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
