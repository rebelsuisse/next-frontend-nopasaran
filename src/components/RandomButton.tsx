"use client";

import { useState } from 'react';
import { FaDice } from 'react-icons/fa'; // Une icône de dé pour le hasard
import { useRouter } from 'next/navigation';

interface RandomButtonProps {
  label: string;
  lang: string;
}

export default function RandomButton({ label, lang }: RandomButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    setLoading(true);
    // On navigue vers l'API qui fera la redirection
    // On utilise window.location pour forcer un chargement complet si besoin, 
    // mais router.push marche aussi (l'API renvoie un 307 Redirect que le navigateur suit)
    router.push(`/api/random?lang=${lang}`);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
      title={label}
    >
      <FaDice size={20} className={loading ? "animate-spin" : ""} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}