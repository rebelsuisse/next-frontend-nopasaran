// src/components/SlugUpdater.tsx
'use client';

import { useEffect } from 'react';
import { useSlugStore } from '@/lib/store';

export default function SlugUpdater({ slugs }: { slugs: Record<string, string> }) {
  const setSlugs = useSlugStore((state) => state.setSlugs);

  useEffect(() => {
    // Dès que la page charge, on met à jour les slugs disponibles
    setSlugs(slugs);
    
    // Nettoyage quand on quitte la page
    return () => setSlugs(null);
  }, [slugs, setSlugs]);

  return null; // Il est invisible
}
