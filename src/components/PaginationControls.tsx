// src/components/PaginationControls.tsx
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface PaginationControlsProps {
  currentPage: number;
  pageCount: number;
}

export default function PaginationControls({ currentPage, pageCount }: PaginationControlsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pageCount <= 1) {
    return null;
  }

  // --- C'EST ICI QUE SE TROUVE LA CORRECTION ---
  const createPageURL = (pageNumber: number) => {
    // On crée une copie modifiable des paramètres actuels
    const params = new URLSearchParams(searchParams.toString());

    if (pageNumber <= 1) {
      // Si on retourne à la page 1, on SUPPRIME le paramètre 'page'
      // Cela générera "/fr-CH" au lieu de "/fr-CH?page=1"
      params.delete('page');
    } else {
      // Sinon, on définit le paramètre normalement
      params.set('page', pageNumber.toString());
    }

    // On génère la chaîne de requête (ex: "q=udc&page=2" ou "")
    const queryString = params.toString();

    // Si queryString est vide (page 1 sans recherche), on renvoie juste le chemin
    // Sinon on ajoute le "?"
    return queryString ? `${pathname}?${queryString}` : pathname;
  };
  // ---------------------------------------------

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < pageCount;

  return (
    <div className="flex items-center gap-4">
      {/* Bouton Précédent */}
      <Link
        // Utilise la nouvelle logique pour l'URL
        href={hasPrevPage ? createPageURL(currentPage - 1) : '#'}
        className={`p-3 rounded-full transition-colors ${
          hasPrevPage 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-700 text-gray-500 cursor-not-allowed pointer-events-none' // Ajout de pointer-events-none pour éviter le clic si désactivé
        }`}
        aria-disabled={!hasPrevPage}
        tabIndex={!hasPrevPage ? -1 : undefined} // Accessibilité : on ne peut pas tabuler dessus si désactivé
        title="Page précédente"
      >
        <FaArrowLeft />
      </Link>

      {/* Indicateur de page */}
      <span className="text-white font-semibold tabular-nums">
        {currentPage} / {pageCount}
      </span>

      {/* Bouton Suivant */}
      <Link
        href={hasNextPage ? createPageURL(currentPage + 1) : '#'}
        className={`p-3 rounded-full transition-colors ${
          hasNextPage 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-700 text-gray-500 cursor-not-allowed pointer-events-none'
        }`}
        aria-disabled={!hasNextPage}
        tabIndex={!hasNextPage ? -1 : undefined}
        title="Page suivante"
      >
        <FaArrowRight />
      </Link>
    </div>
  );
}