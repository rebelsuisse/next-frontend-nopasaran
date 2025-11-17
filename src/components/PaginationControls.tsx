// src/components/PaginationControls.tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PaginationControlsProps {
  currentPage: number;
  pageCount: number;
}

export default function PaginationControls({ currentPage, pageCount }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // On ne montre rien s'il n'y a qu'une seule page ou moins
  if (pageCount <= 1) {
    return null;
  }

  const createPageURL = (pageNumber: number) => {
    // On crée une copie des paramètres actuels pour ne pas perdre les filtres !
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < pageCount;

  return (
    <div className="flex items-center gap-4">
      {/* Bouton Précédent */}
      <Link
        href={hasPrevPage ? createPageURL(currentPage - 1) : '#'}
        className={`px-4 py-2 rounded ${
          hasPrevPage ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        aria-disabled={!hasPrevPage}
      >
        Précédent
      </Link>

      {/* Indicateur de page */}
      <span className="text-white">
        Page {currentPage} sur {pageCount}
      </span>

      {/* Bouton Suivant */}
      <Link
        href={hasNextPage ? createPageURL(currentPage + 1) : '#'}
        className={`px-4 py-2 rounded ${
          hasNextPage ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        aria-disabled={!hasNextPage}
      >
        Suivant
      </Link>
    </div>
  );
}
