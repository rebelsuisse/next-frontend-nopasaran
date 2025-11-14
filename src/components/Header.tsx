// src/components/Header.tsx
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
// On importe les icônes dont on a besoin
import { FaHome, FaSearch, FaQuestionCircle, FaHeart } from 'react-icons/fa';

interface HeaderProps {
  lang: string;
}

// Le composant redevient simple et non-async
export default function Header({ lang }: HeaderProps) {
  return (
    <header className="bg-gray-800 text-white p-4 sticky top-0 z-50 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        
        {/* Partie Gauche : Icône Home et Titre */}
        <div className="flex items-center gap-4">
          <Link href={`/${lang}`} aria-label="Page d'accueil" className="hover:text-gray-300 transition-colors">
            <FaHome size={24} />
          </Link>
          <Link href={`/${lang}`} className="text-xl font-bold">
            No pasarán
          </Link>
        </div>

        {/* Partie Droite : Icônes de Navigation et Sélecteur de Langue */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <Link href={`/${lang}/search`} aria-label="Recherche" className="hover:text-gray-300 transition-colors">
            <FaSearch size={20} />
          </Link>
          <Link href={`/${lang}/manifesto`} aria-label="Manifeste" className="hover:text-gray-300 transition-colors">
            <FaQuestionCircle size={20} />
          </Link>
          <Link href={`/${lang}/credits`} aria-label="Crédits" className="hover:text-gray-300 transition-colors">
            <FaHeart size={20} />
          </Link>
          
          <span className="h-6 w-px bg-gray-600"></span> {/* Séparateur visuel */}

          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}