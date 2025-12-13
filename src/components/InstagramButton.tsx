"use client";

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { FaInstagram } from 'react-icons/fa';

interface InstagramButtonProps {
  title: string;
  subjectName: string; // <--- NOUVELLE PROP
  category: string;
  date: string;
  imageUrl?: string;
}

export default function InstagramButton({ title, subjectName, category, date, imageUrl }: InstagramButtonProps) {
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
          {/* 1. Header (Catégorie + Date) */}
          <div className="mt-48 flex flex-col items-center gap-4">
             <div className="flex gap-4">
                <span className="bg-red-600 text-white px-8 py-4 rounded-xl text-4xl font-bold uppercase tracking-wider shadow-lg">
                  {category}
                </span>
                <span className="bg-white/20 text-gray-200 px-8 py-4 rounded-xl text-4xl font-medium shadow-lg">
                  {date}
                </span>
             </div>
          </div>

          {/* 2. SUJET ET TITRE */}
          <div className="px-24 mt-16 mb-12 w-full text-center">
            
            {/* NOUVEAU : Le Nom du Sujet */}
            <p className="text-5xl font-bold text-gray-400 uppercase tracking-widest mb-6 drop-shadow-md">
              {subjectName}
            </p>

            {/* Le Titre de l'incident */}
            <h1 className="text-6xl font-black leading-snug text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 drop-shadow-sm">
              {title}
            </h1>
          </div>

          {/* 3. Image de l'incident */}
          {imageUrl && (
            <div className="w-[750px] h-[750px] relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt="Incident" 
                className="w-full h-full object-cover"
                crossOrigin="anonymous" 
              />
            </div>
          )}

          {/* 4. Footer */}
          <div className="absolute bottom-52 flex flex-col items-center gap-8">
            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>

            <div className="text-center">
                <p className="text-6xl font-bold tracking-tighter text-white mb-3 drop-shadow-md">
                    nopasaran.ch
                </p>
                <p className="text-4xl text-gray-400 font-light tracking-wide">
                    The Wall of Shame
                </p>
            </div>
            
            <div className="mt-6 bg-white/10 px-8 py-4 rounded-full border border-white/20">
                <p className="text-2xl text-white">🔗 Lien en bio / sticker</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}