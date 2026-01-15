// src/components/ShareButton.tsx
'use client';

import { useState } from 'react';
import { FaShareAlt, FaCheck } from 'react-icons/fa';

interface ShareButtonProps {
  title: string;
  text: string;
  labels: {
    share: string;
    copied: string;
  };
}

export default function ShareButton({ title, text, labels }: ShareButtonProps) {
  const [buttonText, setButtonText] = useState(labels.share);
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    // ... (votre logique existante ne change pas) ...
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) { console.error(error); }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setButtonText(labels.copied);
        setTimeout(() => { setIsCopied(false); setButtonText(labels.share); }, 2000);
      } catch (error) { alert("Erreur copie"); }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors shadow-md"
    >
      {isCopied ? <FaCheck /> : <FaShareAlt />}
      {/* Texte caché sur mobile */}
      <span className="hidden sm:inline">{buttonText}</span>
    </button>
  );
}
