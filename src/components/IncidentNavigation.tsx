// src/components/IncidentNavigation.tsx
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaDice, FaSearch } from 'react-icons/fa';

interface IncidentNavigationProps {
  prevLink: string | null;
  nextLink: string | null;
  isRandomContext: boolean;
  isSearchContext: boolean; // <--- NOUVELLE PROP
  lang: string;
}

export default function IncidentNavigation({ prevLink, nextLink, isRandomContext, isSearchContext, lang }: IncidentNavigationProps) {
  const router = useRouter();

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (isRandomContext) router.push(`/api/random?lang=${lang}`);
        else if (prevLink) router.push(prevLink);
      }
      if (e.key === 'ArrowRight') {
        if (isRandomContext) router.push(`/api/random?lang=${lang}`);
        else if (nextLink) router.push(nextLink);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevLink, nextLink, isRandomContext, lang, router]);

  // Style "Bouton Rond" (Retour au style précédent)
  const buttonClass = "p-4 rounded-full bg-gray-700 hover:bg-blue-600 text-white transition-all shadow-lg flex items-center justify-center";
  const disabledClass = "p-4 rounded-full bg-gray-800 text-gray-600 cursor-not-allowed flex items-center justify-center opacity-50";

  // Fonction pour gérer le clic gauche (Random ou Link)
  const renderLeftButton = () => {
    if (isRandomContext) {
      return (
        <button onClick={() => router.push(`/api/random?lang=${lang}`)} className={buttonClass} title="Autre incident au hasard">
          <FaArrowLeft size={24} />
        </button>
      );
    }
    if (prevLink) {
      return (
        <Link href={prevLink} className={buttonClass} title="Plus récent">
          <FaArrowLeft size={24} />
        </Link>
      );
    }
    return <div className={disabledClass}><FaArrowLeft size={24} /></div>;
  };

  // Fonction pour gérer le clic droit
  const renderRightButton = () => {
    if (isRandomContext) {
      return (
        <button onClick={() => router.push(`/api/random?lang=${lang}`)} className={buttonClass} title="Autre incident au hasard">
          <FaArrowRight size={24} />
        </button>
      );
    }
    if (nextLink) {
      return (
        <Link href={nextLink} className={buttonClass} title="Plus ancien">
          <FaArrowRight size={24} />
        </Link>
      );
    }
    return <div className={disabledClass}><FaArrowRight size={24} /></div>;
  };

  return (
    <div className="flex justify-between items-center w-full mb-8">
      
      {/* GAUCHE */}
      {renderLeftButton()}

      {/* CENTRE (ICÔNES CONTEXTUELLES) */}
      <div className="text-gray-500">
        {isRandomContext ? (
          // Mode Aléatoire : Le Dé
          <FaDice size={32} className="text-purple-500" title="Mode Aléatoire" />
        ) : isSearchContext ? (
          // Mode Recherche : La Loupe (Lien retour recherche)
          <Link href={`/${lang}/search`} className="hover:text-blue-400 transition-colors" title="Retour à la recherche">
            <FaSearch size={28} />
          </Link>
        ) : (
          // Mode Chrono (Accueil) : RIEN
          <span className="w-8"></span> 
        )}
      </div>

      {/* DROITE */}
      {renderRightButton()}
      
    </div>
  );
}