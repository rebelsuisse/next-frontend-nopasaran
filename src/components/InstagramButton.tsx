"use client";

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { FaInstagram } from 'react-icons/fa';

interface InstagramButtonProps {
  title: string;
  subjectName: string;
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
          {/* 1. Header */}
          <div className="mt-40 flex flex-col items-center gap-4">
             <div className="flex gap-6">
                <span className="bg-red-600 text-white px-8 py-3 rounded-xl text-3xl font-bold uppercase tracking-wider shadow-lg border border-red-500">
                  {category}
                </span>
                <span className="bg-white/20 text-gray-200 px-8 py-3 rounded-xl text-3xl font-medium shadow-lg backdrop-blur-sm">
                  {date}
                </span>
             </div>
          </div>

          {/* 2. SUJET ET TITRE */}
          <div className="px-24 mt-16 mb-10 w-full text-center">
            <p className="text-4xl font-bold text-gray-400 uppercase tracking-widest mb-6 drop-shadow-md">
              {subjectName}
            </p>
            <h1 className="text-6xl font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 drop-shadow-lg">
              {title}
            </h1>
          </div>

          {/* 3. Image (Taille augmentée à 720px grâce au gain de place) */}
          {imageUrl && (
            <div className="w-[720px] h-[720px] relative rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.7)] border-4 border-gray-600/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt="Incident" 
                className="w-full h-full object-cover"
                crossOrigin="anonymous" 
              />
            </div>
          )}

          {/* 4. FOOTER COMPACT (Ligne horizontale) */}
          <div className="absolute bottom-32 flex flex-col items-center gap-8">
            
            {/* Conteneur Ligne : Logo + Texte */}
            <div className="flex items-center gap-6 bg-white/5 px-8 py-4 rounded-full border border-white/10 backdrop-blur-sm">
                
                {/* Logo Rond */}
                <div className="w-24 h-24 bg-white rounded-full p-2 shadow-xl flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
                </div>

                {/* Textes alignés à gauche */}
                <div className="text-left flex flex-col justify-center">
                    <p className="text-5xl font-bold tracking-tighter text-white mb-1 drop-shadow-md leading-none">
                        nopasaran.ch
                    </p>
                    <p className="text-2xl text-gray-400 font-light tracking-wide uppercase leading-none">
                        The Wall of Shame
                    </p>
                </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}