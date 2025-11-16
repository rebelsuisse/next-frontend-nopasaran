// src/components/SearchForm.tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// On passe les options en props pour que le composant reste générique
interface SearchFormProps {
  categories: string[];
  cantons: string[];
}

export default function SearchForm({ categories, cantons }: SearchFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function handleSearch(formData: FormData) {
    const params = new URLSearchParams();

    const query = formData.get('query') as string;
    const year = formData.get('year') as string;
    const category = formData.get('category') as string;
    const canton = formData.get('canton') as string;

    if (query) params.set('query', query);
    if (year) params.set('year', year);
    if (category) params.set('category', category);
    if (canton) params.set('canton', canton);
    
    // On navigue vers la même page mais avec les nouveaux paramètres de recherche
    router.replace(`${pathname}?${params.toString()}`);
  }
  
  return (
    <form action={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-800 p-4 rounded-lg">
      {/* Champ de recherche texte */}
      <input
        type="text"
        name="query"
        defaultValue={searchParams.get('query') || ''}
        placeholder="Rechercher par nom ou mot-clé..."
        className="col-span-1 md:col-span-2 bg-gray-700 text-white rounded p-2"
      />

      {/* Selecteur d'année */}
      <select name="year" defaultValue={searchParams.get('year') || ''} className="bg-gray-700 text-white rounded p-2">
        <option value="">Toutes les années</option>
        {[...Array(10)].map((_, i) => {
          const year = new Date().getFullYear() - i;
          return <option key={year} value={year}>{year}</option>;
        })}
      </select>
      
      {/* Sélecteur de catégorie */}
      <select name="category" defaultValue={searchParams.get('category') || ''} className="bg-gray-700 text-white rounded p-2">
        <option value="">Toutes les catégories</option>
        {categories.map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
      </select>
      
      {/* Sélecteur de canton */}
      <select name="canton" defaultValue={searchParams.get('canton') || ''} className="bg-gray-700 text-white rounded p-2">
        <option value="">Tous les cantons</option>
        {cantons.map(canton => <option key={canton} value={canton}>{canton}</option>)}
      </select>

      {/* Bouton de soumission */}
      <div className="md:col-span-4 flex justify-end gap-4">
         <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Rechercher
        </button>
      </div>
    </form>
  );
}