// src/components/Header.tsx
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
// Le type de la fonction 't' est un peu complexe, on peut le simplifier
// pour nos besoins. C'est une fonction qui prend un string et retourne un string.
type TFunction = (key: string) => string;

// On définit les nouvelles props
interface HeaderProps {
  lang: string;
  t: TFunction;
}

// Le composant reste non-async, c'est le parent qui gère l'asynchronisme.
export default function Header({ lang, t }: HeaderProps) {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href={`/${lang}`} className="text-xl font-bold">No pasarán</Link>
        <div className="flex items-center space-x-4">
          {/* Le Header utilise maintenant 't' directement */}
          <Link href={`/${lang}/search`}>{t('search')}</Link>
          <Link href={`/${lang}/manifesto`}>{t('manifesto')}</Link>
          <Link href={`/${lang}/credits`}>{t('credits')}</Link>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
