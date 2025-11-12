import { getIncidents } from '@/lib/api';
import Link from 'next/link';

export default async function HomePage() {
  // Le composant est "async", il peut donc attendre les données du serveur
  const response = await getIncidents();
  const incidents = response.data;

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">The Wall of Shame</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incidents.map((incident) => (
          <Link href={`/incidents/${incident.attributes.slug}`} key={incident.id}>
            <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold mb-2">{incident.attributes.title}</h2>
              <p className="text-gray-600">
                {new Date(incident.attributes.incident_date).toLocaleDateString('fr-CH')}
              </p>
              {/* Ici, VS Code connaît incident.attributes.sujet.data.attributes.display_name grâce à vos types ! */}
              <p className="mt-2 font-medium">{incident.attributes.sujet.data.attributes.display_name}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
