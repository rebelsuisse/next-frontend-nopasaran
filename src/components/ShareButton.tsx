// src/components/ShareButton.tsx
'use client';

import { useState } from 'react';
import { FaShareAlt, FaCheck } from 'react-icons/fa';

interface ShareButtonProps {
  title: string;
  text: string;
  labels: { share: string; copied: string };
  size?: 'small' | 'large';
}

export default function ShareButton({ title, text, labels, size = 'small' }: ShareButtonProps) {
  const [buttonText, setButtonText] = useState(labels.share);
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.origin + window.location.pathname;
    if (navigator.share) {
        try { await navigator.share({ title, text, url }); } catch (e) { console.error(e); }
    } else {
        try {
            await navigator.clipboard.writeText(url);
            setIsCopied(true);
            setButtonText(labels.copied);
            setTimeout(() => { setIsCopied(false); setButtonText(labels.share); }, 2000);
        } catch (e) { alert("Erreur copie"); }
    }
  };

  const sizeClasses = size === 'large' 
    ? "px-5 py-2.5 text-base" 
    : "px-3 py-1 text-sm";

  const textVisibility = size === 'large' ? "hidden sm:inline" : "inline";

  // --- CORRECTION ICI ---
  // Si Large (Homepage) -> 20px
  // Si Small (Detail) -> undefined (laisse l'icône s'adapter à la taille du texte, comme pour le bouton Story)
  const iconSize = size === 'large' ? 20 : undefined;

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 ${sizeClasses} bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors shadow-md`}
    >
      {isCopied 
        ? <FaCheck size={iconSize} /> 
        : <FaShareAlt size={iconSize} />
      }
      
      <span className={textVisibility}>{buttonText}</span>
    </button>
  );
}