"use client";

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { FaInstagram } from 'react-icons/fa';

interface InstagramButtonProps {
  title: string;
  category: string;
  date: string;
  imageUrl?: string;
}

export default function InstagramButton({ title, category, date, imageUrl }: InstagramButtonProps) {
  const storyRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateStory = async () => {
    if (!storyRef.current) return;
    setLoading(true);

    try {
      const dataUrl = await toPng(storyRef.current, { 
        quality: 0.95,
        fontEmbedCSS: '', 
        cacheBust: true, 
      });
      
      const link = document.createElement('a');
      link.download = `story-nopasaran-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
    } catch (err) {
      console.error('Erreur génération story', err);
      alert("Erreur lors de la génération. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleGenerateStory}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1 text-sm bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-full transition-colors"
        title="Générer une Story"
      >
        <FaInstagram />
        <span>{loading ? '...' : 'Story'}</span>
      </button>

      {/* --- ZONE CACHÉE --- */}
      <div style={{ position: 'fixed', top: '-3000px', left: '-3000px' }}>
        <div 
          ref={storyRef}
          className="w-[1080px] h-[1920px] bg-gray-900 text-white flex flex-col items-center relative"
          style={{ background: 'linear-gradient(135deg, #111827 0%, #374151 100%)' }}
        >
          {/* 1. Header (Descendu plus bas pour éviter la barre de profil Insta) */}
          {/* Passage de mt-24 à mt-48 (environ 190px du haut) */}
          <div className="mt-48 flex flex-col items-center gap-4">
             <div className="flex gap-4">
                <span className="bg-red-600 text-white px-6 py-2 rounded-lg text-2xl font-bold uppercase tracking-wider">
                  {category}
                </span>
                <span className="bg-white/20 text-gray-200 px-6 py-2 rounded-lg text-2xl font-medium">
                  {date}
                </span>
             </div>
          </div>

          {/* 2. Titre Principal (Plus de marge sur les côtés) */}
          {/* Passage de px-16 à px-24 */}
          <div className="px-24 mt-16 mb-12 w-full">
            <h1 className="text-6xl font-black text-center leading-snug text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 drop-shadow-sm">
              {title}
            </h1>
          </div>

          {/* 3. Image (Rétrécie pour laisser de la marge sur les côtés) */}
          {/* Passage de w-[900px] à w-[860px] */}
          {imageUrl && (
            <div className="w-[860px] h-[800px] relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt="Incident" 
                className="w-full h-full object-cover"
                crossOrigin="anonymous" 
              />
            </div>
          )}

          {/* 4. Footer (Remonté pour éviter la barre de message Insta) */}
          {/* Passage de bottom-32 à bottom-52 (environ 200px du bas) */}
          <div className="absolute bottom-52 flex flex-col items-center gap-6">
            
            {/* Logo */}
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src="/icon.png" 
                    alt="Logo"
                    className="w-full h-full object-contain"
                />
            </div>

            {/* URL */}
            <div className="text-center">
                <p className="text-5xl font-bold tracking-tighter text-white mb-2">
                    nopasaran.ch
                </p>
                <p className="text-2xl text-gray-400 font-light">
                    The Wall of Shame
                </p>
            </div>
            
            {/* Sticker */}
            <div className="mt-4 bg-white/10 px-6 py-3 rounded-full border border-white/20">
                <p className="text-xl text-white">🔗 Lien en bio / sticker</p>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}