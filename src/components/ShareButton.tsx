// src/components/ShareButton.tsx
'use client'; // <-- Très important ! Marque ce composant comme un Client Component.

import { useState, useEffect } from 'react';
import { FaShareAlt, FaCheck } from 'react-icons/fa'; // Importez une icône de coche pour le feedback

interface ShareButtonProps {
  title: string;
  text: string;
  // On passe les traductions en props pour les labels
  labels: {
    share: string;
    copied: string;
  };
}

export default function ShareButton({ title, text, labels }: ShareButtonProps) {
  const [buttonText, setButtonText] = useState(labels.share);
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    // On récupère l'URL actuelle côté client
    const url = window.location.href;

    // On vérifie si l'API Web Share est disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        });
        console.log('Contenu partagé avec succès !');
      } catch (error) {
        console.error('Erreur lors du partage :', error);
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
      // On copie l'URL dans le presse-papiers
      try {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setButtonText(labels.copied);
        // On réinitialise le bouton après 2 secondes
        setTimeout(() => {
          setIsCopied(false);
          setButtonText(labels.share);
        }, 2000);
      } catch (error) {
        console.error('Erreur lors de la copie dans le presse-papiers :', error);
        alert("Impossible de copier le lien. Veuillez le copier manuellement depuis la barre d'adresse.");
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors"
    >
      {isCopied ? <FaCheck /> : <FaShareAlt />}
      <span>{buttonText}</span>
    </button>
  );
}
