// src/components/LanguageSwitcher.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChangeEvent } from 'react';
import { useSlugStore } from '@/lib/store'; // <--- IMPORT DU STORE

export default function LanguageSwitcher() {
  const currentPathname = usePathname();
  const router = useRouter();
  const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'];
  
  // On récupère les slugs depuis le store global
  const translatedSlugs = useSlugStore((state) => state.slugs);

  const segments = currentPathname.split('/');
  const currentLocale = (segments.length > 1 && locales.includes(segments[1]))
    ? segments[1]
    : 'fr-CH';

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value;

    // 1. CAS SPÉCIAL : On est sur une page article et on a la traduction
    if (translatedSlugs && translatedSlugs[newLocale]) {
      router.push(`/${newLocale}/the-wall-of-shame/${translatedSlugs[newLocale]}`);
      return;
    }

    // 2. CAS : On est sur une page article mais PAS de traduction (ex: pas de version EN)
    // On retourne à la liste des incidents de la nouvelle langue
    if (currentPathname.includes('/the-wall-of-shame/')) {
       router.push(`/${newLocale}`);
       return;
    }

    // 3. CAS STANDARD (Accueil, Search...)
    const pathWithoutLocale = currentPathname.startsWith(`/${currentLocale}`)
      ? currentPathname.substring(currentLocale.length + 1)
      : currentPathname;
      
    const finalPath = pathWithoutLocale.startsWith('/') ? pathWithoutLocale : `/${pathWithoutLocale}`;
    router.push(`/${newLocale}${finalPath}`);
  };

  return (
    <select
      onChange={handleChange}
      value={currentLocale}
      className="bg-gray-700 text-white p-1 rounded border border-gray-600 cursor-pointer"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc.split('-')[0].toUpperCase()}
        </option>
      ))}
    </select>
  );
}