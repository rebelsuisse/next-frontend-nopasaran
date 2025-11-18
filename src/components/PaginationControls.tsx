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

  const createPageURL = (pageNumber: number) => {
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
        // On rend le bouton circulaire et on ajuste le padding
        className={`p-3 rounded-full transition-colors ${
          hasPrevPage 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        aria-disabled={!hasPrevPage}
        // Ajout d'un titre pour l'accessibilité (info-bulle au survol)
        title="prev"
      >
        <FaArrowLeft />
      </Link>

      {/* Indicateur de page */}
      <span className="text-white font-semibold tabular-nums">
        {currentPage} / {pageCount}
      </span>

      {/* Bouton Suivant avec une icône */}
      <Link
        href={hasNextPage ? createPageURL(currentPage + 1) : '#'}
        className={`p-3 rounded-full transition-colors ${
          hasNextPage 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        aria-disabled={!hasNextPage}
        title="next"
      >
        <FaArrowRight />
      </Link>
    </div>
  );
}
