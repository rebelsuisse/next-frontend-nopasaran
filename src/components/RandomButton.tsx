// src/components/RandomButton.tsx
"use client";

import { useState } from 'react';
import { FaDice } from 'react-icons/fa';
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
    router.push(`/api/random?lang=${lang}`);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
      title={label}
    >
      <FaDice />
      {/* Texte caché sur mobile */}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
