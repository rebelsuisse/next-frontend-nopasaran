// src/components/LanguageSwitcher.tsx
'use client';

import { usePathname } from 'next/navigation';
import { ChangeEvent } from 'react';

export default function LanguageSwitcher() {
  const currentPathname = usePathname();
  const locales = ['fr-CH', 'de-CH'];

  // ÉTAPE 1 : On DÉDUIT la locale à chaque rendu, pas besoin d'un 'useEffect'
  const segments = currentPathname.split('/');
  const currentLocale = (segments.length > 1 && locales.includes(segments[1]))
    ? segments[1]
    : 'fr-CH'; // Valeur par défaut si aucune locale n'est trouvée

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value;

    // Si on est sur une page de détail d'incident...
    if (currentPathname.includes('/the-wall-of-shame/')) {
      // ...on redirige simplement vers la page d'accueil de la nouvelle langue.
      window.location.href = `/${newLocale}`;
    } else {
      // Sinon, on fait le changement normal.
      const pathWithoutLocale = currentPathname.startsWith(`/${currentLocale}`)
        ? currentPathname.substring(currentLocale.length + 1)
        : currentPathname;
      
      // S'assure qu'on a bien un slash au début si le chemin est vide
      const finalPath = pathWithoutLocale.startsWith('/') ? pathWithoutLocale : `/${pathWithoutLocale}`;

      const newUrl = `/${newLocale}${finalPath}`;
      
      window.location.href = newUrl;
    }
  };

  return (
    <select
      onChange={handleChange}
      // On utilise 'value' avec la locale calculée
      value={currentLocale}
      className="bg-gray-700 text-white p-1 rounded border border-gray-600"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc.split('-')[0].toUpperCase()}
        </option>
      ))}
    </select>
  );
}