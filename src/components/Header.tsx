// src/components/Header.tsx
import Link from 'next/link';
// import LanguageSwitcher from './LanguageSwitcher'; // On l'ajoutera plus tard

export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/${lang}/" className="text-xl font-bold">No pasarán</Link>
        <div className="space-x-4">
          <Link href="/${lang}/search">Recherche</Link>
          <Link href="/${lang}/manifesto">Manifeste</Link>
          <Link href="/${lang}/credits">Remerciements</Link>
          {/* <LanguageSwitcher /> */}
        </div>
      </nav>
    </header>
  );
}
