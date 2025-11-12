import { getIncidents } from '@/lib/api';
import Link from 'next/link';

export default async function HomePage() {
  const response = await getIncidents();
  const incidents = response.data;

  // Plus besoin de filtrer, la structure est maintenant correcte
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">The Wall of Shame</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incidents && incidents.map((incident) => (
          // On accède directement à incident.slug, incident.title, etc.
          <Link href={`/the-wall-of-shame/${incident.slug}`} key={incident.id}>
            <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold mb-2">{incident.title}</h2>
              <p className="text-gray-600">
                {incident.incident_date && new Date(incident.incident_date).toLocaleDateString('fr-CH')}
              </p>
              {/* L'accès au sujet est aussi beaucoup plus simple ! */}
              <p className="mt-2 font-medium">{incident.sujet?.data?.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}