// src/components/RandomButton.tsx
"use client";

import { useEffect, useState } from 'react';
import { FaDice } from 'react-icons/fa';

interface RandomButtonProps {
  label: string;
  lang: string;
  size?: 'small' | 'large';
}

export default function RandomButton({ label, lang, size = 'small' }: RandomButtonProps) {
  const [loading, setLoading] = useState(false);

  // Full navigation (see handleClick): on Back, the browser may restore this
  // page from its back/forward cache with loading still true, leaving the
  // button disabled and spinning.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setLoading(false);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  // /api/random is a route handler that redirects, not a page: the client
  // router can't reliably follow it, so use a full browser navigation.
  const handleClick = () => {
    setLoading(true);
    window.location.assign(`/api/random?lang=${lang}`);
  };

  const sizeClasses = size === 'large' 
    ? "px-5 py-2.5 text-lg" 
    : "px-3 py-1 text-sm";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 ${sizeClasses} bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed`}
      title={label}
    >
      {/* la classe pour l'animation */}
      <FaDice 
        size={size === 'large' ? 20 : undefined} 
        className={loading ? "animate-spin" : ""} 
      />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}