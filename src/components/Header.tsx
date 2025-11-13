// src/components/Header.tsx
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

// On définit les props qu'il attend
interface HeaderProps {
  lang: string;
  searchLabel: string;
  manifestoLabel: string;
  creditsLabel: string;
}

// Le composant n'est plus 'async' !
export default function Header({ lang, searchLabel, manifestoLabel, creditsLabel }: HeaderProps) {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href={`/${lang}`} className="text-xl font-bold">Nopasaran.ch</Link>
        <div className="flex items-center space-x-4">
          <Link href={`/${lang}/search`}>{searchLabel}</Link>
          <Link href={`/${lang}/manifesto`}>{manifestoLabel}</Link>
          <Link href={`/${lang}/credits`}>{creditsLabel}</Link>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
