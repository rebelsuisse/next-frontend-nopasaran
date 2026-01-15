// src/components/RandomButton.tsx
"use client";

import { useState } from 'react';
import { FaDice } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface RandomButtonProps {
  label: string;
  lang: string;
  size?: 'small' | 'large';
}

export default function RandomButton({ label, lang, size = 'small' }: RandomButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    setLoading(true);
    router.push(`/api/random?lang=${lang}`);
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