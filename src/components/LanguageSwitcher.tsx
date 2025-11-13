// src/components/LanguageSwitcher.tsx
'use client'; // Ce composant a besoin d'interactivité côté client

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const locales = ['fr-CH', 'de-CH', 'it-CH', 'en'];

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = event.target.value;
    
    // On reconstruit le chemin avec la nouvelle langue
    // /fr-CH/page -> /de-CH/page
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.replace(newPathname);
  };

  return (
    <select
      onChange={handleChange}
      defaultValue={locale}
      className="bg-gray-700 text-white p-1 rounded"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc.split('-')[0].toUpperCase()}
        </option>
      ))}
    </select>
  );
}
