// src/components/SearchForm.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useRef } from 'react';

type PartyOption = {
  value: string;
  label: string;
};

interface SearchFormProps {
  categories: string[];
  cantons: string[];
  parties: PartyOption[];
  years: string[];
  initialValues: { [key: string]: string | string[] | undefined };
  labels: {
    searchPlaceholder: string;
    allYears: string;
    allCategories: string;
    allCantons: string;
    allParties: string;
    searchButton: string;
    resetButton: string;
  };
}

export default function SearchForm({ categories, cantons, parties, years, initialValues, labels }: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  // Fonction utilitaire pour extraire une string propre pour les valeurs par défaut du formulaire
  const getSafeValue = (key: string): string => {
    const val = initialValues[key];
    if (Array.isArray(val)) return val[0] || '';
    return val || '';
  };

  function handleSearch(formData: FormData) {
    const params = new URLSearchParams();

    const query = formData.get('query') as string;
    const year = formData.get('year') as string;
    const category = formData.get('category') as string;
    const canton = formData.get('canton') as string;
    // On utilise ?.toString() pour la sécurité si le champ est absent
    const affiliation = formData.get('affiliation')?.toString();

    if (query) params.set('query', query); // On standardise sur 'query'
    if (year) params.set('year', year);
    if (category) params.set('category', category);
    if (canton) params.set('canton', canton);
    if (affiliation) params.set('affiliation', affiliation);

    // On navigue
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleReset() {
    // A. Nettoyage de l'URL (on recharge la page sans paramètres)
    router.replace(pathname);

    // B. Nettoyage visuel des champs du formulaire
    if (formRef.current) {
      formRef.current.reset(); // Remet les valeurs par défaut (qui sont celles de l'URL...)
      
      // Comme 'reset()' remet les defaultValue (qui contiennent la recherche actuelle),
      // on doit forcer le vidage manuel des champs :
      const inputs = formRef.current.querySelectorAll('input, select');
      inputs.forEach((input) => {
        if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
          input.value = "";
        }
      });
    }
  }

  return (
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(new FormData(e.currentTarget));
        }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-800 p-4 rounded-lg"
      >
      {/* Champ de recherche texte */}
      <input
        type="text"
        name="query"
        // Utilisation de la fonction sécurisée
        defaultValue={getSafeValue('query')} 
        placeholder={labels.searchPlaceholder}
        className="col-span-1 md:col-span-2 bg-gray-700 rounded p-2 text-white"
      />

      {/* Selecteur d'année */}
      <select 
        name="year" 
        defaultValue={getSafeValue('year')} 
        className="bg-gray-700 rounded p-2 text-white"
      >
        <option value="">{labels.allYears}</option>
        
        {/* On utilise la liste dynamique fournie par l'API */}
        {years.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      {/* Sélecteur de catégorie */}
      <select name="category" defaultValue={getSafeValue('category')} className="bg-gray-700 rounded p-2 text-white">
        <option value="">{labels.allCategories}</option>
        {categories.map(cat => <option key={cat} value={cat} className="capitalize">{cat}</option>)}
      </select>

      {/* Sélecteur de canton */}
      <select name="canton" defaultValue={getSafeValue('canton')} className="bg-gray-700 rounded p-2 text-white">
        <option value="">{labels.allCantons}</option>
        {cantons.map(canton => <option key={canton} value={canton}>{canton}</option>)}
      </select>

      {/* Nouveau Select pour les Partis */}
        <select 
          name="affiliation" 
          defaultValue={getSafeValue('affiliation')} 
          className="p-2 bg-gray-700 text-white rounded border border-gray-600" // p-2 au lieu de p-3 pour l'alignement
        >
          <option value="">{labels.allParties}</option>
          {parties.map((party) => (
            <option key={party.value} value={party.value}>
              {party.label}
            </option>
          ))}
        </select>
      
      {/* Boutons de soumission et reset */}
      <div className="md:col-span-4 flex justify-end gap-4 pt-4 border-t border-gray-700 mt-4">
         {/* Bouton Reset - Style Amélioré */}
         <button 
            type="button" 
            onClick={handleReset}
            // Changements :
            // 1. font-bold : Pour avoir le même poids que le bouton de recherche
            // 2. border-2 : Une bordure pour bien délimiter le bouton
            // 3. text-gray-300 : Texte clair mais pas blanc pur (pour différencier du primaire)
            // 4. hover : Effet d'éclaircissement au survol
            className="border-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white hover:bg-gray-700 font-bold py-2 px-6 rounded transition-all duration-200"
         >
          {labels.resetButton}
        </button>

         {/* Bouton Submit (Inchangé ou légèrement ajusté pour matcher) */}
         <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition-colors shadow-lg shadow-blue-900/20"
         >
          {labels.searchButton}
        </button>
      </div>
    </form>
  );
}